/** Guitar-focused band (Hz). */
export const MIN_FREQUENCY = 60;
export const MAX_FREQUENCY = 1200;

/** NSDF peak must reach this fraction of the strongest peak in the search band. */
const PEAK_THRESHOLD_RATIO = 0.3;

/** If a half-period (2× tau) peak is this strong, prefer the longer period (fundamental). */
const SUBHARMONIC_RATIO = 0.88;

/** For `lowestStrong` mode: keep peaks at least this strong relative to the band winner. */
const LOWEST_STRONG_PEAK_RATIO = 0.9;

/** Minimum RMS to attempt pitch (original standalone tuner used 0.01). */
const MIN_SIGNAL_RMS = 0.01;

let cachedHann = new Float32Array(0);

function ensureHann(size) {
  if (cachedHann.length === size) return cachedHann;
  cachedHann = new Float32Array(size);
  if (size <= 1) return cachedHann;
  for (let i = 0; i < size; i++) {
    cachedHann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
  }
  return cachedHann;
}

function rms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

function computeNsdf(samples, minTau, maxTau, nsdfOut) {
  const size = samples.length;

  for (let tau = minTau; tau <= maxTau; tau++) {
    let acf = 0;
    let energy = 0;
    const overlap = size - tau;
    for (let i = 0; i < overlap; i++) {
      const a = samples[i];
      const b = samples[i + tau];
      acf += a * b;
      energy += a * a + b * b;
    }
    nsdfOut[tau] = energy > 0 ? (2 * acf) / energy : 0;
  }
}

function isLocalMaximum(nsdf, tau) {
  const v = nsdf[tau];
  return v > nsdf[tau - 1] && v >= nsdf[tau + 1];
}

function refineTauParabolic(nsdf, tau) {
  const y0 = nsdf[tau - 1];
  const y1 = nsdf[tau];
  const y2 = nsdf[tau + 1];
  const denom = y0 - 2 * y1 + y2;
  if (Math.abs(denom) < 1e-12) return tau;
  const offset = (0.5 * (y0 - y2)) / denom;
  return tau + Math.max(-0.5, Math.min(0.5, offset));
}

function preferFundamental(nsdf, tau, maxTau) {
  let period = tau;
  while (
    period * 2 <= maxTau &&
    nsdf[period * 2] >= nsdf[period] * SUBHARMONIC_RATIO
  ) {
    period *= 2;
  }
  return period;
}

function tauBoundsForHint(hintFrequency, sampleRate, windowCents) {
  const ratio = 2 ** (windowCents / 1200);
  const fMin = hintFrequency / ratio;
  const fMax = hintFrequency * ratio;
  const minTau = Math.max(2, Math.floor(sampleRate / fMax));
  const maxTau = Math.min(
    Math.ceil(sampleRate / fMin),
    Math.floor(sampleRate / MIN_FREQUENCY),
  );
  return { minTau, maxTau };
}

function defaultTauBounds(sampleRate) {
  return {
    minTau: Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY)),
    maxTau: Math.floor(sampleRate / MIN_FREQUENCY),
  };
}

/**
 * @param {'strongest'|'lowestStrong'} mode
 */
function selectBestTau(nsdf, minTau, maxTau, cutoff, mode) {
  let bestTau = -1;
  let bestValue = -Infinity;
  /** @type {{ tau: number, value: number }[]} */
  const peaks = [];

  for (let tau = minTau + 1; tau < maxTau; tau++) {
    if (!isLocalMaximum(nsdf, tau) || nsdf[tau] < cutoff) continue;

    const candidate = preferFundamental(nsdf, tau, maxTau);
    const value = nsdf[candidate];
    peaks.push({ tau: candidate, value });

    if (value > bestValue) {
      bestValue = value;
      bestTau = candidate;
    }
  }

  if (bestTau < 0) return -1;

  if (mode === 'lowestStrong') {
    const floor = bestValue * LOWEST_STRONG_PEAK_RATIO;
    let longestTau = bestTau;
    for (let i = 0; i < peaks.length; i++) {
      const { tau, value } = peaks[i];
      if (value >= floor && tau > longestTau) {
        longestTau = tau;
      }
    }
    return longestTau;
  }

  return bestTau;
}

/**
 * McLeod-style NSDF pitch core (shared by pluggable strategies).
 *
 * @param {Float32Array} buffer
 * @param {number} sampleRate
 * @param {{
 *   hintFrequency?: number,
 *   hintWindowCents?: number,
 *   peakSelection?: 'strongest' | 'lowestStrong',
 * }} [options]
 * @returns {number|null}
 */
export function detectPitchMpm(buffer, sampleRate, options = {}) {
  const SIZE = buffer.length;
  if (SIZE < 4 || !sampleRate) return null;

  if (rms(buffer) < MIN_SIGNAL_RMS) return null;

  const window = ensureHann(SIZE);
  const samples = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    samples[i] = buffer[i] * window[i];
  }

  const { hintFrequency, hintWindowCents = 80, peakSelection = 'strongest' } = options;
  let { minTau, maxTau } = hintFrequency
    ? tauBoundsForHint(hintFrequency, sampleRate, hintWindowCents)
    : defaultTauBounds(sampleRate);

  maxTau = Math.min(maxTau, SIZE - 2);
  if (minTau >= maxTau - 2) return null;

  const nsdf = new Float32Array(maxTau + 1);
  computeNsdf(samples, minTau, maxTau, nsdf);

  let bandMax = -Infinity;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (nsdf[tau] > bandMax) bandMax = nsdf[tau];
  }
  if (bandMax < PEAK_THRESHOLD_RATIO) return null;

  const cutoff = bandMax * PEAK_THRESHOLD_RATIO;

  const bestTau = selectBestTau(nsdf, minTau, maxTau, cutoff, peakSelection);
  if (bestTau < 0) return null;

  const refinedTau = refineTauParabolic(nsdf, bestTau);
  const frequency = sampleRate / refinedTau;

  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null;
  return frequency;
}

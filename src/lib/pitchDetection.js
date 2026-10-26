/** Guitar-focused band (Hz). */
const MIN_FREQUENCY = 60;
const MAX_FREQUENCY = 1200;

/** NSDF peak must reach this fraction of the strongest peak in the search band. */
const PEAK_THRESHOLD_RATIO = 0.3;

/** If a half-period (2× tau) peak is this strong, prefer the longer period (fundamental). */
const SUBHARMONIC_RATIO = 0.88;

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

/**
 * Normalized Square Difference Function (McLeod & Wyvill).
 * Ratio cancels the (N - tau) sample-count bias of raw autocorrelation sums.
 */
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

/** Sub-sample tau via parabolic fit on three NSDF samples. */
function refineTauParabolic(nsdf, tau) {
  const y0 = nsdf[tau - 1];
  const y1 = nsdf[tau];
  const y2 = nsdf[tau + 1];
  const denom = y0 - 2 * y1 + y2;
  if (Math.abs(denom) < 1e-12) return tau;
  const offset = (0.5 * (y0 - y2)) / denom;
  return tau + Math.max(-0.5, Math.min(0.5, offset));
}

/**
 * Walk toward longer periods while the subharmonic (2× tau) remains almost as strong.
 * Reduces locking onto harmonics when the fundamental is present but slightly weaker.
 */
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

function tauBoundsForHint(hintFrequency, sampleRate, windowCents = 80) {
  const ratio = 2 ** (windowCents / 1200);
  const fMin = hintFrequency / ratio;
  const fMax = hintFrequency * ratio;
  const minTau = Math.max(2, Math.floor(sampleRate / fMax));
  const maxTau = Math.min(Math.ceil(sampleRate / fMin), Math.floor(sampleRate / MIN_FREQUENCY));
  return { minTau, maxTau };
}

function defaultTauBounds(sampleRate) {
  return {
    minTau: Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY)),
    maxTau: Math.floor(sampleRate / MIN_FREQUENCY),
  };
}

/**
 * McLeod-style monophonic pitch estimate with harmonic rejection and sub-sample refinement.
 *
 * @param {Float32Array} buffer - time-domain samples
 * @param {number} sampleRate
 * @param {{ hintFrequency?: number, hintWindowCents?: number }} [options]
 *   When `hintFrequency` is set (e.g. selected string target), search is narrowed and
 *   the strongest NSDF peak in that band wins — much finer cents resolution while tuning.
 * @returns {number|null} frequency in Hz
 */
export function detectPitch(buffer, sampleRate, options = {}) {
  const SIZE = buffer.length;
  if (SIZE < 4 || !sampleRate) return null;

  if (rms(buffer) < 0.008) return null;

  const window = ensureHann(SIZE);
  const samples = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    samples[i] = buffer[i] * window[i];
  }

  const { hintFrequency, hintWindowCents = 80 } = options;
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

  let bestTau = -1;
  let bestValue = -Infinity;

  for (let tau = minTau + 1; tau < maxTau; tau++) {
    if (!isLocalMaximum(nsdf, tau) || nsdf[tau] < cutoff) continue;

    const candidate = preferFundamental(nsdf, tau, maxTau);
    const value = nsdf[candidate];

    if (value > bestValue) {
      bestValue = value;
      bestTau = candidate;
    }
  }

  if (bestTau < 0) return null;

  const refinedTau = refineTauParabolic(nsdf, bestTau);
  const frequency = sampleRate / refinedTau;

  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null;
  return frequency;
}

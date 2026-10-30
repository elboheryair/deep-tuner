export const CAPTURE_MS = 220;
export const MIN_RINGING_RATIO = 0.38;

export function measureRms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/** @param {import('./types.js').SampleCaptureState} state */
export function beginSampleCapture(state, peakRms, now) {
  state.captureUntil = now + CAPTURE_MS;
  state.peakRmsAtTrigger = peakRms;
  state.captureFreqs.length = 0;
  state.pendingFlush = false;
}

/**
 * @param {import('./types.js').SampleCaptureState} state
 * @param {Float32Array} buffer
 * @param {number} now
 * @returns {boolean} true while capture window is active
 */
export function tickSampleCapture(state, buffer, now) {
  const level = measureRms(buffer);
  const inTimeWindow = now < state.captureUntil;
  const stillRinging =
    state.peakRmsAtTrigger > 0 &&
    level >= state.peakRmsAtTrigger * MIN_RINGING_RATIO;

  if (inTimeWindow && stillRinging) {
    return true;
  }

  state.pendingFlush = state.captureFreqs.length > 0;
  return false;
}

/** @param {import('./types.js').SampleCaptureState} state */
export function flushCaptureMedian(state) {
  state.pendingFlush = false;
  const samples = state.captureFreqs;
  if (!samples.length) return null;

  const sorted = samples.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  state.captureFreqs.length = 0;
  return median;
}

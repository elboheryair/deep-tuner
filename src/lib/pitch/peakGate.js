import {
  beginSampleCapture,
  flushCaptureMedian,
  measureRms,
  tickSampleCapture,
} from './sampleCapture.js';

/** Minimum envelope level to treat as a pluck (not room noise). */
const ATTACK_RMS = 0.011;

/** Level must fall below this before the next pluck can trigger. */
const SILENCE_RMS = 0.007;

/** First downward step after a local RMS max must drop by at least this fraction. */
const PEAK_DROP_RATIO = 0.03;

/**
 * @returns {import('./types.js').PeakGateState}
 */
export function createPeakGateState() {
  return {
    phase: 'armed',
    prevRms: 0,
    prevPrevRms: 0,
    captureUntil: 0,
    peakRmsAtTrigger: 0,
    captureFreqs: [],
    pendingFlush: false,
  };
}

/** @param {import('./types.js').PeakGateState} state */
export function resetPeakGateState(state) {
  state.phase = 'armed';
  state.prevRms = 0;
  state.prevPrevRms = 0;
  state.captureUntil = 0;
  state.peakRmsAtTrigger = 0;
  state.captureFreqs.length = 0;
  state.pendingFlush = false;
}

/**
 * @param {Float32Array} buffer
 * @param {import('./types.js').PeakGateState} state
 * @param {number} [now]
 */
export function shouldAnalyzeAtPeak(buffer, state, now = performance.now()) {
  const level = measureRms(buffer);

  if (state.phase === 'capturing') {
    state.prevPrevRms = state.prevRms;
    state.prevRms = level;
    if (tickSampleCapture(state, buffer, now)) {
      return true;
    }
    state.phase = 'cooldown';
    return false;
  }

  if (state.phase === 'cooldown') {
    state.prevPrevRms = state.prevRms;
    state.prevRms = level;
    if (level < SILENCE_RMS) {
      state.phase = 'armed';
    }
    return false;
  }

  const localMaximumPassed =
    state.prevRms >= ATTACK_RMS &&
    state.prevRms >= state.prevPrevRms &&
    level <= state.prevRms * (1 - PEAK_DROP_RATIO);

  const peakRms = state.prevRms;
  state.prevPrevRms = state.prevRms;
  state.prevRms = level;

  if (localMaximumPassed) {
    state.phase = 'capturing';
    beginSampleCapture(state, peakRms, now);
    return true;
  }

  return false;
}

export { flushCaptureMedian };

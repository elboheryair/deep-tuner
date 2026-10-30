import { BEAT_SAMPLE_DELAY_MS } from '../../config/metronome.js';
import { beginSampleCapture, CAPTURE_MS } from './sampleCapture.js';

/**
 * @returns {import('./types.js').BeatGateState}
 */
export function createBeatGateState() {
  return {
    phase: 'idle',
    lastBeatSerial: 0,
    captureStartAt: 0,
    captureUntil: 0,
    peakRmsAtTrigger: 0,
    captureFreqs: [],
    pendingFlush: false,
  };
}

/** @param {import('./types.js').BeatGateState} state */
export function resetBeatGateState(state) {
  state.phase = 'idle';
  state.lastBeatSerial = 0;
  state.captureStartAt = 0;
  state.captureUntil = 0;
  state.peakRmsAtTrigger = 0;
  state.captureFreqs.length = 0;
  state.pendingFlush = false;
}

function startCaptureWindow(state, now) {
  state.phase = 'capturing';
  beginSampleCapture(state, 1, now);
  state.captureUntil = now + CAPTURE_MS;
}

/**
 * @param {Float32Array} buffer
 * @param {import('./types.js').BeatGateState} state
 * @param {import('./types.js').MetronomeClock} metronome
 * @param {number} [now]
 */
export function shouldAnalyzeOnBeat(buffer, state, metronome, now = performance.now()) {
  if (!metronome?.enabledRef?.current) {
    return false;
  }

  const beatSerial = metronome.beatSerialRef.current;

  if (state.phase === 'capturing') {
    if (now < state.captureUntil) {
      return true;
    }
    state.pendingFlush = state.captureFreqs.length > 0;
    state.phase = 'idle';
    return false;
  }

  if (state.phase === 'waiting') {
    if (now >= state.captureStartAt) {
      startCaptureWindow(state, now);
      return true;
    }
    return false;
  }

  if (beatSerial <= state.lastBeatSerial) {
    return false;
  }

  state.lastBeatSerial = beatSerial;

  if (BEAT_SAMPLE_DELAY_MS > 0) {
    state.phase = 'waiting';
    state.captureStartAt = now + BEAT_SAMPLE_DELAY_MS;
    return false;
  }

  startCaptureWindow(state, now);
  return true;
}

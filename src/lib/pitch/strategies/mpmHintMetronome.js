import { detectPitchMpm } from '../mpmCore.js';
import {
  createBeatGateState,
  shouldAnalyzeOnBeat,
} from '../beatGate.js';
import { flushCaptureMedian } from '../sampleCapture.js';

export const MPM_HINT_METRONOME_STRATEGY_ID = 'mpm-hint-metronome';

/**
 * Target-biased NSDF on metronome beats only (play on the click).
 */
export const mpmHintMetronomeStrategy = {
  id: MPM_HINT_METRONOME_STRATEGY_ID,
  label: 'MPM (target + metronome)',
  description:
    'Turn the metronome on and pluck on each beat. Analyzes briefly after every click, then ignores input until the next beat.',
  detect(buffer, sampleRate, options = {}) {
    const metronome = options.metronomeClock;
    if (!metronome) return null;

    const gate = options.beatGateState ?? createBeatGateState();

    if (gate.pendingFlush) {
      return flushCaptureMedian(gate);
    }

    if (!shouldAnalyzeOnBeat(buffer, gate, metronome)) {
      return null;
    }

    const { hintFrequency, hintWindowCents } = options;
    const frequency = detectPitchMpm(buffer, sampleRate, {
      hintFrequency,
      hintWindowCents,
      peakSelection: 'strongest',
    });

    if (frequency != null) {
      gate.captureFreqs.push(frequency);
    }

    return frequency;
  },
};

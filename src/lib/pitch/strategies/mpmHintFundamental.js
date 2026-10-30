import { detectPitchMpm } from '../mpmCore.js';
import {
  createPeakGateState,
  flushCaptureMedian,
  shouldAnalyzeAtPeak,
} from '../peakGate.js';

/** Registry id for the pluck-peak-gated strategy (used by useTuner to pass gate state only when needed). */
export const MPM_HINT_FUNDAMENTAL_STRATEGY_ID = 'mpm-hint-fundamental';

/**
 * Target-biased search with fundamental peak selection, analyzed only at envelope peaks (plucks).
 */
export const mpmHintFundamentalStrategy = {
  id: MPM_HINT_FUNDAMENTAL_STRATEGY_ID,
  label: 'MPM (target + pluck peaks)',
  description:
    'After each pluck peak, listens briefly (~220ms) while the note is strong, then ignores decay/noise until the next attack.',
  detect(buffer, sampleRate, options = {}) {
    const gate = options.peakGateState ?? createPeakGateState();

    if (gate.pendingFlush) {
      return flushCaptureMedian(gate);
    }

    if (!shouldAnalyzeAtPeak(buffer, gate)) {
      return null;
    }

    const frequency = detectPitchMpm(buffer, sampleRate, {
      ...options,
      peakSelection: 'lowestStrong',
    });

    if (frequency != null) {
      gate.captureFreqs.push(frequency);
    }

    return frequency;
  },
};

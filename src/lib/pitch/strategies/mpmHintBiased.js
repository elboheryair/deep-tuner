import { detectPitchMpm } from '../mpmCore.js';

/**
 * Strategy A — production default: continuous target-biased NSDF (unchanged behavior).
 * Does not use pluck peak gating; analyzes every frame while signal is above RMS floor.
 */
export const mpmHintBiasedStrategy = {
  id: 'mpm-hint-biased',
  label: 'MPM (target-biased)',
  description:
    'McLeod NSDF with harmonic rejection; narrows search around the selected string for noise resistance.',
  detect(buffer, sampleRate, options = {}) {
    const { hintFrequency, hintWindowCents } = options;
    return detectPitchMpm(buffer, sampleRate, {
      hintFrequency,
      hintWindowCents,
      peakSelection: 'strongest',
    });
  },
};

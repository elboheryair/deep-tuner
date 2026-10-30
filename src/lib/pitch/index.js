import { DEFAULT_PITCH_STRATEGY_ID } from '../../config/pitchDetection.js';
import { registerDefaultPitchStrategies } from './registerDefaults.js';
import {
  detectPitchWithStrategy,
  getActivePitchStrategyId,
  listPitchStrategies,
  registerPitchStrategy,
  resolvePitchStrategy,
  setActivePitchStrategyId,
} from './registry.js';

registerDefaultPitchStrategies();

/**
 * Detect pitch using the active strategy (or optional per-call override).
 *
 * @param {Float32Array} buffer
 * @param {number} sampleRate
 * @param {import('./types.js').PitchDetectionOptions & { strategyId?: string }} [options]
 * @returns {number|null}
 */
export function detectPitch(buffer, sampleRate, options = {}) {
  const { strategyId, ...strategyOptions } = options;
  return detectPitchWithStrategy(
    buffer,
    sampleRate,
    strategyOptions,
    strategyId,
  );
}

export {
  DEFAULT_PITCH_STRATEGY_ID,
  detectPitchWithStrategy,
  getActivePitchStrategyId,
  listPitchStrategies,
  registerPitchStrategy,
  resolvePitchStrategy,
  setActivePitchStrategyId,
};

import { DEFAULT_PITCH_STRATEGY_ID } from '../../config/pitchDetection.js';

/** @type {Map<string, import('./types.js').PitchDetectionStrategy>} */
const strategies = new Map();

let activeStrategyId = DEFAULT_PITCH_STRATEGY_ID;

/**
 * @param {import('./types.js').PitchDetectionStrategy} strategy
 */
export function registerPitchStrategy(strategy) {
  if (!strategy?.id || typeof strategy.detect !== 'function') {
    throw new Error('Invalid pitch strategy: requires id and detect()');
  }
  strategies.set(strategy.id, strategy);
}

/**
 * @param {string} [strategyId]
 * @returns {import('./types.js').PitchDetectionStrategy}
 */
export function resolvePitchStrategy(strategyId = activeStrategyId) {
  const id = strategyId ?? activeStrategyId;
  const strategy = strategies.get(id);
  if (strategy) return strategy;

  const fallback = strategies.get(DEFAULT_PITCH_STRATEGY_ID);
  if (fallback) return fallback;

  throw new Error(
    `Pitch strategy "${id}" is not registered and no default is available.`,
  );
}

/** @returns {import('./types.js').PitchDetectionStrategy[]} */
export function listPitchStrategies() {
  return [...strategies.values()];
}

export function getActivePitchStrategyId() {
  return activeStrategyId;
}

/**
 * @param {string} strategyId
 */
export function setActivePitchStrategyId(strategyId) {
  if (!strategies.has(strategyId)) {
    throw new Error(`Unknown pitch strategy: ${strategyId}`);
  }
  activeStrategyId = strategyId;
}

/**
 * @param {Float32Array} buffer
 * @param {number} sampleRate
 * @param {import('./types.js').PitchDetectionOptions} [options]
 * @param {string} [strategyId] Per-call override (does not change global active id).
 * @returns {number|null}
 */
export function detectPitchWithStrategy(
  buffer,
  sampleRate,
  options = {},
  strategyId,
) {
  const strategy = resolvePitchStrategy(strategyId);
  return strategy.detect(buffer, sampleRate, options);
}

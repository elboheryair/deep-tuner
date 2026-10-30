import { registerPitchStrategy } from './registry.js';
import { mpmHintBiasedStrategy } from './strategies/mpmHintBiased.js';
import { mpmHintFundamentalStrategy } from './strategies/mpmHintFundamental.js';
import { mpmHintMetronomeStrategy } from './strategies/mpmHintMetronome.js';

let registered = false;

/** Idempotent registration of built-in strategies. */
export function registerDefaultPitchStrategies() {
  if (registered) return;
  registerPitchStrategy(mpmHintBiasedStrategy);
  registerPitchStrategy(mpmHintFundamentalStrategy);
  registerPitchStrategy(mpmHintMetronomeStrategy);
  registered = true;
}

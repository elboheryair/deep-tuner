export { default as DeepTuner } from './components/DeepTuner.jsx';
export { useTuner } from './hooks/useTuner.js';
export { TUNING_PRESETS } from './lib/notes.js';
export {
  DEFAULT_PITCH_STRATEGY_ID,
  detectPitch,
  listPitchStrategies,
  registerPitchStrategy,
  setActivePitchStrategyId,
} from './lib/pitch/index.js';

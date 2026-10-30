import { useTuner } from '../hooks/useTuner.js';
import MicToggle from './MicToggle.jsx';
import PitchGauge from './PitchGauge.jsx';
import ReferenceToneButton from './ReferenceToneButton.jsx';
import MetronomeBar from './MetronomeBar.jsx';
import StringSelector from './StringSelector.jsx';
import PresetSelector from './PresetSelector.jsx';
import PitchStrategySelector from './PitchStrategySelector.jsx';
import { DEFAULT_PITCH_STRATEGY_ID } from '../config/pitchDetection.js';
import { MPM_HINT_METRONOME_STRATEGY_ID } from '../lib/pitch/strategies/mpmHintMetronome.js';

/**
 * Standalone dashboard or headless pitch service for fretbot integration.
 */
export default function DeepTuner({
  headless = false,
  targetNote = null,
  onNoteMatch,
  initialPresetId,
  initialStringIndex,
  defaultMetronomeBpm = 60,
  pitchStrategyId = DEFAULT_PITCH_STRATEGY_ID,
  className = '',
}) {
  const tuner = useTuner({
    headless,
    targetNote,
    onNoteMatch,
    initialPresetId,
    initialStringIndex,
    pitchStrategyId,
    defaultMetronomeBpm,
  });

  const {
    listening,
    toggleListening,
    micError,
    presetId,
    setPresetId,
    preset,
    presets,
    stringIndex,
    setStringIndex,
    activeTarget,
    detectedNote,
    cents,
    inTune,
    toggleReferenceTone,
    referencePlaying,
    pitchStrategyId: activePitchStrategyId,
    setPitchStrategyId,
    pitchStrategies,
    metronomeEnabled,
    setMetronomeEnabled,
    metronomeBpm,
    setMetronomeBpm,
    metronomeBeatActive,
  } = tuner;

  if (headless) {
    return null;
  }

  const targetLabel = activeTarget?.label ?? `${activeTarget?.note}${activeTarget?.octave}`;
  const detectedLabel = detectedNote?.label;

  return (
    <div
      className={`mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-4 py-10 ${className}`}
    >
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Deep Tuner</h1>
        <p className="mt-1 text-sm text-slate-400">Precision guitar tuning</p>
      </header>

      {targetNote == null && (
        <>
          <PresetSelector
            presets={presets}
            value={presetId}
            onChange={(id) => {
              setPresetId(id);
              setStringIndex(0);
            }}
          />

          <StringSelector
            strings={preset.strings}
            selectedIndex={stringIndex}
            onSelect={setStringIndex}
          />
        </>
      )}

      <PitchGauge
        targetLabel={targetLabel}
        cents={cents}
        detectedLabel={detectedLabel}
        inTune={inTune}
        listening={listening}
      />

      <PitchStrategySelector
        strategies={pitchStrategies}
        value={activePitchStrategyId}
        onChange={setPitchStrategyId}
      />

      <MicToggle listening={listening} onToggle={toggleListening} error={micError} />

      <ReferenceToneButton
        onToggle={toggleReferenceTone}
        playing={referencePlaying}
        targetLabel={targetLabel}
      />

      <MetronomeBar
        enabled={metronomeEnabled}
        onEnabledChange={setMetronomeEnabled}
        bpm={metronomeBpm}
        onBpmChange={setMetronomeBpm}
        beatActive={metronomeBeatActive}
        beatStrategyActive={activePitchStrategyId === MPM_HINT_METRONOME_STRATEGY_ID}
      />
    </div>
  );
}

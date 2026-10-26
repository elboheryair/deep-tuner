import { useTuner } from '../hooks/useTuner.js';
import MicToggle from './MicToggle.jsx';
import PitchGauge from './PitchGauge.jsx';
import ReferenceToneButton from './ReferenceToneButton.jsx';
import MetronomeBar from './MetronomeBar.jsx';
import StringSelector from './StringSelector.jsx';
import PresetSelector from './PresetSelector.jsx';

/**
 * Standalone dashboard or headless pitch service for fretbot integration.
 */
export default function DeepTuner({
  headless = false,
  targetNote = null,
  onNoteMatch,
  initialPresetId,
  initialStringIndex,
  metronomeBpm = 120,
  className = '',
}) {
  const tuner = useTuner({
    headless,
    targetNote,
    onNoteMatch,
    initialPresetId,
    initialStringIndex,
    metronomeBpm,
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
    playReferenceTone,
    referencePlaying,
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

      <MicToggle listening={listening} onToggle={toggleListening} error={micError} />

      <ReferenceToneButton
        onPlay={playReferenceTone}
        playing={referencePlaying}
        targetLabel={targetLabel}
      />

      <MetronomeBar bpm={metronomeBpm} />
    </div>
  );
}

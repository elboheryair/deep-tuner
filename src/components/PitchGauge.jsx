import { pitchAccuracyColor } from '../lib/notes.js';

const MAX_CENTS_DISPLAY = 50;

export default function PitchGauge({
  targetLabel,
  cents = 0,
  detectedLabel,
  inTune,
  listening,
}) {
  const clamped = Math.max(-MAX_CENTS_DISPLAY, Math.min(MAX_CENTS_DISPLAY, cents));
  const needlePercent = 50 + (clamped / MAX_CENTS_DISPLAY) * 45;
  const accentColor = pitchAccuracyColor(cents, MAX_CENTS_DISPLAY);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-800/60 p-6 shadow-lg shadow-black/20">
      <div className="mb-1 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
        Target
      </div>
      <div
        className="mb-4 text-center text-4xl font-bold tabular-nums transition-colors duration-150"
        style={{ color: accentColor }}
      >
        {targetLabel}
      </div>

      <div className="relative mx-auto h-28 w-full overflow-hidden rounded-xl bg-slate-950/80 ring-1 ring-slate-700/60">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-emerald-500/70" />
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-slate-700" />

        {[ -25, 25 ].map((tickCents) => (
          <div
            key={tickCents}
            className="absolute top-2 bottom-2 w-px bg-slate-600/80"
            style={{ left: `${50 + (tickCents / MAX_CENTS_DISPLAY) * 45}%` }}
          />
        ))}

        <div
          className="absolute bottom-2 top-2 w-1 rounded-full shadow-md transition-[left,background-color] duration-150 ease-out"
          style={{
            left: `${needlePercent}%`,
            transform: 'translateX(-50%)',
            backgroundColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />

        <div className="absolute bottom-2 left-2 text-[10px] text-slate-500">♭ flat</div>
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500">sharp ♯</div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {listening ? 'Listening…' : 'Mic off'}
        </span>
        <span
          className="font-mono tabular-nums transition-colors duration-150"
          style={{ color: accentColor }}
        >
          {listening ? `${cents >= 0 ? '+' : ''}${cents.toFixed(1)} ¢` : '—'}
        </span>
      </div>

      <div className="mt-2 text-center text-sm text-slate-300">
        Heard:{' '}
        <span className="font-semibold text-slate-100">
          {listening && detectedLabel ? detectedLabel : '—'}
        </span>
        {inTune && listening && (
          <span className="ml-2 text-emerald-400">In tune</span>
        )}
      </div>
    </div>
  );
}

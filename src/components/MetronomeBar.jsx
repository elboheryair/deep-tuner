import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_BPM = 40;
const MAX_BPM = 240;
const BEAT_FLASH_MS = 140;

function clampBpm(value) {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

export default function MetronomeBar({ defaultBpm = 120 }) {
  const [enabled, setEnabled] = useState(false);
  const [bpm, setBpm] = useState(clampBpm(defaultBpm));
  const [beatActive, setBeatActive] = useState(false);

  const nextBeatAtRef = useRef(null);
  const timerRef = useRef(null);
  const flashTimerRef = useRef(null);

  const triggerBeat = useCallback(() => {
    setBeatActive(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setBeatActive(false), BEAT_FLASH_MS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      nextBeatAtRef.current = null;
      setBeatActive(false);
      return undefined;
    }

    const intervalMs = 60000 / bpm;

    const schedule = () => {
      const now = performance.now();
      if (nextBeatAtRef.current == null) {
        nextBeatAtRef.current = now + intervalMs;
        triggerBeat();
      }
      const delay = nextBeatAtRef.current - now;
      timerRef.current = setTimeout(() => {
        triggerBeat();
        nextBeatAtRef.current += intervalMs;
        schedule();
      }, Math.max(0, delay));
    };

    nextBeatAtRef.current = null;
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      nextBeatAtRef.current = null;
    };
  }, [enabled, bpm, triggerBeat]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const onBpmInput = (raw) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      setBpm(clampBpm(parsed));
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-700/80 bg-slate-800/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">Metronome</span>
        <button
          type="button"
          onClick={() => setEnabled((on) => !on)}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            enabled
              ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/50'
              : 'bg-slate-700 text-slate-300 ring-1 ring-slate-600 hover:bg-slate-600'
          }`}
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="relative mb-4 h-14 overflow-hidden rounded-lg border border-slate-700 bg-slate-950/90">
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-slate-700/80" />
        <div
          className={`absolute bottom-2 top-2 left-1/2 w-1 rounded-full transition-all duration-75 ${
            beatActive
              ? 'bg-yellow-300 opacity-100 shadow-[0_0_16px_rgba(250,204,21,1)]'
              : enabled
                ? 'bg-yellow-500/35 opacity-60'
                : 'bg-slate-600/40 opacity-40'
          }`}
          style={{
            transform: `translateX(-50%) scaleY(${beatActive ? 1 : 0.82})`,
            left: '50%',
          }}
        />
        {enabled && (
          <div
            className={`pointer-events-none absolute inset-0 bg-yellow-400/10 transition-opacity duration-75 ${
              beatActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-500">Tempo</span>
          <span className="font-mono tabular-nums text-slate-100">{bpm} BPM</span>
        </div>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          value={bpm}
          onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-yellow-400"
        />
        <input
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => onBpmInput(e.target.value)}
          className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
      </label>
    </div>
  );
}

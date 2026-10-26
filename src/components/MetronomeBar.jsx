import { useEffect, useRef, useState } from 'react';

export default function MetronomeBar({ bpm = 120 }) {
  const [position, setPosition] = useState(0.5);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const tick = (timestamp) => {
      if (startRef.current == null) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      const period = 60 / bpm;
      const phase = (elapsed % period) / period;
      const x = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      setPosition(x);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [bpm]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>Tempo pulse</span>
        <span className="tabular-nums">{bpm} BPM</span>
      </div>
      <div className="relative h-10 overflow-hidden rounded-lg border border-slate-700 bg-slate-950/90">
        <div
          className="absolute bottom-1 top-1 w-0.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
          style={{
            left: `${position * 100}%`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  );
}

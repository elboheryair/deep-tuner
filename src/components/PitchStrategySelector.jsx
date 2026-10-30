export default function PitchStrategySelector({ strategies, value, onChange }) {
  if (!strategies?.length) return null;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        Pitch algorithm
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        {strategies.map((s) => {
          const active = s.id === value;
          return (
            <button
              key={s.id}
              type="button"
              title={s.description}
              onClick={() => onChange(s.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                active
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                  : 'bg-slate-800 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-700'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

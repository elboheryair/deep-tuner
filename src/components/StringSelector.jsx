export default function StringSelector({ strings, selectedIndex, onSelect }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {strings.map((s, index) => {
        const active = index === selectedIndex;
        return (
          <button
            key={`${s.label}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`min-w-[3rem] rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              active
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                : 'bg-slate-800 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-700'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

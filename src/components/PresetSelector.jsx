export default function PresetSelector({ presets, value, onChange }) {
  const options = Object.values(presets);

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      <span className="text-xs uppercase tracking-wide text-slate-500">Tuning preset</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}

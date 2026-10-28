export default function ReferenceToneButton({ onToggle, playing, targetLabel }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!targetLabel}
      className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        playing
          ? 'border-rose-500/60 bg-rose-950/40 text-rose-100 hover:bg-rose-900/50 focus-visible:ring-rose-400'
          : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-amber-500/60 hover:bg-slate-700 focus-visible:ring-amber-400'
      }`}
    >
      {playing
        ? `Stop reference tone (${targetLabel})`
        : `Play reference tone (${targetLabel})`}
    </button>
  );
}

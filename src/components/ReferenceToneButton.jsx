export default function ReferenceToneButton({ onPlay, playing, targetLabel }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={!targetLabel}
      className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:border-amber-500/60 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {playing ? 'Playing reference…' : `Play reference tone (${targetLabel})`}
    </button>
  );
}

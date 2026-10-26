export default function MicToggle({ listening, onToggle, error }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full px-8 py-3 text-sm font-semibold shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          listening
            ? 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400'
            : 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400'
        }`}
      >
        {listening ? 'Stop listening' : 'Start microphone'}
      </button>
      {error && (
        <p className="max-w-xs text-center text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PainViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white/80">
      <button
        type="button"
        onClick={() => onChange("front")}
        className={`px-3 py-2 text-xs font-semibold transition ${
          view === "front" ? "bg-cyan-600 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        Front View
      </button>
      <button
        type="button"
        onClick={() => onChange("back")}
        className={`px-3 py-2 text-xs font-semibold transition ${
          view === "back" ? "bg-cyan-600 text-white" : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        Back View
      </button>
    </div>
  );
}

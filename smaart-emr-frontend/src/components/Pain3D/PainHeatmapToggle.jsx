export default function PainHeatmapToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        enabled
          ? "bg-rose-500 text-white shadow-md shadow-rose-300/40"
          : "border border-slate-300 bg-white/70 text-slate-700 hover:bg-white"
      }`}
    >
      {enabled ? "Heatmap On" : "Heatmap Off"}
    </button>
  );
}

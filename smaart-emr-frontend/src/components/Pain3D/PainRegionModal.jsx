import { useEffect, useMemo, useState } from "react";

const painTypes = ["Sharp", "Dull", "Burning", "Radiating", "Stabbing", "Throbbing", "Numbness"];
const durationOptions = ["< 24 Hours", "1-3 Days", "4-7 Days", "1-4 Weeks", "> 1 Month"];

export default function PainRegionModal({
  open,
  region,
  initialValue,
  onClose,
  onSaveNow,
  isSaving = false
}) {
  const [form, setForm] = useState({
    intensity: 1,
    painType: "Dull",
    duration: "1-3 Days",
    notes: ""
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      intensity: Number(initialValue?.intensity || 1),
      painType: initialValue?.painType || "Dull",
      duration: initialValue?.duration || "1-3 Days",
      notes: initialValue?.notes || ""
    });
  }, [open, initialValue]);

  const title = useMemo(() => (region ? region.replace("Pain_", "").replaceAll("_", " ") : ""), [region]);
  const sliderColor = useMemo(() => {
    if (form.intensity <= 2) return "#2ecc71";
    if (form.intensity <= 5) return "#f1c40f";
    if (form.intensity <= 8) return "#e67e22";
    return "#e74c3c";
  }, [form.intensity]);
  const sliderFill = useMemo(() => `${(Math.max(1, form.intensity) / 10) * 100}%`, [form.intensity]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title || "Pain Region"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600"
          >
            Close
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (isSaving) return;
            onSaveNow?.(region, form);
          }}
        >
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-slate-600">Pain Intensity</span>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">Mild</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: sliderColor }}
              >
                {form.intensity}/10
              </span>
              <span className="text-xs text-slate-500">Severe</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={form.intensity}
              onChange={(e) => setForm((prev) => ({ ...prev, intensity: Number(e.target.value) }))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(90deg, #2ecc71 0%, #f1c40f 35%, #e67e22 70%, #e74c3c 100%), linear-gradient(90deg, rgba(255,255,255,0) ${sliderFill}, #e2e8f0 ${sliderFill})`
              }}
            />
          </label>

          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={form.painType}
            onChange={(e) => setForm((prev) => ({ ...prev, painType: e.target.value }))}
          >
            {painTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
          >
            {durationOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Add pain context, triggers, movement restriction..."
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F4E79] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#163A5F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-t-transparent" />
              ) : null}
              {isSaving ? "Saving..." : "Add To Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

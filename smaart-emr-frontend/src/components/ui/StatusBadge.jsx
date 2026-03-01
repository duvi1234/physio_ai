const classesByStatus = {
  ARRIVED: "border-amber-200 bg-amber-100 text-amber-700",
  INTAKE_COMPLETED: "border-cyan-200 bg-cyan-100 text-cyan-700",
  READY_FOR_PT: "border-emerald-200 bg-emerald-100 text-emerald-700",
  CONFIRMED: "border-blue-200 bg-blue-100 text-blue-700",
  PENDING: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-100 text-rose-700",
  COMPLETED: "border-indigo-200 bg-indigo-100 text-indigo-700",
  NO_SHOW: "border-rose-200 bg-rose-100 text-rose-700",
  HIGH: "border-rose-200 bg-rose-100 text-rose-700",
  CRITICAL: "border-rose-300 bg-rose-200 text-rose-800",
  MEDIUM: "border-amber-200 bg-amber-100 text-amber-700",
  LOW: "border-cyan-200 bg-cyan-100 text-cyan-700",
  YES: "border-emerald-200 bg-emerald-100 text-emerald-700",
  NO: "border-slate-200 bg-slate-100 text-slate-700"
};

export default function StatusBadge({ status = "", className = "" }) {
  const normalized = String(status || "").toUpperCase();
  const tone = classesByStatus[normalized] || "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone} ${className}`}>
      {String(status || "-").replace(/_/g, " ")}
    </span>
  );
}

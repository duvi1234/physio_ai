export const glassCardClass =
  "rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl";

export const cardTitleClass = "text-lg font-semibold tracking-tight text-slate-900";
export const sectionMutedClass = "text-sm text-slate-600";
export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";
export const textareaClass =
  "w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";

export const first = (value, fallback = "-") =>
  value === undefined || value === null || value === "" ? fallback : value;

export const statusBadgeClass = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "COMPLETED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (value === "CONFIRMED" || value === "SCHEDULED") return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (value === "PENDING") return "bg-amber-100 text-amber-700 border-amber-200";
  if (value === "CANCELLED" || value === "NO_SHOW") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

export const calculatePercent = (numerator, denominator) => {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(numerator || 0) / Number(denominator || 1)) * 100)));
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
};

export const nowIstParts = () => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value || "12";
  const m = parts.find((p) => p.type === "minute")?.value || "00";
  const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value || "AM").toUpperCase();
  const hour24 = Number(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit"
    })
  );
  return { time: `${h}:${m} ${dayPeriod}`, hour24 };
};

export const greetingByHour = (hour) => {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const buildSummaryDocument = ({ title, sections }) => {
  const rows = sections
    .map(
      (section) => `
        <section style="margin-bottom:16px;">
          <h3 style="margin:0 0 8px;font-size:16px;color:#0f172a;">${section.title}</h3>
          <div style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;">${section.content}</div>
        </section>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
        <h1 style="margin-top:0;">${title}</h1>
        ${rows}
      </body>
    </html>
  `;
};

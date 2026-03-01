export const glassCardClass =
  "rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl";

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";

export const textareaClass =
  "w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200";

export const sectionMutedClass = "text-sm text-slate-600";

export const first = (value, fallback = "-") =>
  value === undefined || value === null || value === "" ? fallback : value;

export const toArray = (payload) => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
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
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true
  });
};

export const todayIso = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const read = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${read("year")}-${read("month")}-${read("day")}`;
};

export const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM"
];

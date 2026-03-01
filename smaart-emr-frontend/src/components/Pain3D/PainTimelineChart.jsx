import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

export default function PainTimelineChart({ rows = [], readOnly = false }) {
  const [region, setRegion] = useState("ALL");

  const regions = useMemo(() => {
    const set = new Set(rows.map((row) => row.region).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [rows]);

  const chartData = useMemo(() => {
    return rows
      .filter((row) => (region === "ALL" ? true : row.region === region))
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((row) => ({
        date: formatDate(row.createdAt),
        intensity: Number(row.intensity || 0),
        region: row.region
      }));
  }, [rows, region]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900">Pain Timeline</h4>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {readOnly ? <span className="text-[11px] font-medium text-slate-500">Read only</span> : null}
        </div>
      </div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="4 4" stroke="#dbeafe" />
            <XAxis dataKey="date" tick={{ fill: "#334155", fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fill: "#334155", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, borderColor: "#bae6fd" }}
              formatter={(value, key, payload) => {
                if (key === "intensity") return [`${value}/10`, "Intensity"];
                return [value, payload?.payload?.region || ""];
              }}
            />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 0, fill: "#0369a1" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

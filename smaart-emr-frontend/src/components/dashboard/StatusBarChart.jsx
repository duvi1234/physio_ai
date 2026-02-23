export default function StatusBarChart({ title = "Status Overview", data = [] }) {
  const maxValue = data.length ? Math.max(...data.map((item) => item.value || 0)) : 0;

  return (
    <div className="rounded-2xl border border-white/50 bg-white/35 p-5 shadow-lg backdrop-blur-xl">
      <h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>

      <div className="space-y-4">
        {data.map((item) => {
          const width = maxValue > 0 ? `${Math.round(((item.value || 0) / maxValue) * 100)}%` : "0%";
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value || 0}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200">
                <div
                  className={`h-2.5 rounded-full bg-gradient-to-r ${item.colorClass || "from-cyan-500 to-blue-600"} transition-all`}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

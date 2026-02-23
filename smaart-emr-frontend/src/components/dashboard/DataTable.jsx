import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = "No data found."
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/35 shadow-lg backdrop-blur-xl">
        <LoadingSpinner />
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title="No Rows" description={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/35 shadow-lg backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={column.label} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row._id || row.id || index}
                className={`border-t border-white/40 hover:bg-cyan-50/50 ${
                  index % 2 ? "bg-white/20" : "bg-transparent"
                }`}
              >
                {columns.map((column) => (
                  <td key={`${column.label}-${row._id || row.id || index}`} className="px-4 py-3 text-slate-800">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

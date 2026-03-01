import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  onRowClick = null,
  onAction = null,
  loading = false,
  sortable = true,
  manualSort = false,
  sortField: controlledSortField = null,
  sortDirection: controlledSortDirection = 'asc',
  onSortChange = null,
  paginate = true,
  manualPagination = false,
  pageSize = 10,
  searchable = false,
  searchFields = []
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchFields.length) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(row =>
      searchFields.some(field => {
        const value = String(row[field] || '').toLowerCase();
        return value.includes(query);
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort data
  const activeSortField = manualSort ? controlledSortField : sortField;
  const activeSortDirection = manualSort ? controlledSortDirection : sortDirection;

  const sortedData = useMemo(() => {
    if (manualSort || !sortable || !activeSortField) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[activeSortField];
      const bVal = b[activeSortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = String(aVal).localeCompare(String(bVal));
      return activeSortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredData, manualSort, sortable, activeSortField, activeSortDirection]);

  // Paginate
  const paginatedData = useMemo(() => {
    if (!paginate || manualPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginate, manualPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (field) => {
    const nextDirection =
      activeSortField === field ? (activeSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

    if (manualSort) {
      if (onSortChange) {
        onSortChange({ field, direction: nextDirection });
      }
    } else {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    }

    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (activeSortField !== field) return <div className="h-4 w-4" />;
    return activeSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white/50 p-6 text-center text-slate-500">
        Loading data...
      </div>
    );
  }

  if (!paginatedData.length) {
    return (
      <div className="rounded-xl bg-white/50 p-6 text-center text-slate-500">
        No data found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && searchFields.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search by ${searchFields.join(', ')}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white/50">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${sortable && col.sortable !== false ? 'cursor-pointer hover:bg-white/70' : ''}`}
                  onClick={() => sortable && col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {sortable && col.sortable !== false && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-100 hover:bg-white/70 transition-colors"
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col.key}`}
                    className={`px-4 py-3 text-slate-700 ${col.className || ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

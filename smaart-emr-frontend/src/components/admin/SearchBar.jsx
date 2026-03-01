import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function SearchBar({
  placeholder = 'Search...',
  onSearch = () => { },
  onClear = () => { },
  debounceDelay = 300,
  initialValue = ''
}) {
  const [value, setValue] = useState(initialValue);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setValue(newValue);

      // Clear existing timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Set new timeout for debounced search
      const newTimeoutId = setTimeout(() => {
        onSearch(newValue);
      }, debounceDelay);

      setTimeoutId(newTimeoutId);
    },
    [debounceDelay, onSearch, timeoutId]
  );

  const handleClear = () => {
    setValue('');
    if (timeoutId) clearTimeout(timeoutId);
    onClear();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

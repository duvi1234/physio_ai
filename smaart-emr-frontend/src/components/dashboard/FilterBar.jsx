import Input from "../ui/Input";

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = []
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="md:max-w-sm"
      />

      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          className="rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {filter.options.map((option) => (
            <option key={`${filter.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

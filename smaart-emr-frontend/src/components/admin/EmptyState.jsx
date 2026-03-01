import { InboxIcon, Package2 } from 'lucide-react';

export default function EmptyState({
  icon = null,
  title = 'No data available',
  message = 'There is no data to display',
  action = null
}) {
  const Icon = icon || Package2;

  return (
    <div className="rounded-xl bg-white/50 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Icon className="text-slate-400" size={32} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 text-sm text-slate-600">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

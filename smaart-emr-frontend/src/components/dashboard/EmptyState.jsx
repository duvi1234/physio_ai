import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No Data", description = "No items found." }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-slate-500" />
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </div>
  );
}

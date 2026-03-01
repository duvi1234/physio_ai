export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/50 px-6 py-4 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

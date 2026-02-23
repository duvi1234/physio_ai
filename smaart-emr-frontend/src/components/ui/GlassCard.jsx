export default function GlassCard({ children, className="" }) {
  return (
    <div className={`p-6 rounded-2xl 
    bg-white/30 backdrop-blur-xl 
    shadow-xl border border-white/40 
    ${className}`}>
      {children}
    </div>
  );
}

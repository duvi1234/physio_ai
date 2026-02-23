export default function Select({ children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2 rounded-xl 
      bg-white/60 backdrop-blur-md 
      border focus:ring-2 focus:ring-cyan-400 outline-none ${className}`}
    >
      {children}
    </select>
  );
}

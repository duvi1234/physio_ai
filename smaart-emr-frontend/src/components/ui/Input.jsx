export default function Input({ className="", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2 rounded-xl 
      bg-white/60 backdrop-blur-md 
      border focus:ring-2 focus:ring-blue-400 
      outline-none transition ${className}`}
    />
  );
}

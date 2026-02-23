export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`w-full bg-gradient-to-r from-cyan-600 to-blue-600 
      hover:from-blue-600 hover:to-cyan-600 
      text-white py-2 px-4 rounded-xl 
      shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

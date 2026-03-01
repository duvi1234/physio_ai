export default function Modal({ isOpen, onClose, children, panelClassName = "", showDefaultClose = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className={`bg-white rounded-2xl p-6 w-[400px] shadow-2xl animate-fadeIn ${panelClassName}`}>
        {children}
        {showDefaultClose ? (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-red-500"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}

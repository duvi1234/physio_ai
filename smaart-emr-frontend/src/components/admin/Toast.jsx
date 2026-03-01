import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Toast({ message = '', type = 'success', duration = 4000, onClose = () => {} }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <CheckCircle className="text-emerald-600" size={20} />,
      text: 'text-emerald-700'
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <AlertCircle className="text-rose-600" size={20} />,
      text: 'text-rose-700'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <AlertCircle className="text-amber-600" size={20} />,
      text: 'text-amber-700'
    }
  };

  const style = typeStyles[type] || typeStyles.success;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`rounded-lg border ${style.border} ${style.bg} p-4 flex items-start gap-3`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex-shrink-0">{style.icon}</div>

          <p className={`flex-1 text-sm ${style.text}`}>
            {message}
          </p>

          <button
            onClick={() => {
              setShow(false);
              onClose();
            }}
            className={`flex-shrink-0 ${style.text} hover:opacity-75`}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ToastContainer({ toasts = [] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md pointer-events-auto">
      {toasts.map((toast, idx) => (
        <Toast
          key={idx}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={toast.onClose}
        />
      ))}
    </div>
  );
}

export default Toast;
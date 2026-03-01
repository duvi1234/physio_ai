import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({
  isOpen = false,
  title = '',
  children = null,
  onClose = () => { },
  footer = null,
  size = 'md'
}) {
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-white p-6 shadow-2xl`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 p-1 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              <div className="mb-6">
                {children}
              </div>

              {footer && (
                <div className="border-t border-slate-200 pt-4 mt-4 flex gap-3 justify-end">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

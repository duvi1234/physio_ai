import { CheckCircle2, CircleAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function ToastAlert({ type = "success", message }) {
  if (!message) {
    return null;
  }

  const isSuccess = type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        isSuccess
          ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
          : "border border-rose-200 bg-rose-100 text-rose-800"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {isSuccess ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
        {message}
      </span>
    </motion.div>
  );
}

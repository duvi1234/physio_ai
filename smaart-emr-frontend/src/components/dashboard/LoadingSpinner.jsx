import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        className="mr-3"
      >
        <LoaderCircle className="h-6 w-6 text-cyan-600" />
      </motion.div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

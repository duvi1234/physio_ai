import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function StatCard({
  title,
  value,
  icon: Icon,
  accent = "from-cyan-500 to-blue-600",
  subtitle
}) {
  const target = Number(value) || 0;
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 0.8 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(target);
  }, [motionValue, target]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/50 bg-white/35 p-5 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{displayValue}</p>
        </div>
        {Icon ? (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${accent} text-white shadow-md`}
          >
            <Icon size={20} />
          </div>
        ) : null}
      </div>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
    </motion.div>
  );
}

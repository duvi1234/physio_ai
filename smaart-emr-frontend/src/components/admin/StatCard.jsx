import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export default function StatCard({
  label = '',
  value = 0,
  icon: Icon = null,
  gradient = 'from-cyan-500 to-blue-600',
  suffix = '',
  caption = ''
}) {
  const [display, setDisplay] = useState(isNumber(value) ? 0 : value);

  useEffect(() => {
    if (!isNumber(value)) {
      setDisplay(value);
      return;
    }
    const start = 0;
    const end = value;
    const duration = 800;
    let startTime;
    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-xl`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">{label}</p>
          <p className="mt-2 text-3xl font-bold">{display}{suffix}</p>
          {caption ? <p className="mt-1 text-xs text-white/80">{caption}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-white/20 p-3">
            <Icon size={26} className="text-white" />
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    </motion.div>
  );
}

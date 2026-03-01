import { motion } from 'framer-motion';

export default function LoadingSkeleton({ count = 5, type = 'row' }) {
  const shimmer = {
    initial: { backgroundPosition: '200% 0' },
    animate: { backgroundPosition: '0 0' },
    transition: { repeat: Infinity, duration: 2, ease: 'linear' }
  };

  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 h-32"
            style={{ backgroundSize: '200% 100%' }}
            {...shimmer}
          />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 h-12"
            style={{ backgroundSize: '200% 100%' }}
            {...shimmer}
          />
        ))}
      </div>
    );
  }

  // Default: row
  return (
    <motion.div
      className="rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 h-20"
      style={{ backgroundSize: '200% 100%' }}
      {...shimmer}
    />
  );
}

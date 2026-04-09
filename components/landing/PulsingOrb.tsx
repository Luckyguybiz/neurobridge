'use client';

import { motion } from 'framer-motion';

export default function PulsingOrb({ color = 'cyan', size = 200 }: { color?: 'cyan' | 'violet' | 'fuchsia'; size?: number }) {
  const colors = {
    cyan: 'rgba(34, 211, 238, 0.08)',
    violet: 'rgba(167, 139, 250, 0.08)',
    fuchsia: 'rgba(232, 121, 249, 0.06)',
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[color]}, transparent 70%)`,
      }}
    />
  );
}

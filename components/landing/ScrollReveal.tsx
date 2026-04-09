'use client';

import { motion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

type RevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'fade' | 'scale' | 'blur';

const variants: Record<RevealVariant, Variants> = {
  'fade-up': {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-left': {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  'fade-right': {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0 },
  },
};

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  direction,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  // Legacy support for direction prop
  const v = direction
    ? direction === 'up' ? 'fade-up'
    : direction === 'left' ? 'fade-left'
    : direction === 'right' ? 'fade-right'
    : 'fade'
    : variant;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={variants[v]}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

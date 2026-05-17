'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
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

/**
 * Reveals children on scroll. With prefers-reduced-motion, renders content
 * IMMEDIATELY (no fade) — never traps users in a permanently-hidden state.
 *
 * Bug history: an earlier implementation kept `initial="hidden"` even with
 * reduced motion, which froze the page blank for users with that pref set
 * (e.g. default on macOS Safari with Reduce Motion). See vault memory:
 * `feedback_framer_motion_reduced_motion.md`.
 */
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
  const reducedMotion = useReducedMotion();

  const v = direction
    ? direction === 'up' ? 'fade-up'
    : direction === 'left' ? 'fade-left'
    : direction === 'right' ? 'fade-right'
    : 'fade'
    : variant;

  // Reduced motion: NO animation at all. Just render content visible.
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

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

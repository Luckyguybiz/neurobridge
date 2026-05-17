'use client';

import { motion, useReducedMotion } from 'framer-motion';

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

/**
 * Hero word-by-word entrance. Reduced-motion → plain static text.
 * NEVER renders the words at opacity:0 forever — that would hide the page.
 */
export function AnimatedWords({
  text,
  className = '',
  startDelay = 0,
}: {
  text: string;
  className?: string;
  startDelay?: number;
}) {
  const reducedMotion = useReducedMotion();
  const words = text.split(' ');

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap justify-center gap-x-[0.3em] ${className}`} style={{ perspective: '800px' }}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          custom={i + startDelay / 0.08}
          initial="hidden"
          animate="visible"
          variants={wordVariants}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

const charVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export function AnimatedChars({
  text,
  className = '',
  startDelay = 0,
}: {
  text: string;
  className?: string;
  startDelay?: number;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          custom={i + startDelay / 0.03}
          initial="hidden"
          animate="visible"
          variants={charVariants}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

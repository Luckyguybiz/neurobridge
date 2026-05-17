'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@/components/design';

const STORAGE_KEY = 'neuro_onboarded';

const steps = [
  {
    eyebrow: 'Welcome',
    title: 'Neurocomputers',
    desc: 'An open-source platform for brain organoid electrophysiology. Visualize spike activity, compute criticality and connectivity, and compare against reference neural systems.',
    accent: 'primary' as const,
  },
  {
    eyebrow: 'Step 1',
    title: 'Load Data',
    desc: 'Click FinalSpark to load real organoid data (2.6M spikes, 32ch MEA, 118h), or generate synthetic data with the 30s/120s buttons. You can also upload your own MEA recordings (CSV, HDF5, NWB, Parquet).',
    accent: 'spark' as const,
  },
  {
    eyebrow: 'Step 2',
    title: 'Explore Pages',
    desc: 'Sidebar navigation: Spikes for sorting and firing rates, Network for connectivity and transfer entropy, Complexity for composite index, Discovery for 17 advanced analyses.',
    accent: 'neural' as const,
  },
  {
    eyebrow: 'Step 3',
    title: 'Debug & Export',
    desc: 'Press Ctrl+Shift+D to open the debug panel — see API timings and export logs. Download full JSON reports from the Overview page.',
    accent: 'primary' as const,
  },
];

const accentColor = {
  primary: 'var(--bio-primary-500)',
  spark: 'var(--bio-spark-600)',
  neural: 'var(--bio-neural-500)',
};

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Escape closes, focus on primary CTA when opening, restore focus on close,
  // lock body scroll while open. Standard accessible modal contract.
  useEffect(() => {
    if (!show) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => primaryBtnRef.current?.focus(), 50);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const current = steps[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(16px) saturate(120%)',
            WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.2, 1.35, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            aria-describedby="welcome-desc"
            style={{
              background: 'var(--glass-ultra-thick)',
              backdropFilter: 'blur(60px) saturate(220%)',
              WebkitBackdropFilter: 'blur(60px) saturate(220%)',
              boxShadow:
                'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px var(--edge-outline), var(--shadow-xl)',
            }}
          >
            {/* Ambient bio orb behind content */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-40%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120%',
                height: '80%',
                background: `radial-gradient(circle, color-mix(in srgb, ${accentColor[current.accent]} 30%, transparent) 0%, transparent 60%)`,
                filter: 'blur(40px)',
                opacity: 0.6,
                pointerEvents: 'none',
                transition: 'all 0.6s ease',
              }}
            />

            <div className="p-6 sm:p-8 relative" style={{ zIndex: 1 }}>
              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Badge tone={current.accent} variant="glass" size="sm" dot pulsing>
                    {current.eyebrow}
                  </Badge>
                  <h2
                    id="welcome-title"
                    className="font-display"
                    style={{
                      fontSize: 'var(--t-2xl)',
                      fontWeight: 'var(--tw-semibold)',
                      lineHeight: 1.15,
                      letterSpacing: '-0.022em',
                      color: 'var(--text-primary)',
                      marginTop: 'var(--space-4)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {current.title}
                  </h2>
                  <p id="welcome-desc" className="type-body-large" style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {current.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-8 mb-6">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="motion-spring"
                    aria-label={`Go to step ${i + 1}`}
                    style={{
                      width: i === step ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === step
                        ? `linear-gradient(90deg, var(--bio-primary-500), var(--bio-neural-500))`
                        : 'var(--glass-thick)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: i === step ? '0 0 8px color-mix(in srgb, var(--bio-primary-500) 40%, transparent)' : undefined,
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" accent="neutral" onClick={dismiss}>
                  Skip
                </Button>
                <div className="flex gap-2 ml-auto">
                  {step > 0 && (
                    <Button variant="glass" size="sm" accent="neutral" onClick={prev}>
                      Back
                    </Button>
                  )}
                  <Button ref={primaryBtnRef} variant="solid" size="sm" accent="primary" onClick={next}>
                    {step < steps.length - 1 ? 'Next →' : 'Get Started'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

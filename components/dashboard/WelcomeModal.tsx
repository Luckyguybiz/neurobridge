'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'neuro_onboarded';

const steps = [
  {
    title: 'Welcome to Neurocomputers',
    desc: 'An open-source platform for analyzing brain organoid data. Visualize neural activity, measure intelligence, and discover patterns in living neural networks.',
    icon: '🧠',
  },
  {
    title: 'Load Data',
    desc: 'Click FinalSpark to load real organoid data (2.6M spikes), or generate synthetic data with the 30s/120s buttons. You can also upload your own MEA recordings.',
    icon: '📊',
  },
  {
    title: 'Explore Pages',
    desc: 'Use the sidebar to navigate: Spikes for sorting, Network for connectivity, IQ for intelligence scoring, Discovery for 17 advanced analyses. Each page loads data in the background.',
    icon: '🔬',
  },
  {
    title: 'Debug & Export',
    desc: 'Press Ctrl+Shift+D to open the debug panel — see API timings and export logs. Download full JSON reports from the Overview page.',
    icon: '⚡',
  },
];

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show only if user hasn't seen onboarding
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          >
            {/* Gradient top bar */}
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500" />

            <div className="p-4 sm:p-6">
              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl mb-3">{steps[step].icon}</div>
                  <h2 className="text-[16px] sm:text-[18px] font-display mb-2" style={{ color: 'var(--text-primary)' }}>
                    {steps[step].title}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] leading-[1.7]" style={{ color: 'var(--text-muted)' }}>
                    {steps[step].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-6 mb-5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="transition-all duration-300"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step
                        ? 'linear-gradient(to right, var(--accent-cyan), var(--accent-violet))'
                        : 'var(--border)',
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={dismiss}
                  className="text-[11px] px-3 py-2 rounded-lg transition-colors min-h-[36px]"
                  style={{ color: 'var(--text-faint)' }}
                >
                  Skip
                </button>
                <div className="flex gap-2 ml-auto">
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="text-[11px] px-4 py-2 rounded-lg transition-all min-h-[36px]"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="text-[11px] px-5 py-2 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-violet-500 text-white transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] min-h-[36px]"
                  >
                    {step < steps.length - 1 ? 'Next' : 'Get Started'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

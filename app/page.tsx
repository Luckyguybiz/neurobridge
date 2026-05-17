'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralBackground from '@/components/landing/NeuralBackground';
import ScrollReveal from '@/components/landing/ScrollReveal';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import LiveSpikeTrace from '@/components/landing/LiveSpikeTrace';
import MiniRasterPlot from '@/components/landing/MiniRasterPlot';
import MiniHeatmap from '@/components/landing/MiniHeatmap';
import MiniNetwork from '@/components/landing/MiniNetwork';
import { AnimatedWords } from '@/components/landing/AnimatedText';
import { Glass, Panel, Button, Badge } from '@/components/design';

const capabilities = [
  {
    tag: 'Visualization',
    title: 'Visualize spike',
    titleAccent: 'activity',
    desc: 'Interactive raster plots, firing rate heatmaps, and spike waveforms across all electrodes and time ranges.',
    visual: 'raster' as const,
  },
  {
    tag: 'Analysis',
    title: 'Characterize',
    titleAccent: 'neural dynamics',
    desc: 'Burst detection (Bakkum 2013), criticality assessment (Clauset et al. 2009), and IIT Phi computation — in one click.',
    visual: 'heatmap' as const,
  },
  {
    tag: 'Connectivity',
    title: 'Map functional',
    titleAccent: 'connectivity',
    desc: 'Cross-correlation, transfer entropy (Schreiber 2000), Granger causality, and graph-theoretic metrics. All with significance testing.',
    visual: 'network' as const,
  },
];

const steps = [
  { title: 'Upload', desc: 'Load spike data from any MEA system — CSV, HDF5, NWB, or Parquet. Or use our FinalSpark demo dataset.' },
  { title: 'Analyze', desc: '9 analysis modules run automatically: bursts, connectivity, criticality, emergence, metastability, and more.' },
  { title: 'Compare', desc: 'Stage your organoid against 10 reference neural systems across 15 electrophysiological metrics.' },
  { title: 'Publish', desc: 'Export JSON reports and analysis parameters. All methods fully cited for reproducibility.' },
];

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on Escape + lock body scroll while open.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileNavOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen overflow-x-clip grain" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Nav — Liquid Glass floating */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'color-mix(in srgb, var(--surface-1) 62%, transparent)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          boxShadow: 'inset 0 -1px 0 var(--edge-outline)',
        }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 h-14 gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <span
              className="font-display truncate"
              style={{ fontSize: 'var(--t-md)', fontWeight: 'var(--tw-semibold)', letterSpacing: '-0.022em', color: 'var(--text-primary)' }}
            >
              neuro<span className="text-hero-gradient">computers</span>
            </span>
          </Link>
          <div
            className="hidden md:flex items-center gap-7"
            style={{ fontSize: 'var(--t-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--tw-medium)' }}
          >
            <a href="#capabilities" className="motion-fast hover:text-[var(--text-primary)]">Capabilities</a>
            <a href="#workflow" className="motion-fast hover:text-[var(--text-primary)]">Workflow</a>
            <a href="#methods" className="motion-fast hover:text-[var(--text-primary)]">Methods</a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="hidden sm:inline-block">
              <Button variant="glass" size="sm" accent="primary">
                Dashboard →
              </Button>
            </Link>
            {/* Mobile hamburger — visible < md */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-lg motion-fast"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                {mobileNavOpen
                  ? <path d="M5 5l10 10M15 5L5 15" />
                  : <path d="M3 6h14M3 10h14M3 14h14" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — slides down from nav, full overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'color-mix(in srgb, var(--bg-primary) 65%, transparent)', backdropFilter: 'blur(12px)' }}
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-14 left-0 right-0 z-50 md:hidden px-4"
            >
              <div
                className="rounded-2xl p-4 mx-auto max-w-[480px]"
                style={{
                  background: 'color-mix(in srgb, var(--surface-1) 92%, transparent)',
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  boxShadow: 'inset 0 0 0 1px var(--edge-outline), 0 20px 50px rgba(0,0,0,0.25)',
                }}
              >
                <div className="flex flex-col gap-1" style={{ fontSize: 'var(--t-md)', fontWeight: 'var(--tw-medium)' }}>
                  {[
                    { href: '#capabilities', label: 'Capabilities' },
                    { href: '#workflow', label: 'Workflow' },
                    { href: '#methods', label: 'Methods' },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className="px-3 py-3 rounded-xl motion-fast hover:bg-[var(--bg-card-hover)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--edge-outline)' }}>
                  <Link href="/dashboard" onClick={() => setMobileNavOpen(false)} className="block">
                    <Button variant="solid" size="md" accent="primary" fullWidth>
                      Open Dashboard →
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
        <NeuralBackground />

        {/* Bio-tinted ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'var(--bio-primary-500)', opacity: 'var(--ambient-blob-opacity)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--bio-neural-500)', opacity: 'var(--ambient-blob-opacity)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full blur-[160px] pointer-events-none" style={{ background: 'var(--bio-spark-600)', opacity: 'calc(var(--ambient-blob-opacity) * 1.6)' }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="inline-flex mb-10 sm:mb-14"
          >
            <Badge tone="primary" variant="glass" size="md" dot pulsing>
              <span style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 'var(--t-xs)', marginLeft: '4px' }}>
                Open-source · MIT · Peer-reviewed
              </span>
            </Badge>
          </motion.div>

          <h1 className="glow-text">
            <span
              className="block font-display"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', lineHeight: 1.05, letterSpacing: '-0.024em', color: 'var(--text-primary)' }}
            >
              <AnimatedWords text="The platform for" startDelay={0.4} />
            </span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block font-display italic text-hero-gradient"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', lineHeight: 1.2, letterSpacing: '-0.024em', paddingBottom: '0.1em' }}
            >
              brain organoid analysis
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 mx-auto"
            style={{ maxWidth: '560px', fontSize: 'var(--t-md)', lineHeight: 1.7, color: 'var(--text-secondary)' }}
          >
            Open-source analysis platform for brain organoid electrophysiology.{' '}
            <br className="hidden sm:inline" />
            9 peer-reviewed methods — from spike sorting to criticality assessment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link href="/dashboard">
              <Button
                variant="solid"
                size="lg"
                accent="primary"
                rightIcon={
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                }
              >
                Try Live Dashboard
              </Button>
            </Link>
            <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener">
              <Button variant="glass" size="lg" accent="neutral">
                View on GitHub
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[1px] h-12"
            style={{ background: `linear-gradient(to bottom, transparent, var(--scroll-indicator), transparent)` }}
          />
        </motion.div>
      </section>

      {/* ═══════════ LIVE TRACE ═══════════ */}
      <section className="py-4 px-4 sm:px-6 max-w-[1100px] mx-auto">
        <ScrollReveal variant="scale">
          <Glass
            thickness="thin"
            radius="2xl"
            elevation={3}
            className="overflow-hidden"
            style={{ padding: 0 }}
          >
            <LiveSpikeTrace />
          </Glass>
        </ScrollReveal>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '9', label: 'Peer-Reviewed Methods' },
              { value: '12K', label: 'Lines of Analysis Code' },
              { value: '2.6M', label: 'Spikes Validated' },
              { value: '22', label: 'Literature References' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.08}>
                <Glass
                  thickness="ultra-thin"
                  radius="xl"
                  elevation={1}
                  className="lift-on-hover text-center"
                  style={{ padding: 'var(--space-5) var(--space-4)' }}
                >
                  <div
                    className="font-display tabular"
                    style={{
                      fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                      fontWeight: 400,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.05,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <AnimatedCounter value={s.value} suffix={'suffix' in s ? (s as Record<string, string>).suffix : ''} />
                  </div>
                  <div className="type-eyebrow" style={{ marginTop: 'var(--space-2)' }}>{s.label}</div>
                </Glass>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CAPABILITIES ═══════════ */}
      <section id="capabilities" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal variant="blur" className="mb-16 sm:mb-24">
            <p className="type-eyebrow" style={{ marginBottom: 'var(--space-4)', color: 'var(--bio-primary-500)' }}>Capabilities</p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.022em',
                maxWidth: '28ch',
                color: 'var(--text-primary)',
              }}
            >
              Everything you need to work with{' '}
              <span className="italic text-hero-gradient">organoid electrophysiology</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-20 sm:space-y-32">
            {capabilities.map((cap, i) => {
              const tint = (['primary', 'spark', 'neural'] as const)[i % 3];
              return (
                <div key={cap.tag} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 sm:gap-12 lg:gap-20 items-center`}>
                  {/* Text */}
                  <ScrollReveal variant={i % 2 === 0 ? 'fade-left' : 'fade-right'} className="flex-1">
                    <div className="space-y-5">
                      <Badge tone={tint} variant="glass" size="sm">{cap.tag}</Badge>
                      <h3
                        className="font-display"
                        style={{
                          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                          lineHeight: 1.15,
                          letterSpacing: '-0.022em',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {cap.title}{' '}
                        <span className="italic text-hero-gradient">{cap.titleAccent}</span>
                      </h3>
                      <p
                        className="type-body-large"
                        style={{ maxWidth: '40ch', color: 'var(--text-secondary)', lineHeight: 1.7 }}
                      >
                        {cap.desc}
                      </p>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 motion-fast group pt-1"
                        style={{ fontSize: 'var(--t-sm)', color: `var(--bio-${tint === 'primary' ? 'primary' : tint === 'spark' ? 'spark' : 'neural'}-500)`, fontWeight: 'var(--tw-semibold)' }}
                      >
                        Explore in dashboard
                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  </ScrollReveal>

                  {/* Visualization */}
                  <ScrollReveal variant={i % 2 === 0 ? 'fade-right' : 'fade-left'} delay={0.15} className="flex-1 w-full">
                    <Glass
                      thickness="thin"
                      tint={tint}
                      radius="2xl"
                      elevation={3}
                      specular
                      className="lift-on-hover overflow-hidden"
                      style={{ padding: 'var(--space-4)' }}
                    >
                      {cap.visual === 'raster' && <MiniRasterPlot />}
                      {cap.visual === 'heatmap' && <MiniHeatmap />}
                      {cap.visual === 'network' && <MiniNetwork />}
                    </Glass>
                  </ScrollReveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ WORKFLOW ═══════════ */}
      <section id="workflow" className="py-20 sm:py-32 px-4 sm:px-6 relative">
        {/* Ambient — neural purple */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: 'var(--bio-neural-500)', opacity: 'var(--ambient-blob-opacity)' }}
        />

        <div className="max-w-[860px] mx-auto relative z-10">
          <ScrollReveal variant="blur" className="mb-16">
            <p className="type-eyebrow" style={{ marginBottom: 'var(--space-4)', color: 'var(--bio-neural-500)' }}>Workflow</p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.022em',
                color: 'var(--text-primary)',
              }}
            >
              From zero to{' '}
              <span className="italic text-hero-gradient">neural experiments</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.08}>
                <Glass
                  thickness="ultra-thin"
                  radius="xl"
                  elevation={2}
                  className="lift-on-hover h-full"
                  style={{ padding: 'var(--space-5)' }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="font-mono tabular"
                      style={{
                        fontSize: 'var(--t-sm)',
                        color: 'var(--bio-neural-500)',
                        fontWeight: 'var(--tw-semibold)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-md)',
                        background: 'color-mix(in srgb, var(--bio-neural-500) 14%, transparent)',
                        flex: '0 0 auto',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="type-title-3" style={{ marginBottom: 'var(--space-2)' }}>
                        {step.title}
                      </h3>
                      <p className="type-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </Glass>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ METHODS ═══════════ */}
      <section id="methods" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal variant="blur" className="mb-16">
            <p className="type-eyebrow" style={{ marginBottom: 'var(--space-4)', color: 'var(--bio-spark-600)' }}>Methods</p>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.022em',
                maxWidth: '28ch',
                color: 'var(--text-primary)',
              }}
            >
              Every module grounded in{' '}
              <span className="italic text-hero-gradient">peer-reviewed literature</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Burst Detection', methods: 'MaxInterval (Bakkum 2013), Rank Surprise (Legendy & Salcman 1985), Poisson Surprise' },
              { name: 'Connectivity', methods: 'Cross-correlation, Transfer Entropy (Schreiber 2000), Granger causality, PLV, Mutual Information' },
              { name: 'Criticality', methods: 'Power-law fitting (Clauset et al. 2009), Branching ratio, DFA (Beggs & Plenz 2003)' },
              { name: 'Emergence', methods: 'IIT Phi (Tononi 2004), Queyranne MIP, PID (Williams & Beer 2010), Causal Emergence (Hoel 2013)' },
              { name: 'Metastability', methods: 'Kuramoto order parameter (Shanahan 2010), FCD (Deco & Kringelbach 2016)' },
              { name: 'Temporal Prediction', methods: 'Differential response analysis: Markov transitions, prediction error signals, Bayesian surprise. Bonferroni correction + Cohen\'s d. Speculative without closed-loop' },
              { name: 'State Transitions', methods: 'HMM Baum-Welch for bistable dynamics, Lomb-Scargle periodogram, Cosinor (Sokolove & Bushell 1983). Detects network bistability, not sleep physiology' },
              { name: 'Complexity Index', methods: '6-dimension composite: signal quality, network complexity, information processing, temporal organization, adaptability, learning potential. Heuristic weights, not externally validated' },
              { name: 'Comparative', methods: '15 metrics × 10 reference systems (C. elegans, mouse hippocampus, rat cortex, DishBrain, and 6 others)' },
            ].map((m, i) => (
              <ScrollReveal key={m.name} delay={i * 0.05}>
                <Glass
                  thickness="ultra-thin"
                  radius="lg"
                  elevation={1}
                  className="lift-on-hover h-full"
                  style={{ padding: 'var(--space-4) var(--space-4) var(--space-5)' }}
                >
                  <div
                    className="type-title-3"
                    style={{ fontSize: 'var(--t-sm)', marginBottom: 'var(--space-2)', letterSpacing: '-0.005em' }}
                  >
                    {m.name}
                  </div>
                  <div
                    className="type-caption"
                    style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text-tertiary)' }}
                  >
                    {m.methods}
                  </div>
                </Glass>
              </ScrollReveal>
            ))}
          </div>

          {/* How to cite */}
          <ScrollReveal delay={0.3} className="mt-10">
            <Panel
              radius="xl"
              elevation={2}
              padding="md"
              eyebrow={<span style={{ color: 'var(--bio-spark-600)' }}>How to cite</span>}
            >
              <div
                className="font-mono"
                style={{ fontSize: 'var(--t-sm)', lineHeight: 1.65, color: 'var(--text-secondary)' }}
              >
                Britikov, N. (2026). NeuroBridge: An Open-Source Platform for Multi-Dimensional Analysis of Brain Organoid Electrophysiology. <span className="italic">GitHub</span>. https://github.com/Luckyguybiz/neurobridge-api
              </div>
            </Panel>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 sm:py-40 px-4 sm:px-6 relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'var(--bio-primary-500)', opacity: 'calc(var(--ambient-blob-opacity) * 1.4)' }}
        />

        <ScrollReveal variant="scale" className="text-center max-w-xl mx-auto relative z-10">
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.022em',
              marginBottom: 'var(--space-4)',
              color: 'var(--text-primary)',
            }}
          >
            Ready to analyze your{' '}
            <span className="italic text-hero-gradient">organoid data</span>?
          </h2>
          <p
            className="type-body-large mx-auto"
            style={{ maxWidth: '42ch', color: 'var(--text-secondary)', marginBottom: 'var(--space-10)' }}
          >
            Upload your MEA recordings or explore the FinalSpark demo dataset.
          </p>
          <Link href="/dashboard">
            <Button
              variant="solid"
              size="lg"
              accent="primary"
              rightIcon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              }
            >
              Open Dashboard
            </Button>
          </Link>
        </ScrollReveal>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--edge-outline)' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="font-display tracking-wider"
                style={{
                  fontSize: 'var(--t-xs)',
                  fontWeight: 'var(--tw-bold)',
                  letterSpacing: '0.12em',
                  color: 'var(--text-tertiary)',
                }}
              >
                NEURO<span className="text-hero-gradient">COMPUTERS</span>
              </span>
            </div>
            <div
              className="flex items-center gap-5 sm:gap-6 flex-wrap"
              style={{ fontSize: 'var(--t-sm)', color: 'var(--text-tertiary)', fontWeight: 'var(--tw-medium)' }}
            >
              <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener" className="motion-fast hover:text-[var(--bio-primary-500)]">GitHub</a>
              <a href="https://api.neurocomputers.io/docs" target="_blank" rel="noopener" className="motion-fast hover:text-[var(--bio-primary-500)]">API Docs</a>
              <a href="https://pypi.org/project/neurocomputers/" target="_blank" rel="noopener" className="motion-fast hover:text-[var(--bio-primary-500)]">PyPI</a>
              <Link href="/dashboard" className="motion-fast hover:text-[var(--bio-primary-500)]">Dashboard</Link>
              <Link href="/privacy" className="motion-fast hover:text-[var(--bio-primary-500)]">Privacy</Link>
              <Link href="/terms" className="motion-fast hover:text-[var(--bio-primary-500)]">Terms</Link>
              <Link href="/contact" className="motion-fast hover:text-[var(--bio-primary-500)]">Contact</Link>
            </div>
          </div>
          <div
            className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 type-caption"
            style={{ color: 'var(--text-quaternary)' }}
          >
            <span>Built by Nikita Britikov</span>
            <span className="hidden sm:inline">·</span>
            <span>9 peer-reviewed analysis modules · ~12,000 lines · MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

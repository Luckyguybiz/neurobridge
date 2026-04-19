'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import NeuralBackground from '@/components/landing/NeuralBackground';
import ScrollReveal from '@/components/landing/ScrollReveal';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import LiveSpikeTrace from '@/components/landing/LiveSpikeTrace';
import MiniRasterPlot from '@/components/landing/MiniRasterPlot';
import MiniHeatmap from '@/components/landing/MiniHeatmap';
import MiniNetwork from '@/components/landing/MiniNetwork';
import { AnimatedWords } from '@/components/landing/AnimatedText';

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
  return (
    <div className="min-h-screen overflow-x-clip grain" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl" style={{ background: 'color-mix(in srgb, var(--bg-primary) 60%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 h-14 gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-[15px] sm:text-[16px] tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>neuro<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--accent-cyan), var(--accent-violet))' }}>computers</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            <a href="#capabilities" className="hover:opacity-70 transition-colors duration-500">Capabilities</a>
            <a href="#workflow" className="hover:opacity-70 transition-colors duration-500">Workflow</a>
            <a href="#methods" className="hover:opacity-70 transition-colors duration-500">Methods</a>
          </div>
          <Link href="/dashboard" className="text-[12px] px-3 sm:px-4 py-1.5 rounded-lg transition-all duration-500 shrink-0 whitespace-nowrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
        <NeuralBackground />

        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'var(--accent-cyan)', opacity: 'var(--ambient-blob-opacity)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: 'var(--accent-violet)', opacity: 'var(--ambient-blob-opacity)' }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] tracking-[0.15em] uppercase mb-12"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Open-source · MIT License · Peer-reviewed methods
          </motion.div>

          <h1 className="glow-text">
            <span className="block text-[clamp(2.5rem,7vw,5.5rem)] font-display leading-[1.05] tracking-[-0.02em]">
              <AnimatedWords text="The platform for" startDelay={0.4} />
            </span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[clamp(2.5rem,7vw,5.5rem)] font-display italic leading-[1.2] tracking-[-0.02em] pb-2 bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-from), var(--gradient-text-via), var(--gradient-text-to))' }}
            >
              brain organoid analysis
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-[16px] max-w-md mx-auto leading-[1.8]"
            style={{ color: 'var(--text-muted)' }}
          >
            Open-source analysis platform for brain organoid electrophysiology. 9 peer-reviewed methods from spike sorting to criticality assessment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-12 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/dashboard" className="group relative px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 font-medium text-[13px] overflow-hidden transition-all duration-500 hover:shadow-[0_0_60px_rgba(34,211,238,0.2)]">
              <span className="relative z-10">Try Live Dashboard</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener" className="px-8 py-3.5 rounded-full text-[13px] transition-all duration-500" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              View on GitHub
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
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl border-glow" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--accent-cyan) 10%, transparent), transparent, color-mix(in srgb, var(--accent-violet) 10%, transparent))' }} />
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow)' }}>
              <LiveSpikeTrace />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-16 sm:py-28">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0 md:divide-x">
            {[
              { value: '9', label: 'Peer-Reviewed Methods' },
              { value: '12K', label: 'Lines of Analysis Code' },
              { value: '2.6M', label: 'Spikes Validated' },
              { value: '22', label: 'Literature References' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.1} className="text-center px-4">
                <div className="text-[clamp(2rem,4vw,3.5rem)] font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  <AnimatedCounter value={s.value} suffix={'suffix' in s ? (s as Record<string, string>).suffix : ''} />
                </div>
                <div className="text-[11px] mt-2 tracking-[0.2em] uppercase" style={{ color: 'var(--text-faint)' }}>{s.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CAPABILITIES ═══════════ */}
      <section id="capabilities" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal variant="blur" className="mb-16 sm:mb-24">
            <p className="text-[11px] uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--section-label-cyan)' }}>Capabilities</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight max-w-lg">
              Everything you need to work with{' '}
              <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-from), var(--gradient-text-to))' }}>organoid electrophysiology</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-20 sm:space-y-36">
            {capabilities.map((cap, i) => (
              <div key={cap.tag} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 sm:gap-12 lg:gap-20 items-center`}>
                {/* Text */}
                <ScrollReveal variant={i % 2 === 0 ? 'fade-left' : 'fade-right'} className="flex-1">
                  <div className="space-y-5">
                    <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>{cap.tag}</span>
                    <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-display leading-[1.15] tracking-tight">
                      {cap.title}{' '}
                      <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-from), var(--gradient-text-to))' }}>{cap.titleAccent}</span>
                    </h3>
                    <p className="text-[14px] leading-[1.8] max-w-sm" style={{ color: 'var(--text-muted)' }}>{cap.desc}</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-[12px] hover:text-cyan-400/70 transition-colors duration-500 pt-2 group" style={{ color: 'var(--text-faint)' }}>
                      Explore in dashboard
                      <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </ScrollReveal>

                {/* Visualization */}
                <ScrollReveal variant={i % 2 === 0 ? 'fade-right' : 'fade-left'} delay={0.15} className="flex-1 w-full">
                  <div className="relative group/card">
                    <div className="absolute -inset-px rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(to bottom right, var(--card-glow-from), transparent, var(--card-glow-to))` }} />
                    <div className="relative rounded-2xl bg-[var(--bg-secondary)] p-4 overflow-hidden transition-colors duration-700" style={{ border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                      {cap.visual === 'raster' && <MiniRasterPlot />}
                      {cap.visual === 'heatmap' && <MiniHeatmap />}
                      {cap.visual === 'network' && <MiniNetwork />}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WORKFLOW ═══════════ */}
      <section id="workflow" className="py-20 sm:py-32 px-4 sm:px-6 relative">
        {/* Ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none" style={{ background: 'var(--accent-violet)', opacity: 'var(--ambient-blob-opacity)' }} />

        <div className="max-w-[800px] mx-auto relative z-10">
          <ScrollReveal variant="blur" className="mb-20">
            <p className="text-[11px] uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--section-label-violet)' }}>Workflow</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight">
              From zero to{' '}
              <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-alt-from), var(--gradient-text-alt-to))' }}>neural experiments</span>
            </h2>
          </ScrollReveal>

          <div>
            {steps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.08}>
                <div className="group flex items-start gap-4 sm:gap-8 py-6 sm:py-10 transition-all duration-700" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px] font-mono group-hover:text-cyan-400/40 transition-colors duration-700 pt-1 shrink-0 tabular-nums" style={{ color: 'var(--text-faint)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[17px] sm:text-[20px] font-display transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>{step.title}</h3>
                    <p className="text-[12px] sm:text-[13px] mt-2 leading-[1.7] max-w-md transition-colors duration-500" style={{ color: 'var(--text-faint)' }}>{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ METHODS ═══════════ */}
      <section id="methods" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal variant="blur" className="mb-16">
            <p className="text-[11px] uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--section-label-cyan)' }}>Methods</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight max-w-lg">
              Every module grounded in{' '}
              <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-from), var(--gradient-text-to))' }}>peer-reviewed literature</span>
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
                <div className="px-4 py-3.5 rounded-xl h-full" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{m.name}</div>
                  <div className="text-[10px] leading-[1.6]" style={{ color: 'var(--text-faint)' }}>{m.methods}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* How to cite */}
          <ScrollReveal delay={0.3} className="mt-12">
            <div className="px-5 py-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-faint)' }}>How to cite</div>
              <div className="text-[12px] font-mono leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Britikov, N. (2026). NeuroBridge: An Open-Source Platform for Multi-Dimensional Analysis of Brain Organoid Electrophysiology. <span className="italic">GitHub</span>. https://github.com/Luckyguybiz/neurobridge-api
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 sm:py-40 px-4 sm:px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none" style={{ background: 'var(--accent-cyan)', opacity: 'var(--ambient-blob-opacity)' }} />

        <ScrollReveal variant="scale" className="text-center max-w-xl mx-auto relative z-10">
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight mb-6">
            Ready to analyze your{' '}
            <span className="italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--gradient-text-from), var(--gradient-text-to))' }}>organoid data</span>?
          </h2>
          <p className="text-[14px] mb-14 leading-[1.8]" style={{ color: 'var(--text-muted)' }}>
            Upload your MEA recordings or explore the FinalSpark demo dataset.
          </p>
          <Link href="/dashboard" className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 font-medium text-[13px] transition-all duration-500 hover:shadow-[0_0_80px_rgba(34,211,238,0.2)]">
            Open Dashboard
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </ScrollReveal>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="px-4 sm:px-6 py-10" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--text-faint)' }}>NEURO<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--accent-cyan), var(--accent-violet))' }}>COMPUTERS</span></span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-[11px] flex-wrap" style={{ color: 'var(--text-faint)' }}>
              <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener" className="hover:text-cyan-400/60 transition-colors">GitHub</a>
              <a href="https://api.neurocomputers.io/docs" target="_blank" rel="noopener" className="hover:text-cyan-400/60 transition-colors">API Docs</a>
              <a href="https://pypi.org/project/neurocomputers/" target="_blank" rel="noopener" className="hover:text-cyan-400/60 transition-colors">PyPI</a>
              <Link href="/dashboard" className="hover:text-cyan-400/60 transition-colors">Dashboard</Link>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            <span>Built by Nikita Britikov</span>
            <span className="hidden sm:inline">·</span>
            <span>9 peer-reviewed analysis modules · ~12,000 lines · MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

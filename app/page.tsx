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
    title: 'See neurons fire',
    titleAccent: 'in real-time',
    desc: 'Interactive raster plots, firing rate heatmaps, and spike waveforms. Every action potential captured and rendered at 30kHz.',
    visual: 'raster' as const,
  },
  {
    tag: 'Analysis',
    title: 'Decode hidden',
    titleAccent: 'neural patterns',
    desc: 'Automated burst detection, spike sorting, and functional connectivity mapping. ML-powered insights that manual analysis misses.',
    visual: 'heatmap' as const,
  },
  {
    tag: 'Connectivity',
    title: 'Map the living',
    titleAccent: 'neural network',
    desc: 'Force-directed graphs reveal functional connections between electrodes. Watch information propagate through biological tissue.',
    visual: 'network' as const,
  },
];

const steps = [
  { title: 'Connect', desc: 'Link FinalSpark, Cortical Labs, or any MEA system through our unified API.' },
  { title: 'Stream', desc: 'Real-time spike detection at 30kHz with automatic artifact rejection.' },
  { title: 'Experiment', desc: 'Design stimulation protocols visually. Test on digital twins first.' },
  { title: 'Discover', desc: 'Export publication-quality figures and contribute to the community.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-clip grain" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl" style={{ background: 'color-mix(in srgb, var(--bg-primary) 60%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-black">N</div>
            <span className="font-medium text-[14px] tracking-tight text-white/80">NeuroBridge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/30">
            <a href="#capabilities" className="hover:text-white/60 transition-colors duration-500">Capabilities</a>
            <a href="#workflow" className="hover:text-white/60 transition-colors duration-500">Workflow</a>
          </div>
          <Link href="/dashboard" className="text-[12px] px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all duration-500 text-white/60 hover:text-white/90">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <NeuralBackground />

        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] tracking-[0.15em] uppercase text-white/30 mb-12"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Biocomputing-as-a-Service
          </motion.div>

          <h1 className="glow-text">
            <span className="block text-[clamp(2.5rem,7vw,5.5rem)] font-display leading-[1.05] tracking-[-0.02em]">
              <AnimatedWords text="The platform for" startDelay={0.4} />
            </span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[clamp(2.5rem,7vw,5.5rem)] font-display italic leading-[1.05] tracking-[-0.02em] bg-gradient-to-r from-cyan-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent"
            >
              living neural networks
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-[16px] text-white/25 max-w-md mx-auto leading-[1.8]"
          >
            One API to access, visualize, and experiment on brain organoids. AI-powered tools for the next era of computing.
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
            <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener" className="px-8 py-3.5 rounded-full border border-white/[0.06] text-[13px] text-white/30 hover:text-white/60 hover:border-white/[0.12] transition-all duration-500">
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
            className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/20 to-white/0"
          />
        </motion.div>
      </section>

      {/* ═══════════ LIVE TRACE ═══════════ */}
      <section className="py-4 px-6 max-w-[1100px] mx-auto">
        <ScrollReveal variant="scale">
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 border-glow" />
            <div className="relative rounded-2xl border border-white/[0.04] bg-[var(--bg-secondary)] overflow-hidden">
              <LiveSpikeTrace />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-28">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-0 md:divide-x md:divide-white/[0.04]">
            {[
              { value: '125', label: 'API Endpoints' },
              { value: '57', label: 'Analysis Modules' },
              { value: '9', label: 'Dashboard Pages' },
              { value: '16', label: 'Live Organoids' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 0.1} className="text-center px-4">
                <div className="text-[clamp(2rem,4vw,3.5rem)] font-display text-white/85 tracking-tight">
                  <AnimatedCounter value={s.value} suffix={'suffix' in s ? (s as Record<string, string>).suffix : ''} />
                </div>
                <div className="text-[11px] text-white/20 mt-2 tracking-[0.2em] uppercase">{s.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CAPABILITIES ═══════════ */}
      <section id="capabilities" className="py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <ScrollReveal variant="blur" className="mb-24">
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-400/40 mb-5">Capabilities</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight max-w-lg">
              Everything you need to work with{' '}
              <span className="italic bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">biological intelligence</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-36">
            {capabilities.map((cap, i) => (
              <div key={cap.tag} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}>
                {/* Text */}
                <ScrollReveal variant={i % 2 === 0 ? 'fade-left' : 'fade-right'} className="flex-1">
                  <div className="space-y-5">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">{cap.tag}</span>
                    <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-display leading-[1.15] tracking-tight">
                      {cap.title}{' '}
                      <span className="italic bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">{cap.titleAccent}</span>
                    </h3>
                    <p className="text-[14px] text-white/25 leading-[1.8] max-w-sm">{cap.desc}</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-[12px] text-white/20 hover:text-cyan-400/70 transition-colors duration-500 pt-2 group">
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
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                    <div className="relative rounded-2xl border border-white/[0.04] bg-[var(--bg-secondary)] p-4 overflow-hidden transition-colors duration-700 group-hover/card:border-white/[0.08]">
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
      <section id="workflow" className="py-32 px-6 relative">
        {/* Ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/[0.03] blur-[150px] pointer-events-none" />

        <div className="max-w-[800px] mx-auto relative z-10">
          <ScrollReveal variant="blur" className="mb-20">
            <p className="text-[11px] uppercase tracking-[0.3em] text-violet-400/40 mb-5">Workflow</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight">
              From zero to{' '}
              <span className="italic bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">neural experiments</span>
            </h2>
          </ScrollReveal>

          <div>
            {steps.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.08}>
                <div className="group flex items-start gap-8 py-10 border-t border-white/[0.04] hover:border-white/[0.08] transition-all duration-700">
                  <span className="text-[11px] font-mono text-white/10 group-hover:text-cyan-400/40 transition-colors duration-700 pt-1 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-[20px] font-display text-white/60 group-hover:text-white/90 transition-colors duration-500">{step.title}</h3>
                    <p className="text-[13px] text-white/15 group-hover:text-white/30 mt-2 leading-[1.7] max-w-md transition-colors duration-500">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-40 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-[130px] pointer-events-none" />

        <ScrollReveal variant="scale" className="text-center max-w-xl mx-auto relative z-10">
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-display leading-[1.15] tracking-tight mb-6">
            Ready to program{' '}
            <span className="italic bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">biology</span>?
          </h2>
          <p className="text-[14px] text-white/20 mb-14 leading-[1.8]">
            Join researchers building the future of biological computing.
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
      <footer className="border-t border-white/[0.03] px-6 py-8">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-cyan-400 to-violet-500" />
            <span className="text-[11px] text-white/15 tracking-wider">NEUROBRIDGE</span>
          </div>
          <span className="text-[11px] text-white/10">Biocomputing-as-a-Service</span>
        </div>
      </footer>
    </div>
  );
}

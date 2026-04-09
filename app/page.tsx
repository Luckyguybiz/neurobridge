import Link from 'next/link';

const features = [
  {
    title: 'Real-time Visualization',
    description: 'Interactive raster plots, heatmaps, waveforms, and connectivity graphs. Publication-quality charts powered by D3.js.',
    icon: '01',
  },
  {
    title: 'AI Experiment Copilot',
    description: 'LLM-powered protocol optimization. Predict outcomes on digital twins before running experiments on real organoids.',
    icon: '02',
  },
  {
    title: 'Unified API',
    description: 'One SDK for FinalSpark, Cortical Labs, and university platforms. Write once, run on any biological neural network.',
    icon: '03',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-xs font-bold text-black">N</div>
          <span className="font-semibold text-sm tracking-tight">NeuroBridge</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
        >
          Open Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Biocomputing-as-a-Service Platform
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            AWS for Living Neurons
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-white/50 max-w-xl leading-relaxed">
          One API to access any biological neural network. Visualize, analyze, and optimize experiments on brain organoids with AI-powered tools.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Try Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener"
            className="px-6 py-2.5 rounded-xl border border-white/15 text-sm text-white/70 hover:bg-white/5 transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-white/90">8</div>
            <div className="text-xs text-white/40 mt-1">Electrodes per MEA</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white/90">30 kHz</div>
            <div className="text-xs text-white/40 mt-1">Sampling Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white/90">6</div>
            <div className="text-xs text-white/40 mt-1">Analysis Types</div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-xs font-mono text-white/50 mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-white/30">
        NeuroBridge — Biocomputing-as-a-Service Platform
      </footer>
    </div>
  );
}

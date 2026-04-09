'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';
import { DashboardContext } from '@/lib/dashboard-context';
import type { Spike } from '@/lib/types';
import type { BurstInfo, DashboardStatus } from '@/lib/dashboard-context';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconOverview() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconSpikes() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="1,10 4,10 5.5,4 7,14 9,7 11,13 13,10 16,10 17.5,6 19,10" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-4 h-4">
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="3.5" cy="16" r="1.5" />
      <circle cx="16.5" cy="16" r="1.5" />
      <line x1="10" y1="5.5" x2="4.5" y2="14.5" />
      <line x1="10" y1="5.5" x2="15.5" y2="14.5" />
      <line x1="5" y1="16" x2="15" y2="16" />
    </svg>
  );
}

function IconIQ() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-4 h-4">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6 13 Q10 5 14 13" />
      <line x1="10" y1="2.5" x2="10" y2="4" />
      <line x1="10" y1="16" x2="10" y2="17.5" />
    </svg>
  );
}

function IconDiscovery() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-4 h-4">
      <polygon points="10,2 12.4,7.3 18,8.1 14,12 15.1,17.5 10,14.8 4.9,17.5 6,12 2,8.1 7.6,7.3" />
    </svg>
  );
}

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard',           label: 'Overview',   Icon: IconOverview },
  { href: '/dashboard/spikes',    label: 'Spikes',     Icon: IconSpikes },
  { href: '/dashboard/network',   label: 'Network',    Icon: IconNetwork },
  { href: '/dashboard/iq',        label: 'IQ',         Icon: IconIQ },
  { href: '/dashboard/discovery', label: 'Discovery',  Icon: IconDiscovery },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
    </span>
  );
}

function MetricPill({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
      <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
      <span className="text-[13px] font-medium text-white/80 tabular-nums leading-tight">
        {value}
        {unit && <span className="text-[10px] text-white/40 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── State (shared via context) ──────────────────────────────────────────
  const [status, setStatus]           = useState<DashboardStatus>('idle');
  const [error, setError]             = useState('');
  const [datasetId, setDatasetId]     = useState<string | null>(null);
  const [spikes, setSpikes]           = useState<Spike[]>([]);
  const [duration, setDuration]       = useState(30);
  const [nElectrodes, setNElectrodes] = useState(8);
  const [summary, setSummary]         = useState<Record<string, unknown> | null>(null);
  const [burstInfo, setBurstInfo]     = useState<BurstInfo | null>(null);
  const [elapsed, setElapsed]         = useState(0);

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // ── Generate ───────────────────────────────────────────────────────────
  const generateData = useCallback(async (dur = 30, electrodes = 8, burstProb = 0.15) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    try {
      const result = await api.generateDataset({ duration: dur, n_electrodes: electrodes, burst_probability: burstProb });
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      const spikeData = await api.getSpikes(result.dataset_id, { limit: 15000 });
      const spikeArr: Spike[] = spikeData.times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes[i],
        amplitude: spikeData.amplitudes[i],
        waveform: [],
      }));
      setSpikes(spikeArr);

      const [summaryData, burstData] = await Promise.all([
        api.getFullSummary(result.dataset_id),
        api.getBursts(result.dataset_id),
      ]);
      setSummary(summaryData);
      setBurstInfo(burstData as unknown as BurstInfo);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate data');
      setStatus('error');
    }
  }, []);

  // ── Upload ─────────────────────────────────────────────────────────────
  const uploadData = useCallback(async (file: File) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    try {
      const result = await api.uploadDataset(file);
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      const spikeData = await api.getSpikes(result.dataset_id, { limit: 15000 });
      const spikeArr: Spike[] = spikeData.times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes[i],
        amplitude: spikeData.amplitudes[i],
        waveform: [],
      }));
      setSpikes(spikeArr);

      const [summaryData, burstData] = await Promise.all([
        api.getFullSummary(result.dataset_id),
        api.getBursts(result.dataset_id),
      ]);
      setSummary(summaryData);
      setBurstInfo(burstData as unknown as BurstInfo);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStatus('error');
    }
  }, []);

  // ── Auto-generate on mount ─────────────────────────────────────────────
  useEffect(() => { generateData(30, 8); }, [generateData]);

  const pop     = summary?.population as Record<string, unknown> | undefined;
  const dataset = summary?.dataset    as Record<string, unknown> | undefined;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <DashboardContext.Provider value={{
      datasetId, spikes, duration, nElectrodes,
      summary, burstInfo, status, error, elapsed,
      generateData, uploadData,
    }}>
      <div className="min-h-screen bg-[#05060a] text-white grain flex">
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.015] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-violet-500/[0.015] rounded-full blur-[120px]" />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className={`
          fixed left-0 top-0 h-full z-40 w-[220px]
          bg-[#06070c]/95 backdrop-blur-2xl
          border-r border-white/[0.04]
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.04]">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-[9px] font-bold text-black shrink-0">N</div>
              <span className="text-[13px] font-medium text-white/60 tracking-tight group-hover:text-white/90 transition-colors duration-300">NeuroBridge</span>
            </Link>
            <button
              className="lg:hidden text-white/30 hover:text-white/60 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            <div className="px-2 pb-1.5">
              <span className="text-[9px] font-medium text-white/20 uppercase tracking-widest">Analysis</span>
            </div>
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    transition-all duration-300 group relative
                    ${active
                      ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/10 border border-cyan-500/[0.15] text-white/90'
                      : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-cyan-400 to-violet-400 rounded-full" />
                  )}
                  <span className={`transition-colors duration-300 ${active ? 'text-cyan-400' : 'text-white/30 group-hover:text-white/50'}`}>
                    <Icon />
                  </span>
                  {label}
                  {active && <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400/60" />}
                </Link>
              );
            })}
          </nav>

          {/* Status in sidebar */}
          {status === 'ready' && datasetId && (
            <div className="px-4 py-3 border-t border-white/[0.04]">
              <div className="text-[9px] text-white/20 uppercase tracking-widest mb-1.5">Dataset</div>
              <div className="font-mono text-[10px] text-white/40 truncate">{datasetId}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{nElectrodes} ch · {duration.toFixed(0)}s</div>
            </div>
          )}

          {/* Footer */}
          <div className="px-2 pb-4 pt-2 border-t border-white/[0.04]">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-white/25 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-300"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              Exit dashboard
            </Link>
          </div>
        </aside>

        {/* ── Main area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-[220px]">
          {/* Header */}
          <header className="sticky top-0 z-20 backdrop-blur-2xl bg-[#05060a]/70 border-b border-white/[0.04]">
            <div className="px-4 sm:px-5 h-12 flex items-center justify-between gap-3">
              {/* Mobile menu toggle */}
              <button
                className="lg:hidden text-white/40 hover:text-white/70 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M3 6h14M3 10h14M3 14h14" />
                </svg>
              </button>

              {/* Status badge */}
              <div className="flex items-center gap-2 min-w-0">
                {status === 'ready' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.12] shrink-0">
                    <LiveDot />
                    <span className="text-[10px] text-emerald-400/80 font-medium">READY</span>
                    <span className="text-[10px] text-emerald-400/50 font-mono tabular-nums">
                      {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {status === 'loading' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/[0.08] border border-amber-500/[0.12] shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] text-amber-400/80 font-medium">ANALYZING</span>
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/[0.08] border border-red-500/[0.12] shrink-0">
                    <span className="text-[10px] text-red-400/80 font-medium">ERROR</span>
                  </div>
                )}

                {/* Metrics (md+) */}
                {status === 'ready' && pop && (
                  <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
                    <MetricPill label="Spikes" value={String(pop.total_spikes).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    <MetricPill label="Rate" value={String(pop.mean_firing_rate_hz)} unit="Hz" />
                    <MetricPill label="Duration" value={String((dataset?.duration_s as number)?.toFixed(1))} unit="s" />
                    {burstInfo && <MetricPill label="Bursts" value={String(burstInfo.n_bursts)} />}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => generateData(30, 8)}
                  disabled={status === 'loading'}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400/80 hover:text-cyan-300 transition-all duration-300 disabled:opacity-40"
                >
                  30s
                </button>
                <button
                  onClick={() => generateData(120, 8)}
                  disabled={status === 'loading'}
                  className="hidden sm:block text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300 disabled:opacity-40"
                >
                  120s
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'loading'}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300 disabled:opacity-40"
                >
                  Upload
                </button>
                {datasetId && status === 'ready' && (
                  <a
                    href={api.getExportCSVUrl(datasetId)}
                    className="hidden sm:block text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300"
                  >
                    CSV
                  </a>
                )}
              </div>
            </div>

            {/* Error bar */}
            {error && (
              <div className="px-4 pb-2">
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">{error}</div>
              </div>
            )}
          </header>

          {/* Page content */}
          <main className="flex-1 relative z-10 min-h-0">
            {children}
          </main>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.h5,.hdf5,.parquet"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadData(f); }}
        />
      </div>
    </DashboardContext.Provider>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '@/lib/api';
import { DashboardContext } from '@/lib/dashboard-context';
import type { Spike } from '@/lib/types';
import type { BurstInfo, DashboardStatus, DatasetSource, LiveSpike, LiveState } from '@/lib/dashboard-context';
import { ThemeToggle } from '@/lib/theme-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import DebugPanel from '@/components/dashboard/DebugPanel';
import WelcomeModal from '@/components/dashboard/WelcomeModal';
import { clearCache } from '@/lib/analysis-cache';

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

function IconExperiments() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M7 2v5l-4 8a1.5 1.5 0 001.3 2.2h11.4A1.5 1.5 0 0017 15L13 7V2" />
      <line x1="5" y1="2" x2="15" y2="2" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="13" cy="11" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconProtocols() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9.5" x2="13" y2="9.5" />
      <line x1="7" y1="13" x2="11" y2="13" />
    </svg>
  );
}

function IconConstructor() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 8h6M7 12h4" />
      <circle cx="15" cy="15" r="3" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}

function IconLive() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-4 h-4">
      <circle cx="10" cy="10" r="3" fill="currentColor" />
      <path d="M5.5 5.5a6.4 6.4 0 000 9" />
      <path d="M14.5 5.5a6.4 6.4 0 010 9" />
    </svg>
  );
}

function IconPublish() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
      <polyline points="8,10 10,8 12,10" />
      <line x1="10" y1="8" x2="10" y2="14" />
    </svg>
  );
}

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard',              label: 'Overview',     Icon: IconOverview },
  { href: '/dashboard/spikes',       label: 'Spikes',       Icon: IconSpikes },
  { href: '/dashboard/network',      label: 'Network',      Icon: IconNetwork },
  { href: '/dashboard/iq',           label: 'Complexity',   Icon: IconIQ },
  { href: '/dashboard/discovery',    label: 'Discovery',    Icon: IconDiscovery },
  { href: '/dashboard/experiments',  label: 'Experiments',  Icon: IconExperiments },
  { href: '/dashboard/protocols',    label: 'Protocols',    Icon: IconProtocols },
  { href: '/dashboard/publish',      label: 'Publish',      Icon: IconPublish },
  { href: '/dashboard/constructor',  label: 'Constructor',  Icon: IconConstructor },
  { href: '/dashboard/live',         label: 'Live',         Icon: IconLive },
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
    <div className="flex flex-col px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[13px] font-medium tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
        {unit && <span className="text-[10px] ml-0.5" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </span>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

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
  const [datasetSource, setDatasetSource] = useState<DatasetSource>(null);
  const [loadingStep, setLoadingStep] = useState('');

  // ── Cached analysis (persists across page navigation) ─────────────────
  const [cachedIQ, setCachedIQ] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [cachedHealth, setCachedHealth] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [cachedConsciousness, setCachedConsciousness] = useState<Record<string, unknown> | null | undefined>(undefined);

  // ── Live WebSocket state (persists across page navigation) ────────────
  const [liveConnected, setLiveConnected] = useState(false);
  const [livePaused, setLivePaused] = useState(false);
  const [liveSpikeCount, setLiveSpikeCount] = useState(0);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [liveSpikes, setLiveSpikes] = useState<LiveSpike[]>([]);
  const [liveRates, setLiveRates] = useState<number[]>(new Array(8).fill(0));
  const wsRef = useRef<WebSocket | null>(null);
  const pausedRef = useRef(false); // ref for use inside WS callback (no stale closure)
  const liveWindowSec = 10;

  const liveConnect = useCallback(() => {
    // Prevent multiple connections: check CONNECTING (0) and OPEN (1)
    const rs = wsRef.current?.readyState;
    if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) return;

    // Close any lingering socket before opening a new one
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset state for fresh session
    setLivePaused(false);
    pausedRef.current = false;
    setLiveSpikes([]);
    setLiveSpikeCount(0);
    setLiveElapsed(0);
    setLiveRates(new Array(8).fill(0));

    const isDomain = typeof window !== 'undefined' && (window.location.hostname === 'neurocomputers.io' || window.location.hostname === 'www.neurocomputers.io');
    const wsUrl = isDomain
      ? 'wss://api.neurocomputers.io/ws/spikes'
      : typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'ws://localhost:8847/ws/spikes'
        : `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8847/ws/spikes`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setLiveConnected(true);
    ws.onclose = () => {
      setLiveConnected(false);
      setLivePaused(false);
      pausedRef.current = false;
      if (wsRef.current === ws) wsRef.current = null;
    };
    ws.onerror = () => {
      setLiveConnected(false);
      if (wsRef.current === ws) wsRef.current = null;
    };

    ws.onmessage = (event) => {
      // Skip processing when paused — data stays frozen on screen
      if (pausedRef.current) return;

      const data = JSON.parse(event.data);
      const newSpikes = (data.spikes ?? []) as LiveSpike[];
      const now = (data.timestamp ?? 0) as number;

      setLiveSpikes((prev) => {
        const cutoff = now - liveWindowSec;
        return [...prev, ...newSpikes].filter((s) => s.time > cutoff);
      });
      setLiveSpikeCount((prev) => prev + newSpikes.length);
      setLiveElapsed(Math.floor(now));

      const counts = new Array(8).fill(0);
      for (const s of newSpikes) counts[s.electrode % 8]++;
      setLiveRates((prev) => prev.map((r, i) => r * 0.9 + counts[i] * 10 * 0.1));
    };

    wsRef.current = ws;
  }, []);

  const livePause = useCallback(() => {
    pausedRef.current = true;
    setLivePaused(true);
  }, []);

  const liveResume = useCallback(() => {
    pausedRef.current = false;
    setLivePaused(false);
  }, []);

  const liveDisconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setLiveConnected(false);
    setLivePaused(false);
    pausedRef.current = false;
    setLiveSpikes([]);
    setLiveSpikeCount(0);
    setLiveElapsed(0);
    setLiveRates(new Array(8).fill(0));
  }, []);

  // Clean up WebSocket on full unmount (layout unmount = leave dashboard entirely)
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const live: LiveState = {
    connected: liveConnected,
    paused: livePaused,
    spikeCount: liveSpikeCount,
    elapsed: liveElapsed,
    spikes: liveSpikes,
    rates: liveRates,
  };

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  /** Fetch background analysis SEQUENTIALLY to avoid overloading single API worker.
   *  Fast endpoints first → UI updates quickly. Heavy endpoints later. */
  const fetchBackgroundAnalysis = useCallback(async (dsId: string) => {
    clearCache();
    setCachedIQ(undefined);
    setCachedHealth(undefined);
    setCachedConsciousness(undefined);

    // Step 1: Summary (fast, needed for overview metrics)
    try {
      const summaryData = await api.getFullSummary(dsId);
      setSummary(summaryData);
    } catch (err) {
      console.error('[Dashboard] Summary failed:', err);
      setSummary(null);
    }

    // Step 2: Health (fast)
    try {
      const h = await api.getHealth(dsId);
      setCachedHealth(h);
    } catch { setCachedHealth(null); }

    // Step 3: IQ (medium)
    try {
      const iq = await api.getOrganoidIQ(dsId);
      setCachedIQ(iq);
    } catch { setCachedIQ(null); }

    // Step 4: Bursts (heavy — runs last)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const burstData = await api.getBursts(dsId) as any;
      setBurstInfo({
        n_bursts: burstData?.summary?.n_network_bursts ?? burstData?.n_bursts ?? burstData?.network?.n_bursts ?? 0,
        burst_rate_per_min: burstData?.summary?.burst_rate_per_min ?? burstData?.burst_rate_per_min ?? 0,
        mean_duration_ms: burstData?.summary?.mean_duration_ms ?? burstData?.mean_duration_ms ?? 0,
        total_burst_time_pct: burstData?.summary?.total_burst_time_pct ?? burstData?.total_burst_time_pct ?? 0,
      });
    } catch {
      setBurstInfo(null);
    }

    // Step 5: Consciousness (last, least critical for overview)
    try {
      const c = await api.getConsciousness(dsId);
      setCachedConsciousness(c);
    } catch { setCachedConsciousness(null); }
  }, []);

  // ── Generate ───────────────────────────────────────────────────────────
  const generateData = useCallback(async (dur = 30, electrodes = 8, burstProb = 0.15) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    setDatasetSource(dur <= 30 ? 'synthetic-30' : 'synthetic-120');
    setLoadingStep('Generating neural data...');
    try {
      const result = await api.generateDataset({ duration: dur, n_electrodes: electrodes, burst_probability: burstProb });
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      setLoadingStep('Loading spikes...');
      const spikeData = await api.getSpikes(result.dataset_id, { limit: 1000 });
      const times = spikeData?.times ?? [];
      const spikeArr: Spike[] = times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes?.[i] ?? 0,
        amplitude: spikeData.amplitudes?.[i] ?? 0,
        waveform: [],
      }));
      setSpikes(spikeArr);

      setLoadingStep('');
      setStatus(spikeArr.length > 0 ? 'ready' : 'error');
      if (spikeArr.length === 0) {
        setError('No spikes returned. Try again.');
      } else {
        fetchBackgroundAnalysis(result.dataset_id);
      }
    } catch (e) {
      setLoadingStep('');
      setError(e instanceof Error ? e.message : 'Failed to generate data');
      setStatus('error');
    }
  }, [fetchBackgroundAnalysis]);

  // ── Upload ─────────────────────────────────────────────────────────────
  const uploadData = useCallback(async (file: File) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    setDatasetSource('upload');
    setLoadingStep(`Uploading ${file.name}...`);
    try {
      const result = await api.uploadDataset(file);
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      const spikeData = await api.getSpikes(result.dataset_id, { limit: 1000 });
      const spikeArr: Spike[] = spikeData.times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes[i],
        amplitude: spikeData.amplitudes[i],
        waveform: [],
      }));
      setSpikes(spikeArr);

      setLoadingStep('');
      setStatus('ready');
      fetchBackgroundAnalysis(result.dataset_id);
    } catch (e) {
      setLoadingStep('');
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStatus('error');
    }
  }, [fetchBackgroundAnalysis]);

  // ── Load local CSV ─────────────────────────────────────────────────────
  const loadLocalData = useCallback(async (filename: string) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    setDatasetSource(filename.includes('fs437') ? 'fs437' : 'upload');
    setLoadingStep('Loading dataset from server...');
    try {
      const result = await api.loadLocalDataset(filename);
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      const spikeData = await api.getSpikes(result.dataset_id, { limit: 1000 });
      const spikeArr: Spike[] = spikeData.times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes[i],
        amplitude: spikeData.amplitudes[i],
        waveform: [],
      }));
      setSpikes(spikeArr);

      setLoadingStep('');
      setStatus('ready');
      fetchBackgroundAnalysis(result.dataset_id);
    } catch (e) {
      setLoadingStep('');
      setError(e instanceof Error ? e.message : 'Failed to load local data');
      setStatus('error');
    }
  }, [fetchBackgroundAnalysis]);

  // No auto-generate — user chooses data source (FinalSpark, synthetic, upload)

  // ── Debug panel keyboard shortcut (Ctrl+Shift+D) ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const pop     = summary?.population as Record<string, unknown> | undefined;
  const dataset = summary?.dataset    as Record<string, unknown> | undefined;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <DashboardContext.Provider value={{
      datasetId, datasetSource, loadingStep, spikes, duration, nElectrodes,
      summary, burstInfo, cached: { iq: cachedIQ, health: cachedHealth, consciousness: cachedConsciousness },
      status, error, elapsed,
      generateData, uploadData, loadLocalData,
      live, liveConnect, livePause, liveResume, liveDisconnect,
    }}>
      <div className="min-h-screen grain flex" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 'var(--ambient-opacity)' }}>
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[150px]" style={{ background: 'var(--accent-cyan)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full blur-[120px]" style={{ background: 'var(--accent-violet)' }} />
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
        <aside
          className={`
            fixed left-0 top-0 h-full z-40 w-[220px]
            backdrop-blur-2xl flex flex-col
            transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
        >
          {/* Logo */}
          <div className="h-12 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-[14px] font-bold tracking-tight transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>neuro<span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">computers</span></span>
            </Link>
            <button
              className="lg:hidden transition-colors"
              style={{ color: 'var(--text-muted)' }}
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
              <span className="text-[9px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Analysis</span>
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
                    ${active ? 'border' : ''}
                  `}
                  style={active
                    ? { background: 'linear-gradient(to right, color-mix(in srgb, var(--accent-cyan) 15%, transparent), color-mix(in srgb, var(--accent-violet) 10%, transparent))', borderColor: 'color-mix(in srgb, var(--accent-cyan) 15%, transparent)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, var(--accent-cyan), var(--accent-violet))' }} />
                  )}
                  <span className="transition-colors duration-300" style={{ color: active ? 'var(--accent-cyan)' : 'var(--text-faint)' }}>
                    <Icon />
                  </span>
                  {label}
                  {active && <div className="ml-auto w-1 h-1 rounded-full" style={{ background: 'var(--accent-cyan)' }} />}
                </Link>
              );
            })}
          </nav>

          {/* Status in sidebar */}
          {status === 'ready' && datasetId && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>Dataset</div>
              <div className="font-mono text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{datasetId}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{nElectrodes} ch · {duration.toFixed(0)}s</div>
            </div>
          )}

          {/* Footer */}
          <div className="px-2 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setDebugOpen((v) => !v)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[12px] transition-all duration-300 mb-1 ${
                debugOpen ? 'bg-cyan-500/10 border border-cyan-500/15' : 'hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{ color: debugOpen ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              title="Toggle API Debug Panel (Ctrl+Shift+D)"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3l2 1" />
              </svg>
              API Debug
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] hover:bg-[var(--bg-card-hover)] transition-all duration-300"
              style={{ color: 'var(--text-muted)' }}
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
          <header className="sticky top-0 z-20 backdrop-blur-2xl border-b" style={{ background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)', borderColor: 'var(--border)' }}>
            <div className="px-3 sm:px-5 min-h-12 py-1.5 sm:py-0 sm:h-12 flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {/* Mobile menu toggle */}
              <button
                className="lg:hidden transition-colors flex items-center justify-center w-10 h-10 -ml-2"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M3 6h14M3 10h14M3 14h14" />
                </svg>
              </button>

              {/* Status badge + dataset name */}
              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                {status === 'ready' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.12] shrink-0">
                    <LiveDot />
                    <span className="text-[10px] text-emerald-400/80 font-medium">
                      {datasetSource === 'finalspark' || datasetSource === 'fs437'
                        ? 'FinalSpark 5-day'
                        : datasetSource === 'synthetic-30'
                          ? 'Synthetic 30s'
                          : datasetSource === 'synthetic-120'
                            ? 'Synthetic 120s'
                            : datasetSource === 'upload'
                              ? 'Uploaded'
                              : 'READY'}
                    </span>
                    <span className="text-[10px] text-emerald-400/50 font-mono tabular-nums">
                      {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {status === 'loading' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/[0.08] border border-amber-500/[0.12] shrink-0">
                    <div className="w-3 h-3 border-[1.5px] border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-[10px] text-amber-400/80 font-medium">
                      {loadingStep || 'Loading...'}
                    </span>
                  </div>
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/[0.08] border border-red-500/[0.12] shrink-0">
                    <span className="text-[10px] text-red-400/80 font-medium">ERROR</span>
                  </div>
                )}

                {/* Metrics (lg+) */}
                {status === 'ready' && pop && (
                  <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto">
                    <MetricPill label="Spikes" value={String(pop.total_spikes).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    <MetricPill label="Rate" value={String(pop.mean_firing_rate_hz)} unit="Hz" />
                    <MetricPill label="Duration" value={String((dataset?.duration_s as number)?.toFixed(1))} unit="s" />
                    {burstInfo && <MetricPill label="Bursts" value={String(burstInfo.n_bursts)} />}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto max-w-full scrollbar-thin -mx-1 px-1 w-full sm:w-auto order-last sm:order-none basis-full sm:basis-auto">
                <button
                  onClick={async () => {
                    setStatus('loading');
                    setError('');
                    setDatasetSource('finalspark');
                    setLoadingStep('Loading FinalSpark MEA data...');
                    try {
                      const result = await api.loadLocalDataset('SpikeDataToShare_fs437data.csv', 437);
                      const dsId = result.dataset_id;
                      setDatasetId(dsId);
                      setDuration(result.duration_s);
                      setNElectrodes(result.n_electrodes);
                      setLoadingStep('Loading spike data for visualization...');
                      const spikeData = await api.getSpikes(dsId, { limit: 1000 });
                      const times = spikeData?.times ?? [];
                      const electrodes = spikeData?.electrodes ?? [];
                      const amplitudes = spikeData?.amplitudes ?? [];
                      if (times.length === 0) {
                        console.error('[FinalSpark] getSpikes returned empty times', spikeData);
                      }
                      const spikeArr: Spike[] = times.map((t: number, i: number) => ({
                        time: t, electrode: electrodes[i] ?? 0, amplitude: amplitudes[i] ?? 0, waveform: [],
                      }));
                      setSpikes(spikeArr);
                      setLoadingStep('');
                      setStatus(spikeArr.length > 0 ? 'ready' : 'error');
                      if (spikeArr.length === 0) {
                        setError('Spike data loaded but appears empty. Try again.');
                      } else {
                        fetchBackgroundAnalysis(dsId);
                      }
                    } catch (e) {
                      setLoadingStep('');
                      setError(e instanceof Error ? e.message : 'Failed to load FinalSpark data');
                      setStatus('error');
                    }
                  }}
                  disabled={status === 'loading'}
                  className={`text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 disabled:opacity-40 shrink-0 whitespace-nowrap ${
                    datasetSource === 'finalspark' && status === 'ready'
                      ? 'bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 border border-emerald-400/30 text-emerald-300 ring-1 ring-emerald-400/20'
                      : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  {datasetSource === 'finalspark' && status === 'loading' && <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-amber-400/30 border-t-amber-400 rounded-full animate-spin mr-1 align-middle" />}
                  FinalSpark
                  <span className="hidden sm:inline text-[8px] opacity-50 ml-0.5">fs437</span>
                </button>
                {/* FinalSpark metadata tooltip */}
                {datasetSource === 'finalspark' && status === 'ready' && (
                  <span className="hidden lg:inline text-[9px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                    32ch MEA · 4 organoids · 118h · 437Hz
                  </span>
                )}
                {([
                  { src: 'synthetic-30' as DatasetSource, label: '30s', title: 'Generate 30s synthetic data', onClick: () => generateData(30, 8) },
                  { src: 'synthetic-120' as DatasetSource, label: '120s', title: 'Generate 120s synthetic data', onClick: () => generateData(120, 8) },
                ] as const).map((btn) => {
                  const isActive = datasetSource === btn.src && status === 'ready';
                  const isLoading = datasetSource === btn.src && status === 'loading';
                  return (
                    <button
                      key={btn.src}
                      onClick={btn.onClick}
                      disabled={status === 'loading'}
                      title={btn.title}
                      className={`text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 disabled:opacity-40 shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/25 to-violet-500/25 border border-cyan-400/30 text-cyan-300 ring-1 ring-cyan-400/20'
                          : isLoading
                            ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/10 border border-amber-500/20 text-amber-400/80'
                            : 'hover:text-cyan-300'
                      }`}
                      style={!isActive && !isLoading ? { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' } : undefined}
                    >
                      {isLoading && <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-amber-400/30 border-t-amber-400 rounded-full animate-spin mr-1 align-middle" />}
                      {btn.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'loading'}
                  title="Upload your own MEA dataset (CSV, HDF5, Parquet)"
                  className="text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 disabled:opacity-40 shrink-0 whitespace-nowrap"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Upload
                </button>
                {datasetId && status === 'ready' && (
                  <a
                    href={api.getExportCSVUrl(datasetId)}
                    className="text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 shrink-0 whitespace-nowrap"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
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
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.h5,.hdf5,.parquet"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadData(f); }}
        />

        <DebugPanel open={debugOpen} onClose={() => setDebugOpen(false)} />
        <WelcomeModal />
      </div>
    </DashboardContext.Provider>
  );
}

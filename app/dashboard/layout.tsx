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
import { SubsetSelector } from '@/components/dashboard/SubsetSelector';
import { SubsetProvider } from '@/lib/subset-context';
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
  // Publish hidden from public nav until the template-draft generator is
  // polished and carries proper caveats. Route still works by URL for internal use.
  // { href: '/dashboard/publish',      label: 'Publish',      Icon: IconPublish },
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
    <div
      className="flex flex-col px-3 py-1.5 rounded-lg"
      style={{
        background: 'var(--glass-ultra-thin)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: 'inset 0 0 0 1px var(--edge-outline)',
      }}
    >
      <span className="type-eyebrow" style={{ fontSize: '9px' }}>{label}</span>
      <span
        className="tabular"
        style={{
          fontSize: 'var(--t-sm)',
          fontWeight: 'var(--tw-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
        {unit && <span style={{ fontSize: '10px', marginLeft: '2px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{unit}</span>}
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

    // WS endpoint: route production (neurocomputers.io or Vercel preview) to
    // the VPS-hosted API over wss://. Localhost uses plain ws; anything else
    // falls back to same-host:8847 (dev on LAN IP).
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const isProd = host === 'neurocomputers.io' || host === 'www.neurocomputers.io' || host.endsWith('.vercel.app');
    const wsUrl = isProd
      ? 'wss://api.neurocomputers.io/ws/spikes'
      : host === 'localhost'
        ? 'ws://localhost:8847/ws/spikes'
        : `ws://${host}:8847/ws/spikes`;
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
    // Reset all derived-from-summary state up-front, otherwise the header keeps
    // showing the previous dataset's SPIKES / DURATION / BURSTS until the new
    // summary arrives (visible 1-2s race during dataset switch).
    setSummary(null);
    setBurstInfo(null);
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

    // NOTE: consciousness is NOT fetched here. It's the single most expensive
    // endpoint (IIT Phi + PCI + transfer entropy) and on FinalSpark it can
    // saturate the backend Semaphore for a minute+, blocking every other
    // request. Loaded on demand from the Discovery page instead.
    setCachedConsciousness(null);
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

  // Current page label for mobile breadcrumb (sidebar is hidden on phone)
  const currentPage = NAV.find((n) => isActive(n.href)) ?? NAV[0];

  return (
    <SubsetProvider>
    <DashboardContext.Provider value={{
      datasetId, datasetSource, loadingStep, spikes, duration, nElectrodes,
      summary, burstInfo, cached: { iq: cachedIQ, health: cachedHealth, consciousness: cachedConsciousness },
      status, error, elapsed,
      generateData, uploadData, loadLocalData,
      live, liveConnect, livePause, liveResume, liveDisconnect,
    }}>
      <div className="min-h-screen grain flex" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Ambient bio-tinted blobs — subsurface glow beneath glass layers */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 'var(--ambient-opacity)' }}>
          <div className="absolute top-0 left-1/4 w-[720px] h-[480px] rounded-full blur-[160px]" style={{ background: 'var(--bio-primary-500)' }} />
          <div className="absolute bottom-0 right-1/4 w-[560px] h-[340px] rounded-full blur-[140px]" style={{ background: 'var(--bio-neural-500)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[180px]" style={{ background: 'var(--bio-spark-600)', opacity: 0.35 }} />
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

        {/* ── Sidebar (Liquid Glass) ─────────────────────────────────── */}
        <aside
          className={`
            fixed left-0 top-0 h-full z-40 w-[220px]
            flex flex-col
            transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            background: 'var(--glass-thin)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            boxShadow: 'inset -1px 0 0 var(--edge-outline), 1px 0 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Logo */}
          <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--edge-outline)' }}>
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-display" style={{ fontSize: 'var(--t-md)', fontWeight: 'var(--tw-semibold)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                neuro
                <span className="text-hero-gradient">computers</span>
              </span>
            </Link>
            <button
              className="lg:hidden motion-fast"
              style={{ color: 'var(--text-tertiary)' }}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Primary">
            <div className="px-2 pb-2">
              <span className="type-eyebrow">Analysis</span>
            </div>
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl relative motion-spring group"
                  style={active
                    ? {
                        background: 'color-mix(in srgb, var(--bio-primary-500) 10%, var(--glass-regular))',
                        boxShadow: 'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px color-mix(in srgb, var(--bio-primary-500) 25%, transparent)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--t-sm)',
                        fontWeight: 'var(--tw-semibold)',
                      }
                    : {
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--t-sm)',
                        fontWeight: 'var(--tw-medium)',
                      }
                  }
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full"
                      style={{ background: 'linear-gradient(180deg, var(--bio-primary-500), var(--bio-neural-500))', boxShadow: '0 0 8px color-mix(in srgb, var(--bio-primary-500) 50%, transparent)' }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="motion-fast" style={{ color: active ? 'var(--bio-primary-500)' : 'var(--text-tertiary)' }}>
                    <Icon />
                  </span>
                  {label}
                  {active && (
                    <span
                      className="ml-auto pulse-dot"
                      style={{ background: 'var(--bio-primary-500)', boxShadow: '0 0 8px var(--bio-primary-500)', width: '6px', height: '6px' }}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status in sidebar */}
          {status === 'ready' && datasetId && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--edge-outline)' }}>
              <div className="type-eyebrow" style={{ marginBottom: '6px' }}>Dataset</div>
              <div className="font-mono truncate" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{datasetId}</div>
              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--text-tertiary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{nElectrodes} ch · {duration.toFixed(0)}s</div>
            </div>
          )}

          {/* Footer */}
          <div className="px-2 pb-4 pt-2" style={{ borderTop: '1px solid var(--edge-outline)' }}>
            <div className="flex items-center justify-between px-3 py-2 mb-1">
              <span className="type-eyebrow">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setDebugOpen((v) => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl motion-spring mb-1"
              style={debugOpen
                ? {
                    background: 'color-mix(in srgb, var(--bio-spark-600) 14%, var(--glass-ultra-thin))',
                    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-spark-600) 30%, transparent)',
                    color: 'var(--bio-spark-600)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 'var(--tw-medium)',
                  }
                : {
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 'var(--tw-medium)',
                  }
              }
              title="Toggle API Debug Panel (Ctrl+Shift+D)"
              aria-label="Toggle API debug panel"
              aria-expanded={debugOpen}
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3l2 1" />
              </svg>
              API Debug
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl motion-spring"
              style={{ color: 'var(--text-secondary)', fontSize: 'var(--t-sm)', fontWeight: 'var(--tw-medium)' }}
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
          {/* Floating glass header */}
          <header
            className="sticky top-0 z-20"
            style={{
              background: 'color-mix(in srgb, var(--surface-1) 72%, transparent)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              boxShadow: 'inset 0 -1px 0 var(--edge-outline), 0 1px 0 rgba(0,0,0,0.04)',
            }}>
            <div className="px-3 sm:px-5 min-h-12 py-1.5 sm:py-0 sm:h-12 flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {/* Mobile menu toggle + current page label (sidebar hidden on phone) */}
              <div className="flex items-center gap-2 lg:hidden -ml-1">
                <button
                  type="button"
                  className="transition-colors flex items-center justify-center w-10 h-10"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                    <path d="M3 6h14M3 10h14M3 14h14" />
                  </svg>
                </button>
                <span
                  className="truncate"
                  style={{
                    fontSize: 'var(--t-sm)',
                    fontWeight: 'var(--tw-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {currentPage.label}
                </span>
              </div>

              {/* Status badge + dataset name */}
              <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                {status === 'ready' && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--bio-success-500) 12%, var(--glass-ultra-thin))',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-success-500) 28%, transparent)',
                    }}
                  >
                    <LiveDot />
                    <span
                      style={{
                        fontSize: 'var(--t-xs)',
                        color: 'var(--bio-success-500)',
                        fontWeight: 'var(--tw-semibold)',
                        letterSpacing: '0.01em',
                      }}
                    >
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
                    <span
                      className="font-mono tabular"
                      style={{
                        fontSize: '10px',
                        color: 'color-mix(in srgb, var(--bio-success-500) 60%, transparent)',
                      }}
                    >
                      {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {status === 'loading' && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--bio-warn-500) 14%, var(--glass-ultra-thin))',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-warn-500) 30%, transparent)',
                    }}
                  >
                    <div
                      className="anim-spin-slow"
                      style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background:
                          'conic-gradient(from 0deg, var(--bio-warn-500), var(--bio-primary-500), var(--bio-warn-500))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                      }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontSize: 'var(--t-xs)',
                        color: 'var(--bio-warn-500)',
                        fontWeight: 'var(--tw-semibold)',
                      }}
                    >
                      {loadingStep || 'Loading…'}
                    </span>
                  </div>
                )}
                {status === 'error' && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--bio-error-500) 12%, var(--glass-ultra-thin))',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-error-500) 28%, transparent)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--t-xs)',
                        color: 'var(--bio-error-500)',
                        fontWeight: 'var(--tw-semibold)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ERROR
                    </span>
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

                {/* Subset selector — only shown for recordings > 1h (FinalSpark, large uploads) */}
                {status === 'ready' && (
                  <SubsetSelector datasetId={datasetId} durationSeconds={duration} />
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
                  className="motion-spring shrink-0 whitespace-nowrap inline-flex items-center gap-1.5"
                  style={{
                    fontSize: 'var(--t-xs)',
                    fontWeight: 'var(--tw-semibold)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: datasetSource === 'finalspark' && status === 'ready'
                      ? 'color-mix(in srgb, var(--bio-primary-500) 22%, var(--glass-ultra-thin))'
                      : 'color-mix(in srgb, var(--bio-primary-500) 14%, var(--glass-ultra-thin))',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: 'var(--bio-primary-500)',
                    boxShadow: datasetSource === 'finalspark' && status === 'ready'
                      ? 'inset 0 0 0 1px color-mix(in srgb, var(--bio-primary-500) 45%, transparent), 0 0 16px color-mix(in srgb, var(--bio-primary-500) 18%, transparent)'
                      : 'inset 0 0 0 1px color-mix(in srgb, var(--bio-primary-500) 28%, transparent)',
                    border: 'none',
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    opacity: status === 'loading' ? 0.5 : 1,
                  }}
                >
                  {datasetSource === 'finalspark' && status === 'loading' && (
                    <span
                      className="anim-spin-slow"
                      style={{
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, var(--bio-primary-500), var(--bio-spark-600), var(--bio-primary-500))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  FinalSpark
                  <span
                    className="hidden sm:inline"
                    style={{ fontSize: '9px', opacity: 0.55, marginLeft: '2px', letterSpacing: '0.04em' }}
                  >
                    fs437
                  </span>
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
                      className="motion-spring shrink-0 whitespace-nowrap inline-flex items-center gap-1.5"
                      style={{
                        fontSize: 'var(--t-xs)',
                        fontWeight: 'var(--tw-semibold)',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: isActive
                          ? 'color-mix(in srgb, var(--bio-spark-600) 20%, var(--glass-ultra-thin))'
                          : 'var(--glass-ultra-thin)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        color: isActive ? 'var(--bio-spark-600)' : 'var(--text-secondary)',
                        boxShadow: isActive
                          ? 'inset 0 0 0 1px color-mix(in srgb, var(--bio-spark-600) 40%, transparent), 0 0 14px color-mix(in srgb, var(--bio-spark-600) 16%, transparent)'
                          : 'inset 0 0 0 1px var(--edge-outline)',
                        border: 'none',
                        cursor: status === 'loading' ? 'wait' : 'pointer',
                        opacity: status === 'loading' && !isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading && (
                        <span
                          className="anim-spin-slow"
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '50%',
                            background: 'conic-gradient(from 0deg, var(--bio-warn-500), var(--bio-primary-500), var(--bio-warn-500))',
                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), black calc(100% - 1.5px))',
                          }}
                          aria-hidden="true"
                        />
                      )}
                      {btn.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'loading'}
                  title="Upload your own MEA dataset (CSV, HDF5, Parquet)"
                  className="motion-spring shrink-0 whitespace-nowrap"
                  style={{
                    fontSize: 'var(--t-xs)',
                    fontWeight: 'var(--tw-semibold)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--glass-ultra-thin)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'inset 0 0 0 1px var(--edge-outline)',
                    border: 'none',
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                    opacity: status === 'loading' ? 0.5 : 1,
                  }}
                >
                  Upload
                </button>
                {datasetId && status === 'ready' && (
                  <a
                    href={api.getExportCSVUrl(datasetId)}
                    className="motion-spring shrink-0 whitespace-nowrap inline-flex items-center"
                    style={{
                      fontSize: 'var(--t-xs)',
                      fontWeight: 'var(--tw-semibold)',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--glass-ultra-thin)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      color: 'var(--text-secondary)',
                      boxShadow: 'inset 0 0 0 1px var(--edge-outline)',
                    }}
                  >
                    CSV
                  </a>
                )}
              </div>
            </div>

            {/* Error bar */}
            {error && (
              <div className="px-4 pb-3">
                <div
                  className="px-4 py-2.5 rounded-xl anim-fade-in-down"
                  style={{
                    background: 'color-mix(in srgb, var(--bio-error-500) 12%, var(--glass-ultra-thin))',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-error-500) 28%, transparent)',
                    fontSize: 'var(--t-sm)',
                    fontWeight: 'var(--tw-medium)',
                    color: 'var(--bio-error-500)',
                  }}
                >
                  {error}
                </div>
              </div>
            )}
          </header>

          {/* Page content */}
          <main id="main-content" className="flex-1 relative z-10 min-h-0" tabIndex={-1}>
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
    </SubsetProvider>
  );
}

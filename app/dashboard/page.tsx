'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';
import RasterPlot from '@/components/dashboard/RasterPlot';
import FiringRateHeatmap from '@/components/dashboard/FiringRateHeatmap';
import SpikeWaveforms from '@/components/dashboard/SpikeWaveforms';
import ISIHistogram from '@/components/dashboard/ISIHistogram';
import CrossCorrelogram from '@/components/dashboard/CrossCorrelogram';
import ConnectivityGraph from '@/components/dashboard/ConnectivityGraph';
import type { Spike } from '@/lib/types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
    </span>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <span className="text-[14px] font-medium text-white/80 tabular-nums">
        {value}{unit && <span className="text-[11px] text-white/40 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.05 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function DashboardPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [spikes, setSpikes] = useState<Spike[]>([]);
  const [duration, setDuration] = useState(30);
  const [nElectrodes, setNElectrodes] = useState(8);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [burstInfo, setBurstInfo] = useState<{ n_bursts: number; burst_rate_per_min: number; mean_duration_ms: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer
  useEffect(() => {
    if (status !== 'ready') return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Generate synthetic data via API
  const handleGenerate = useCallback(async (dur = 30, electrodes = 8, burstProb = 0.15) => {
    setStatus('loading');
    setError('');
    setElapsed(0);
    try {
      const result = await api.generateDataset({ duration: dur, n_electrodes: electrodes, burst_probability: burstProb });
      setDatasetId(result.dataset_id);
      setDuration(result.duration_s);
      setNElectrodes(result.n_electrodes);

      // Fetch spikes for visualization
      const spikeData = await api.getSpikes(result.dataset_id, { limit: 15000 });
      const spikeArr: Spike[] = spikeData.times.map((t: number, i: number) => ({
        time: t,
        electrode: spikeData.electrodes[i],
        amplitude: spikeData.amplitudes[i],
        waveform: [],
      }));
      setSpikes(spikeArr);

      // Fetch summary + bursts in parallel
      const [summaryData, burstData] = await Promise.all([
        api.getFullSummary(result.dataset_id),
        api.getBursts(result.dataset_id),
      ]);
      setSummary(summaryData);
      setBurstInfo(burstData);

      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate data');
      setStatus('error');
    }
  }, []);

  // Upload file
  const handleUpload = useCallback(async (file: File) => {
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
      setBurstInfo(burstData);

      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStatus('error');
    }
  }, []);

  // Auto-generate on first load
  useEffect(() => { handleGenerate(30, 8); }, [handleGenerate]);

  const pop = summary?.population as Record<string, unknown> | undefined;
  const dataset = summary?.dataset as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-[#05060a] text-white grain">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/[0.015] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-violet-500/[0.015] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#05060a]/60 border-b border-white/[0.04]">
        <div className="px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-[9px] font-bold text-black">N</div>
              <span className="text-[13px] text-white/60 tracking-tight hidden sm:inline">NeuroBridge</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.06] hidden sm:block" />
            <span className="text-[12px] text-white/40 hidden sm:inline">Dashboard</span>
          </div>

          <div className="flex items-center gap-2">
            {status === 'ready' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.12]">
                <LiveDot />
                <span className="text-[10px] text-emerald-400/80 font-medium">READY</span>
                <span className="text-[10px] text-emerald-400/50 font-mono tabular-nums">
                  {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            {status === 'loading' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/[0.08] border border-amber-500/[0.12]">
                <span className="text-[10px] text-amber-400/80 font-medium animate-pulse">ANALYZING...</span>
              </div>
            )}
            <Link href="/" className="text-[11px] px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.08] transition-all duration-300">
              Exit
            </Link>
          </div>
        </div>

        {/* Controls bar */}
        <div className="px-4 sm:px-6 pb-2.5 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleGenerate(30, 8)}
            disabled={status === 'loading'}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400/80 hover:text-cyan-300 transition-all duration-300 disabled:opacity-40 shrink-0"
          >
            Generate 30s
          </button>
          <button
            onClick={() => handleGenerate(120, 8)}
            disabled={status === 'loading'}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300 disabled:opacity-40 shrink-0"
          >
            Generate 120s
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'loading'}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300 disabled:opacity-40 shrink-0"
          >
            Upload CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.h5,.hdf5,.parquet"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />

          {datasetId && status === 'ready' && (
            <a
              href={api.getExportCSVUrl(datasetId)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.04] text-white/40 hover:text-white/70 transition-all duration-300 shrink-0"
            >
              Export CSV
            </a>
          )}

          <div className="h-4 w-px bg-white/[0.04] hidden md:block shrink-0" />

          {/* Stats */}
          {status === 'ready' && pop && (
            <div className="hidden md:flex items-center gap-2">
              <MetricCard label="Spikes" value={String(pop.total_spikes).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              <MetricCard label="Rate" value={String(pop.mean_firing_rate_hz)} unit="Hz" />
              <MetricCard label="Duration" value={String((dataset?.duration_s as number)?.toFixed(1))} unit="s" />
              {burstInfo && <MetricCard label="Bursts" value={String(burstInfo.n_bursts)} />}
              {burstInfo && <MetricCard label="Burst Rate" value={burstInfo.burst_rate_per_min.toFixed(1)} unit="/min" />}
            </div>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
          {error}
        </div>
      )}

      {/* Dashboard Grid */}
      <main className="relative z-10 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {status === 'loading' && spikes.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[13px] text-white/30">Generating and analyzing neural data...</p>
            </div>
          </div>
        ) : spikes.length > 0 ? (
          <>
            {[
              { title: 'Raster Plot', desc: `${spikes.length.toLocaleString()} spikes across ${nElectrodes} electrodes`, span: 'lg:col-span-2 xl:col-span-2' },
              { title: 'Network Connectivity', desc: 'Functional connections (co-firing analysis)', span: '' },
              { title: 'Firing Rate Heatmap', desc: 'Spike frequency over time per electrode', span: 'lg:col-span-2' },
              { title: 'Spike Waveforms', desc: 'Overlaid spike shapes per electrode', span: '' },
              { title: 'ISI Distribution', desc: 'Inter-spike interval histogram (log scale)', span: '' },
              { title: 'Cross-Correlogram', desc: 'Temporal correlation between electrode pairs', span: '' },
            ].map((card, i) => (
              <motion.div key={card.title} custom={i} initial="hidden" animate="visible" variants={cardVariants} className={card.span}>
                <ChartCard title={card.title} description={card.desc}>
                  {i === 0 && <RasterPlot spikes={spikes} duration={duration} electrodes={nElectrodes} />}
                  {i === 1 && <ConnectivityGraph spikes={spikes} electrodes={nElectrodes} />}
                  {i === 2 && <FiringRateHeatmap spikes={spikes} duration={duration} electrodes={nElectrodes} />}
                  {i === 3 && <SpikeWaveforms spikes={spikes} electrodes={nElectrodes} />}
                  {i === 4 && <ISIHistogram spikes={spikes} electrodes={nElectrodes} />}
                  {i === 5 && <CrossCorrelogram spikes={spikes} electrodes={nElectrodes} />}
                </ChartCard>
              </motion.div>
            ))}

            {/* Analysis Summary Card */}
            {summary && burstInfo && (
              <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants} className="xl:col-span-3 lg:col-span-2">
                <ChartCard title="Analysis Summary" description={`Dataset ${datasetId} · Computed by NeuroBridge API`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                    <div>
                      <div className="text-white/25 mb-1">Population</div>
                      <div className="text-white/70">Mean rate: <span className="text-cyan-400">{String(pop?.mean_firing_rate_hz)} Hz</span></div>
                      <div className="text-white/70">Most active: <span className="text-cyan-400">E{String(pop?.most_active_electrode)}</span></div>
                      <div className="text-white/70">Mean amp: <span className="text-cyan-400">{String((pop?.mean_amplitude_uv as number)?.toFixed(1))} uV</span></div>
                    </div>
                    <div>
                      <div className="text-white/25 mb-1">Bursts</div>
                      <div className="text-white/70">Detected: <span className="text-violet-400">{burstInfo.n_bursts}</span></div>
                      <div className="text-white/70">Rate: <span className="text-violet-400">{burstInfo.burst_rate_per_min.toFixed(1)}/min</span></div>
                      <div className="text-white/70">Mean dur: <span className="text-violet-400">{burstInfo.mean_duration_ms.toFixed(0)} ms</span></div>
                    </div>
                    <div>
                      <div className="text-white/25 mb-1">Dataset</div>
                      <div className="text-white/70">ID: <span className="text-white/50 font-mono">{datasetId}</span></div>
                      <div className="text-white/70">Electrodes: <span className="text-white/50">{nElectrodes}</span></div>
                      <div className="text-white/70">Duration: <span className="text-white/50">{duration.toFixed(1)}s</span></div>
                    </div>
                    <div>
                      <div className="text-white/25 mb-1">API</div>
                      <div className="text-white/70">
                        <a href={api.getSwaggerUrl()} target="_blank" rel="noopener" className="text-cyan-400/60 hover:text-cyan-400 underline">
                          Open Swagger UI
                        </a>
                      </div>
                      <div className="text-white/70">
                        <a href={datasetId ? api.getExportCSVUrl(datasetId) : '#'} className="text-cyan-400/60 hover:text-cyan-400 underline">
                          Download CSV
                        </a>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

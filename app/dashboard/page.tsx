'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import * as api from '@/lib/api';
import { useDashboardContext } from '@/lib/dashboard-context';
import ChartCard from '@/components/dashboard/ChartCard';
import RasterPlot from '@/components/dashboard/RasterPlot';
import FiringRateHeatmap from '@/components/dashboard/FiringRateHeatmap';
import SpikeWaveforms from '@/components/dashboard/SpikeWaveforms';
import ISIHistogram from '@/components/dashboard/ISIHistogram';
import CrossCorrelogram from '@/components/dashboard/CrossCorrelogram';
import ConnectivityGraph from '@/components/dashboard/ConnectivityGraph';
import AdvancedAnalysis from '@/components/dashboard/AdvancedAnalysis';

type Tab = 'visualizations' | 'advanced';

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.05 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/** Shimmer bar for loading stat values */
function StatShimmer() {
  return (
    <div className="h-[18px] w-16 rounded-md mt-0.5" style={{
      background: 'linear-gradient(90deg, var(--border) 25%, rgba(255,255,255,0.08) 50%, var(--border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'stat-shimmer 1.5s ease-in-out infinite',
    }} />
  );
}

function QuickStats() {
  const router = useRouter();
  const { cached } = useDashboardContext();
  const { iq, health, consciousness } = cached;

  const iqScore = Number(iq?.iq_score ?? iq?.score ?? 0);
  const iqGrade = String(iq?.grade ?? '?');
  const healthRaw = Number(health?.health_score ?? health?.overall_score ?? 0);
  const healthScore = healthRaw > 1 ? healthRaw : healthRaw * 100; // normalize: API may return 80 or 0.80
  const consRaw = Number(consciousness?.consciousness_score ?? (consciousness?.sentience_risk as Record<string,unknown>)?.overall_score ?? 0);
  const consScore = consRaw > 1 ? consRaw : consRaw * 100; // normalize
  const consRisk = String(consciousness?.overall_risk_level ?? consciousness?.interpretation ?? '?');

  const cards = [
    {
      label: 'NCI Score',
      tip: 'Network Complexity Index: 6-dimension composite of signal, connectivity, information, temporal, adaptability, learning properties (0-100)',
      loading: iq === undefined,
      value: iqScore > 0 ? `${iqScore.toFixed(0)} (${iqGrade})` : iq === null ? '—' : '',
      color: iqScore >= 60 ? 'text-cyan-400' : iqScore >= 40 ? 'text-amber-400' : 'text-amber-400',
      bg: 'from-cyan-500/8 border-cyan-500/10',
      href: '/dashboard/iq',
    },
    {
      label: 'Health',
      tip: 'Viability estimate: firing regularity, electrode coverage, amplitude stability',
      loading: health === undefined,
      value: healthScore > 0 ? `${healthScore.toFixed(0)}%` : health === null ? '—' : '',
      color: healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-red-400',
      bg: 'from-emerald-500/8 border-emerald-500/10',
      href: '/dashboard/iq',
    },
    {
      label: 'Complexity',
      tip: 'Network integration index: information integration + recurrence + dynamics. Higher = more complex network',
      loading: consciousness === undefined,
      value: consScore > 0 ? `${consScore.toFixed(0)}%` : consciousness === null ? '—' : '',
      color: consScore > 50 ? 'text-red-400' : consScore > 30 ? 'text-amber-400' : 'text-emerald-400',
      bg: 'from-violet-500/8 border-violet-500/10',
      href: '/dashboard/discovery',
    },
    {
      label: 'Modules',
      tip: '9 peer-reviewed analysis modules with 64 individual analysis endpoints',
      loading: false,
      value: '64 analyses',
      color: 'text-cyan-400',
      bg: 'from-cyan-500/8 border-cyan-500/10',
      href: '/dashboard/experiments',
    },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes stat-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            onClick={() => router.push(card.href)}
            title={card.tip}
            className={`px-3 py-2.5 rounded-xl bg-gradient-to-br ${card.bg} border cursor-pointer hover:scale-[1.02] transition-transform`}
          >
            <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
            {card.loading
              ? <StatShimmer />
              : <div className={`text-[15px] font-bold tabular-nums ${card.color}`}>{card.value}</div>
            }
          </motion.div>
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { datasetId, spikes, duration, nElectrodes, summary, burstInfo, status, loadingStep } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<Tab>('visualizations');
  const [reportLoading, setReportLoading] = useState(false);

  const downloadFullReport = async () => {
    if (!datasetId) return;
    setReportLoading(true);
    try {
      const report = await api.getFullReport(datasetId);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurobridge-report-${datasetId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setReportLoading(false);
  };

  const pop     = summary?.population as Record<string, unknown> | undefined;
  const dataset = summary?.dataset    as Record<string, unknown> | undefined;

  // Empty state — no data loaded yet
  if (status === 'idle' && !datasetId) {
    return (
      <div className="p-3 sm:p-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-[20px] font-display mb-2" style={{ color: 'var(--text-primary)' }}>Load data to begin analysis</h2>
          <p className="text-[13px] max-w-md leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
            Choose a data source from the header: <strong className="text-emerald-400">FinalSpark</strong> for real organoid data (2.6M spikes, 32ch MEA, 118h),
            or <strong style={{ color: 'var(--text-secondary)' }}>30s/120s</strong> to generate synthetic spike data for testing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full text-[11px]">
            <div className="px-4 py-3 rounded-xl text-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-medium text-emerald-400 mb-1">FinalSpark</div>
              <div style={{ color: 'var(--text-faint)' }}>Real organoid MEA recording. 4 organoids, 5 days, 437Hz.</div>
            </div>
            <div className="px-4 py-3 rounded-xl text-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Synthetic</div>
              <div style={{ color: 'var(--text-faint)' }}>Generated spike data with configurable burst probability.</div>
            </div>
            <div className="px-4 py-3 rounded-xl text-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Upload</div>
              <div style={{ color: 'var(--text-faint)' }}>Your own CSV/HDF5/NWB file. Any MEA system.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      {/* Quick Stats */}
      {status === 'ready' && datasetId && <QuickStats />}

      {/* Tab navigation */}
      {status === 'ready' && datasetId && (
        <div className="flex gap-1 mb-3">
          {([
            { key: 'visualizations' as Tab, label: 'Visualizations', count: 6 },
            { key: 'advanced'       as Tab, label: 'Advanced', count: 12 },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400/90'
                  : 'border'
              }`}
              style={activeTab !== tab.key ? { background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' } : undefined}
            >
              {tab.label}
              {tab.count && <span className="ml-1 text-[9px] opacity-50">{tab.count}</span>}
            </button>
          ))}
          <button
            onClick={downloadFullReport}
            disabled={reportLoading}
            className="text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 disabled:opacity-40 ml-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {reportLoading ? 'Generating...' : 'Full Report JSON'}
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && spikes.length === 0 && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {loadingStep || 'Preparing...'}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              First load may take longer while the app compiles
            </p>
          </div>
        </div>
      )}

      {/* Content grid */}
      {spikes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Advanced Analysis tab */}
          {activeTab === 'advanced' && datasetId && (
            <div className="col-span-full">
              <AdvancedAnalysis datasetId={datasetId} />
            </div>
          )}

          {/* Visualizations tab */}
          {activeTab === 'visualizations' && (
            <>
              {([
                { title: 'Raster Plot',          desc: `${spikes.length.toLocaleString()} spikes · ${nElectrodes} electrodes`, span: 'lg:col-span-2 xl:col-span-2', size: 'lg' as const },
                { title: 'Network Connectivity', desc: 'Co-firing functional connections',                                      span: '', size: 'md' as const },
                { title: 'Firing Rate Heatmap',  desc: 'Spike frequency over time per electrode',                              span: 'lg:col-span-2', size: 'md' as const },
                { title: 'Spike Waveforms',      desc: 'Overlaid spike shapes per electrode',                                  span: '', size: 'md' as const },
                { title: 'ISI Distribution',     desc: 'Inter-spike interval histogram (log scale)',                           span: '', size: 'md' as const },
                { title: 'Cross-Correlogram',    desc: 'Temporal correlation between electrode pairs',                         span: '', size: 'md' as const },
              ]).map((card, i) => {
                const isLoading = status === 'loading' && spikes.length === 0;
                const paramsText = [
                  'window=full recording',
                  'method=cofiring · bin=10ms · min_strength=0.02',
                  'bin_size=1.0s',
                  'n_samples=100 per electrode',
                  'bin_width=auto · max_isi=100ms',
                  'max_lag=50ms · bin_size=1ms',
                ][i];
                return (
                  <motion.div key={card.title} custom={i} initial="hidden" animate="visible" variants={cardVariants} className={card.span}>
                    <ChartCard title={card.title} description={card.desc} loading={isLoading} skeletonSize={card.size}>
                      {i === 0 && <RasterPlot       spikes={spikes} duration={duration}    electrodes={nElectrodes} />}
                      {i === 1 && <ConnectivityGraph spikes={spikes}                        electrodes={nElectrodes} />}
                      {i === 2 && <FiringRateHeatmap spikes={spikes} duration={duration}    electrodes={nElectrodes} />}
                      {i === 3 && <SpikeWaveforms    spikes={spikes}                        electrodes={nElectrodes} />}
                      {i === 4 && <ISIHistogram      spikes={spikes}                        electrodes={nElectrodes} />}
                      {i === 5 && <CrossCorrelogram  spikes={spikes}                        electrodes={nElectrodes} />}
                      <div className="text-[9px] mt-2 pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}>
                        {paramsText}
                      </div>
                    </ChartCard>
                  </motion.div>
                );
              })}
            </>
          )}

          {/* Summary (shown in visualizations tab) */}
          {activeTab === 'visualizations' && summary && burstInfo && (
            <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants} className="xl:col-span-3 lg:col-span-2">
              <ChartCard title="Analysis Summary" description={`Dataset ${datasetId} · Neurocomputers API`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                  <div>
                    <div className="mb-1.5" style={{ color: 'var(--text-faint)' }}>Population</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Mean rate: <span className="text-cyan-400">{String(pop?.mean_firing_rate_hz ?? '—')} Hz</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Most active: <span className="text-cyan-400">E{String(pop?.most_active_electrode ?? '—')}</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Mean amp: <span className="text-cyan-400">{(pop?.mean_amplitude_uv as number | undefined)?.toFixed(1) ?? '—'} µV</span></div>
                  </div>
                  <div>
                    <div className="mb-1.5" style={{ color: 'var(--text-faint)' }}>Bursts</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Detected: <span className="text-violet-400">{burstInfo.n_bursts}</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Rate: <span className="text-violet-400">{burstInfo.burst_rate_per_min.toFixed(1)}/min</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Mean dur: <span className="text-violet-400">{burstInfo.mean_duration_ms.toFixed(0)} ms</span></div>
                  </div>
                  <div>
                    <div className="mb-1.5" style={{ color: 'var(--text-faint)' }}>Dataset</div>
                    <div style={{ color: 'var(--text-secondary)' }}>ID: <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{datasetId}</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Electrodes: <span style={{ color: 'var(--text-muted)' }}>{nElectrodes}</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>Duration: <span style={{ color: 'var(--text-muted)' }}>{duration.toFixed(1)}s</span></div>
                  </div>
                  <div>
                    <div className="mb-1.5" style={{ color: 'var(--text-faint)' }}>API</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <a href={api.getSwaggerUrl()} target="_blank" rel="noopener" className="text-cyan-400/60 hover:text-cyan-400 underline">Swagger UI</a>
                    </div>
                    {datasetId && (
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <a href={api.getExportCSVUrl(datasetId)} className="text-cyan-400/60 hover:text-cyan-400 underline">Download CSV</a>
                      </div>
                    )}
                  </div>
                </div>
              </ChartCard>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

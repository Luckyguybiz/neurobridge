'use client';

import { useState, useEffect } from 'react';
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
import { StatCard, Segmented, Panel, Button, Badge, Glass } from '@/components/design';
import type { GlassTint } from '@/components/design';
import { RadialGauge } from '@/components/charts/RadialGauge';

type Tab = 'visualizations' | 'advanced';

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.05 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function NCIHero() {
  const router = useRouter();
  const { cached, summary, burstInfo, nElectrodes, duration } = useDashboardContext();
  const { iq, health, consciousness } = cached;

  const iqScore = Number(iq?.iq_score ?? iq?.score ?? 0);
  const iqGrade = String(iq?.grade ?? '?');
  const iqLoading = iq === undefined;

  const healthRaw = Number(health?.health_score ?? health?.overall_score ?? 0);
  const healthScore = healthRaw > 1 ? healthRaw : healthRaw * 100;

  const consRaw = Number(consciousness?.consciousness_score ?? (consciousness?.sentience_risk as Record<string,unknown>)?.overall_score ?? 0);
  const consScore = consRaw > 1 ? consRaw : consRaw * 100;

  const pop = summary?.population as Record<string, unknown> | undefined;
  const meanRate = Number(pop?.mean_firing_rate_hz ?? 0);

  const sideStats: Array<{ label: string; value: string; unit?: string; caption?: string; tint: GlassTint; loading: boolean; href: string }> = [
    {
      label: 'Health',
      value: healthScore > 0 ? healthScore.toFixed(0) : health === null ? '—' : '',
      unit: healthScore > 0 ? '%' : undefined,
      caption: 'Viability estimate',
      tint: healthScore >= 70 ? 'primary' : healthScore >= 40 ? 'warn' : 'error',
      loading: health === undefined,
      href: '/dashboard/iq',
    },
    {
      label: 'Complexity',
      value: consScore > 0 ? consScore.toFixed(0) : 'Open',
      unit: consScore > 0 ? '%' : '→',
      caption: consScore > 0 ? 'Integration index' : 'Run on Discovery',
      tint: 'neural',
      loading: consciousness === undefined,
      href: '/dashboard/discovery',
    },
    {
      label: 'Firing rate',
      value: meanRate > 0 ? meanRate.toFixed(2) : '—',
      unit: meanRate > 0 ? 'Hz' : undefined,
      caption: `${nElectrodes} ch · ${duration.toFixed(0)}s`,
      tint: 'spark',
      loading: summary == null,
      href: '/dashboard/spikes',
    },
    {
      label: 'Bursts',
      value: burstInfo ? String(burstInfo.n_bursts) : '—',
      unit: burstInfo ? `${burstInfo.burst_rate_per_min.toFixed(1)}/min` : undefined,
      caption: 'Network bursts',
      tint: 'primary',
      loading: burstInfo == null,
      href: '/dashboard/network',
    },
  ];

  return (
    <Glass
      radius="2xl"
      elevation={3}
      className="mb-4 anim-spring-in"
      style={{ padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle bio-accent blob under gauge */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--bio-primary-500) 22%, transparent), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8"
        style={{ position: 'relative' }}
      >
        {/* Hero radial */}
        <button
          type="button"
          onClick={() => router.push('/dashboard/iq')}
          aria-label={`NCI Score ${iqScore.toFixed(0)} grade ${iqGrade}, open Complexity page`}
          className="motion-spring"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', flex: '0 0 auto' }}
        >
          <RadialGauge
            value={iqLoading || !iq ? 0 : iqScore}
            max={100}
            size={220}
            accent="auto"
            autoThresholds={[40, 60]}
            label="NCI Score"
            subtitle={iqLoading ? 'Computing…' : iq == null ? 'Not available' : `Grade ${iqGrade} · out of 100`}
            loading={iqLoading}
            ticks={10}
          />
        </button>

        {/* Side stats */}
        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          {sideStats.map((s, i) => (
            <motion.button
              key={s.label}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => router.push(s.href)}
              aria-label={`${s.label}: ${s.value}`}
              className="text-left"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <StatCard
                label={s.label}
                value={s.value}
                unit={s.unit}
                caption={s.caption}
                tint={s.tint}
                size="sm"
                loading={s.loading}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </Glass>
  );
}

export default function DashboardPage() {
  const { datasetId, spikes, duration, nElectrodes, summary, burstInfo, status, loadingStep, cached } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<Tab>('visualizations');
  const [reportLoading, setReportLoading] = useState(false);

  // Staggered chart rendering — avoid blocking browser with 6 D3 charts at once.
  // Resets the count when spikes change (new dataset loaded), then drips in the
  // remaining charts over 1 second.
  const [chartsReady, setChartsReady] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to spikes prop change
    if (spikes.length === 0) { setChartsReady(0); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prime initial render after new data
    setChartsReady(2);
    const t1 = setTimeout(() => setChartsReady(4), 500);
    const t2 = setTimeout(() => setChartsReady(6), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [spikes.length]);

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
      <div className="p-4 sm:p-8">
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center anim-spring-in">
          {/* Breathing orb — sits where the emoji used to live */}
          <div
            className="anim-breathe"
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              marginBottom: 'var(--space-6)',
              background: 'radial-gradient(circle at 30% 30%, var(--bio-primary-400), var(--bio-neural-500) 70%, var(--bio-spark-600))',
              boxShadow:
                '0 0 80px color-mix(in srgb, var(--bio-primary-500) 40%, transparent), inset 0 0 40px rgba(255,255,255,0.15), inset 0 -10px 30px rgba(0,0,0,0.3)',
            }}
            aria-hidden="true"
          />
          <div className="type-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Choose a data source</div>
          <h2 className="font-display" style={{ fontSize: 'var(--t-3xl)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            Load data to begin analysis
          </h2>
          <p className="type-body-large" style={{ maxWidth: '520px', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
            Pick <span style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' as unknown as number }}>FinalSpark</span> for real organoid data (2.6M spikes, 32ch MEA, 118h),
            or a synthetic dataset for testing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full" style={{ maxWidth: '640px' }}>
            {[
              { title: 'FinalSpark', desc: 'Real organoid MEA. 4 organoids · 5 days · 437 Hz.', tone: 'primary' as const, badge: '2.6M spikes' },
              { title: 'Synthetic',  desc: 'Generated spike data with configurable burst probability.', tone: 'spark' as const,   badge: '30s · 120s' },
              { title: 'Upload',     desc: 'Your own CSV, HDF5, or NWB file. Any MEA system.', tone: 'neural' as const,  badge: 'Any format' },
            ].map((c, i) => (
              <Panel key={c.title} radius="xl" elevation={2} padding="md" className={`anim-fade-in-up anim-delay-${i + 1} text-left`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div className="type-title-3" style={{ fontSize: 'var(--t-base)' }}>{c.title}</div>
                  <Badge tone={c.tone} size="sm" variant="glass">{c.badge}</Badge>
                </div>
                <div className="type-caption" style={{ color: 'var(--text-tertiary)', lineHeight: 1.45 }}>{c.desc}</div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Background analysis progress — cached === undefined means "still loading".
  const bgSteps = [
    { label: 'Summary', done: summary != null },
    { label: 'Health', done: cached.health !== undefined },
    { label: 'NCI Score', done: cached.iq !== undefined },
    { label: 'Bursts', done: burstInfo != null },
  ];
  const bgDone = bgSteps.filter((s) => s.done).length;
  const bgTotal = bgSteps.length;
  const bgLoading = status === 'ready' && datasetId && bgDone < bgTotal;

  return (
    <div className="p-3 sm:p-4">
      {/* Background analysis progress banner — glass floating toolbar */}
      {bgLoading && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3 flex-wrap"
          style={{
            background: 'var(--glass-ultra-thin)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px var(--edge-outline)',
          }}
        >
          <Badge tone="spark" variant="glass" dot pulsing size="sm">
            {bgDone}/{bgTotal}
          </Badge>
          <span className="tabular" style={{ fontSize: 'var(--t-sm)', fontWeight: 'var(--tw-medium)', color: 'var(--text-primary)' }}>
            Running analysis
          </span>
          <div className="flex-1 min-w-[120px] h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-thick)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--bio-primary-500), var(--bio-spark-600), var(--bio-neural-500))' }}
              initial={{ width: 0 }}
              animate={{ width: `${(bgDone / bgTotal) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex gap-2" style={{ fontSize: 'var(--t-xs)', color: 'var(--text-tertiary)' }}>
            {bgSteps.map((s, i) => (
              <span key={i} style={{ color: s.done ? 'var(--bio-success-500)' : 'var(--text-tertiary)', fontWeight: s.done ? 'var(--tw-semibold)' as unknown as number : undefined }}>
                {s.done ? '✓' : '○'} {s.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Hero: NCI radial gauge + side stats */}
      {status === 'ready' && datasetId && <NCIHero />}

      {/* Tab navigation — iOS-style segmented control */}
      {status === 'ready' && datasetId && (
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <Segmented<Tab>
            options={[
              { value: 'visualizations', label: <>Visualizations <span style={{ opacity: 0.55, marginLeft: 4, fontSize: '10px' }}>6</span></> },
              { value: 'advanced',       label: <>Advanced <span style={{ opacity: 0.55, marginLeft: 4, fontSize: '10px' }}>12</span></> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
            accent="primary"
            label="Dashboard view"
          />
          <Button
            variant="glass"
            size="sm"
            accent="neutral"
            loading={reportLoading}
            onClick={downloadFullReport}
            style={{ marginLeft: 'auto' }}
          >
            {reportLoading ? 'Generating…' : 'Full Report JSON'}
          </Button>
        </div>
      )}

      {/* Loading — glass card with progress stages */}
      {status === 'loading' && spikes.length === 0 && (
        <div className="flex items-center justify-center py-16 sm:py-24">
          <Panel radius="2xl" elevation={3} padding="lg" className="anim-spring-in" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="flex flex-col items-center text-center">
              {/* Spinner ring with bio colors */}
              <div
                className="anim-spin-slow"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background:
                    'conic-gradient(from 0deg, var(--bio-primary-500), var(--bio-spark-600), var(--bio-neural-500), var(--bio-primary-500))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
                  marginBottom: 'var(--space-5)',
                }}
                aria-hidden="true"
              />
              <p className="type-title-3" style={{ marginBottom: 'var(--space-4)' }}>
                {loadingStep || 'Preparing…'}
              </p>
              <div className="text-left space-y-2" style={{ alignSelf: 'stretch', fontSize: 'var(--t-sm)' }}>
                {[
                  { label: 'Parse data file', done: loadingStep?.includes('spike data') || loadingStep === '' },
                  { label: 'Load spike events', done: loadingStep === '', active: loadingStep?.includes('spike data') },
                  { label: 'Run background analysis', done: false, active: loadingStep === '' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="shrink-0"
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: s.done
                          ? 'var(--bio-success-500)'
                          : s.active
                            ? 'color-mix(in srgb, var(--bio-spark-600) 28%, transparent)'
                            : 'var(--glass-regular)',
                        boxShadow: s.active ? '0 0 12px color-mix(in srgb, var(--bio-spark-600) 40%, transparent)' : undefined,
                      }}
                    >
                      {s.done && <span style={{ fontSize: '11px', color: '#0a0c14', fontWeight: 700 }}>✓</span>}
                      {s.active && (
                        <div
                          className="anim-spin-slow"
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            border: '1.5px solid color-mix(in srgb, var(--bio-spark-600) 60%, transparent)',
                            borderTopColor: 'var(--bio-spark-600)',
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        color: s.done ? 'var(--text-tertiary)' : s.active ? 'var(--text-primary)' : 'var(--text-quaternary)',
                        fontWeight: s.active
                          ? ('var(--tw-medium)' as unknown as number)
                          : ('var(--tw-normal)' as unknown as number),
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="type-caption" style={{ marginTop: 'var(--space-5)', color: 'var(--text-quaternary)' }}>
                First load of FinalSpark takes ~10s (parsing 129MB CSV). Subsequent loads are cached.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {/* No spikes but ready — auto-retry loading spikes */}
      {status === 'ready' && datasetId && spikes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="anim-spin-slow"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, var(--bio-primary-500), var(--bio-spark-600), var(--bio-neural-500), var(--bio-primary-500))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
            }}
            aria-hidden="true"
          />
          <div className="type-caption">Loading visualizations…</div>
        </div>
      )}

      {/* Content grid */}
      {spikes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {/* Advanced Analysis tab — `key` re-mounts on dataset change, which
              naturally resets internal state (visible count) without an effect. */}
          {activeTab === 'advanced' && datasetId && (
            <div className="col-span-full">
              <AdvancedAnalysis key={datasetId} datasetId={datasetId} />
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
                if (i >= chartsReady) return null; // staggered rendering
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-[12px]">
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
                    <div style={{ color: 'var(--text-secondary)' }}>ID: <span className="font-mono text-[11px] break-all" style={{ color: 'var(--text-muted)' }}>{datasetId}</span></div>
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

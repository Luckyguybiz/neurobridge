'use client';

import { useState } from 'react';
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

type Tab = 'visualizations' | 'advanced' | 'summary';

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.05 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function DashboardPage() {
  const { datasetId, spikes, duration, nElectrodes, summary, burstInfo, status } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<Tab>('visualizations');

  const pop     = summary?.population as Record<string, unknown> | undefined;
  const dataset = summary?.dataset    as Record<string, unknown> | undefined;

  return (
    <div className="p-3 sm:p-4">
      {/* Tab navigation */}
      {status === 'ready' && datasetId && (
        <div className="flex gap-1 mb-3">
          {([
            { key: 'visualizations' as Tab, label: 'Visualizations', count: 6 },
            { key: 'advanced'       as Tab, label: 'Advanced', count: 12 },
            { key: 'summary'        as Tab, label: 'Summary', count: undefined },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-[11px] px-3 py-1.5 rounded-lg transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400/90'
                  : 'bg-white/[0.02] border border-white/[0.04] text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
              {tab.count && <span className="ml-1 text-[9px] opacity-50">{tab.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && spikes.length === 0 && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[13px] text-white/30">Generating and analyzing neural data...</p>
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
                { title: 'Raster Plot',          desc: `${spikes.length.toLocaleString()} spikes · ${nElectrodes} electrodes`, span: 'lg:col-span-2 xl:col-span-2' },
                { title: 'Network Connectivity', desc: 'Co-firing functional connections',                                      span: '' },
                { title: 'Firing Rate Heatmap',  desc: 'Spike frequency over time per electrode',                              span: 'lg:col-span-2' },
                { title: 'Spike Waveforms',      desc: 'Overlaid spike shapes per electrode',                                  span: '' },
                { title: 'ISI Distribution',     desc: 'Inter-spike interval histogram (log scale)',                           span: '' },
                { title: 'Cross-Correlogram',    desc: 'Temporal correlation between electrode pairs',                         span: '' },
              ]).map((card, i) => (
                <motion.div key={card.title} custom={i} initial="hidden" animate="visible" variants={cardVariants} className={card.span}>
                  <ChartCard title={card.title} description={card.desc}>
                    {i === 0 && <RasterPlot       spikes={spikes} duration={duration}    electrodes={nElectrodes} />}
                    {i === 1 && <ConnectivityGraph spikes={spikes}                        electrodes={nElectrodes} />}
                    {i === 2 && <FiringRateHeatmap spikes={spikes} duration={duration}    electrodes={nElectrodes} />}
                    {i === 3 && <SpikeWaveforms    spikes={spikes}                        electrodes={nElectrodes} />}
                    {i === 4 && <ISIHistogram      spikes={spikes}                        electrodes={nElectrodes} />}
                    {i === 5 && <CrossCorrelogram  spikes={spikes}                        electrodes={nElectrodes} />}
                  </ChartCard>
                </motion.div>
              ))}
            </>
          )}

          {/* Summary (shown in both visualizations + summary tabs) */}
          {(activeTab === 'visualizations' || activeTab === 'summary') && summary && burstInfo && (
            <motion.div custom={6} initial="hidden" animate="visible" variants={cardVariants} className="xl:col-span-3 lg:col-span-2">
              <ChartCard title="Analysis Summary" description={`Dataset ${datasetId} · NeuroBridge API`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                  <div>
                    <div className="text-white/25 mb-1.5">Population</div>
                    <div className="text-white/70">Mean rate: <span className="text-cyan-400">{String(pop?.mean_firing_rate_hz)} Hz</span></div>
                    <div className="text-white/70">Most active: <span className="text-cyan-400">E{String(pop?.most_active_electrode)}</span></div>
                    <div className="text-white/70">Mean amp: <span className="text-cyan-400">{(pop?.mean_amplitude_uv as number)?.toFixed(1)} µV</span></div>
                  </div>
                  <div>
                    <div className="text-white/25 mb-1.5">Bursts</div>
                    <div className="text-white/70">Detected: <span className="text-violet-400">{burstInfo.n_bursts}</span></div>
                    <div className="text-white/70">Rate: <span className="text-violet-400">{burstInfo.burst_rate_per_min.toFixed(1)}/min</span></div>
                    <div className="text-white/70">Mean dur: <span className="text-violet-400">{burstInfo.mean_duration_ms.toFixed(0)} ms</span></div>
                  </div>
                  <div>
                    <div className="text-white/25 mb-1.5">Dataset</div>
                    <div className="text-white/70">ID: <span className="text-white/50 font-mono text-[11px]">{datasetId}</span></div>
                    <div className="text-white/70">Electrodes: <span className="text-white/50">{nElectrodes}</span></div>
                    <div className="text-white/70">Duration: <span className="text-white/50">{duration.toFixed(1)}s</span></div>
                  </div>
                  <div>
                    <div className="text-white/25 mb-1.5">API</div>
                    <div className="text-white/70">
                      <a href={api.getSwaggerUrl()} target="_blank" rel="noopener" className="text-cyan-400/60 hover:text-cyan-400 underline">Swagger UI</a>
                    </div>
                    {datasetId && (
                      <div className="text-white/70">
                        <a href={api.getExportCSVUrl(datasetId)} className="text-cyan-400/60 hover:text-cyan-400 underline">Download CSV</a>
                      </div>
                    )}
                    <div className="text-white/70">Duration: <span className="text-white/50">{(dataset?.duration_s as number)?.toFixed(1)}s</span></div>
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

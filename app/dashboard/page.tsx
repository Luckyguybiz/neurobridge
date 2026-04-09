'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { generateSyntheticData } from '@/lib/synthetic-data';
import ChartCard from '@/components/dashboard/ChartCard';
import RasterPlot from '@/components/dashboard/RasterPlot';
import FiringRateHeatmap from '@/components/dashboard/FiringRateHeatmap';
import SpikeWaveforms from '@/components/dashboard/SpikeWaveforms';
import ISIHistogram from '@/components/dashboard/ISIHistogram';
import CrossCorrelogram from '@/components/dashboard/CrossCorrelogram';
import ConnectivityGraph from '@/components/dashboard/ConnectivityGraph';

export default function DashboardPage() {
  const data = useMemo(() => generateSyntheticData(30, 8), []);

  return (
    <div className="min-h-screen bg-[#07080a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-xs font-bold text-black">N</div>
          <span className="font-semibold text-sm tracking-tight">NeuroBridge</span>
        </Link>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>Organoid: <span className="text-white/70">{data.id}</span></span>
          <span>Age: <span className="text-white/70">{data.metadata.organoidAge}d</span></span>
          <span>MEA: <span className="text-white/70">#{data.metadata.meaId}</span></span>
          <span>Spikes: <span className="text-white/70">{data.spikes.length.toLocaleString()}</span></span>
          <span>{data.metadata.temperature.toFixed(1)}°C</span>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        <ChartCard title="Raster Plot" description="Spike times across all electrodes" className="lg:col-span-2 xl:col-span-2">
          <RasterPlot spikes={data.spikes} duration={data.duration} electrodes={data.electrodes} />
        </ChartCard>

        <ChartCard title="Connectivity Graph" description="Functional connections between electrodes">
          <ConnectivityGraph spikes={data.spikes} electrodes={data.electrodes} />
        </ChartCard>

        <ChartCard title="Firing Rate Heatmap" description="Spike frequency over time per electrode" className="lg:col-span-2">
          <FiringRateHeatmap spikes={data.spikes} duration={data.duration} electrodes={data.electrodes} />
        </ChartCard>

        <ChartCard title="Spike Waveforms" description="Overlaid spike shapes per electrode">
          <SpikeWaveforms spikes={data.spikes} electrodes={data.electrodes} />
        </ChartCard>

        <ChartCard title="ISI Histogram" description="Inter-spike interval distribution (log scale)">
          <ISIHistogram spikes={data.spikes} electrodes={data.electrodes} />
        </ChartCard>

        <ChartCard title="Cross-Correlogram" description="Temporal correlation between electrode pairs">
          <CrossCorrelogram spikes={data.spikes} electrodes={data.electrodes} />
        </ChartCard>
      </main>
    </div>
  );
}

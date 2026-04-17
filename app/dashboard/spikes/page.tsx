'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import { useCachedAnalysis } from '@/lib/use-cached-analysis';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';
import RasterPlot from '@/components/dashboard/RasterPlot';
import SpikeWaveforms from '@/components/dashboard/SpikeWaveforms';
import ISIHistogram from '@/components/dashboard/ISIHistogram';
import { ELECTRODE_COLORS, getThemeColors } from '@/lib/utils';
import type { Spike } from '@/lib/types';

// ─── Firing Rate Timeline ─────────────────────────────────────────────────────

function FiringRateTimeline({ data }: { data: { bins: number[]; rates: Record<string, number[]> } | null }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const tc = getThemeColors();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 12, right: 20, bottom: 30, left: 48 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxBin = data.bins[data.bins.length - 1] ?? 30;
    const allRates = Object.values(data.rates).flat();
    const maxRate = d3.max(allRates) ?? 1;

    const x = d3.scaleLinear().domain([0, maxBin]).range([0, w]);
    const y = d3.scaleLinear().domain([0, maxRate * 1.1]).range([h, 0]);

    // Grid lines
    g.selectAll('.ygrid')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
      .attr('stroke', tc.grid);

    // Area + line per electrode
    const area = d3.area<number>()
      .x((_, i) => x(data.bins[i] ?? i))
      .y0(h)
      .y1((d) => y(d))
      .curve(d3.curveCatmullRom);

    const line = d3.line<number>()
      .x((_, i) => x(data.bins[i] ?? i))
      .y((d) => y(d))
      .curve(d3.curveCatmullRom);

    Object.entries(data.rates).forEach(([elId, rates], idx) => {
      const color = ELECTRODE_COLORS[Number(elId) % ELECTRODE_COLORS.length];

      g.append('path')
        .datum(rates)
        .attr('d', area)
        .attr('fill', color)
        .attr('opacity', 0.04);

      g.append('path')
        .datum(rates)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);
    });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat((d) => `${d}s`))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d} Hz`))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));

    // Y-axis label
    svg.append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(height / 2))
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('fill', tc.textFaint)
      .style('font-size', '10px')
      .text('Firing Rate (Hz)');

    // Legend
    const legendEntries = Object.keys(data.rates).slice(0, 8);
    const legendG = svg.append('g').attr('transform', `translate(${margin.left + w - 10},${margin.top + 4})`);
    legendEntries.forEach((elId, idx) => {
      const color = ELECTRODE_COLORS[Number(elId) % ELECTRODE_COLORS.length];
      legendG.append('line')
        .attr('x1', 0).attr('x2', 14)
        .attr('y1', idx * 14 + 6).attr('y2', idx * 14 + 6)
        .attr('stroke', color).attr('stroke-width', 2);
      legendG.append('text')
        .attr('x', 18).attr('y', idx * 14 + 10)
        .attr('fill', tc.textSecondary)
        .style('font-size', '9px')
        .text(`E${elId}`);
    });
  }, [data]);

  if (!data) return null;
  return <svg ref={svgRef} className="w-full h-52" />;
}

// ─── Amplitude Distribution ────────────────────────────────────────────────────

function AmplitudeHistogram({ spikes }: { spikes: Spike[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const tc = getThemeColors();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 12, right: 15, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const amplitudes = spikes.map((s) => s.amplitude);
    const [amin, amax] = [d3.min(amplitudes) ?? -200, d3.max(amplitudes) ?? 0];

    const x = d3.scaleLinear().domain([amin, amax]).range([0, w]);
    const bins = d3.bin()
      .domain([amin, amax] as [number, number])
      .thresholds(40)(amplitudes);

    const maxCount = d3.max(bins, (b) => b.length) ?? 1;
    const y = d3.scaleLinear().domain([0, maxCount]).range([h, 0]);

    // Gradient fill
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'ampGrad').attr('x1', '0').attr('x2', '1');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee').attr('stop-opacity', 0.8);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa').attr('stop-opacity', 0.8);

    g.selectAll('.bar')
      .data(bins)
      .join('rect')
      .attr('x', (d) => x(d.x0 ?? amin))
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(0, x(d.x1 ?? amax) - x(d.x0 ?? amin) - 1))
      .attr('height', (d) => h - y(d.length))
      .attr('fill', 'url(#ampGrad)')
      .attr('rx', 2);

    // Mean line
    const meanAmp = d3.mean(amplitudes) ?? 0;
    g.append('line')
      .attr('x1', x(meanAmp)).attr('x2', x(meanAmp))
      .attr('y1', 0).attr('y2', h)
      .attr('stroke', tc.textSecondary)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', 1);
    g.append('text')
      .attr('x', x(meanAmp) + 4).attr('y', 14)
      .attr('fill', tc.textSecondary)
      .style('font-size', '9px')
      .text(`μ=${meanAmp.toFixed(0)}µV`);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}µV`))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));
  }, [spikes]);

  return <svg ref={svgRef} className="w-full h-48" />;
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <span className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[18px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpikesPage() {
  const { datasetId, spikes, duration, nElectrodes, status } = useDashboardContext();
  const [selectedElectrode, setSelectedElectrode] = useState<number | null>(null);

  // Cached analysis — persists across page navigation
  const firing = useCachedAnalysis<{ bins: number[]; rates: Record<string, number[]> }>(
    datasetId, 'firing-rates', () => api.getFiringRates(datasetId!, 1),
  );
  const pca = useCachedAnalysis(datasetId, 'pca', () => api.getPCA(datasetId!));
  const states = useCachedAnalysis(datasetId, 'states', () => api.getStates(datasetId!));

  const filteredSpikes = selectedElectrode !== null
    ? spikes.filter(s => s.electrode === selectedElectrode)
    : spikes;

  const hasWaveforms = spikes.some((s) => s.waveform.length > 0);

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading spike data...</p>
        </div>
      </div>
    );
  }

  if (spikes.length === 0) return null;

  // Quick stats
  const totalSpikes = spikes.length;
  const uniqueElectrodes = new Set(spikes.map((s) => s.electrode)).size;
  const meanAmp = spikes.reduce((sum, s) => sum + s.amplitude, 0) / spikes.length;
  const meanRate = (totalSpikes / uniqueElectrodes / duration).toFixed(1);

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        <StatChip label={selectedElectrode !== null ? `E${selectedElectrode} Spikes` : "Total Spikes"} value={filteredSpikes.length.toLocaleString()} />
        <StatChip label="Electrodes"     value={`${uniqueElectrodes}`} />
        <StatChip label="Mean Rate"      value={`${meanRate} Hz`} />
        <StatChip label="Mean Amplitude" value={`${meanAmp.toFixed(0)} µV`} />
      </motion.div>

      {/* Electrode selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>Filter:</span>
        <button
          onClick={() => setSelectedElectrode(null)}
          className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
            selectedElectrode === null
              ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400'
              : 'bg-white/[0.03] border border-white/[0.04] hover:opacity-80'
          }`}
          style={selectedElectrode === null ? undefined : { color: 'var(--text-muted)' }}
        >
          All
        </button>
        {Array.from({ length: nElectrodes }, (_, i) => (
          <button
            key={i}
            onClick={() => setSelectedElectrode(selectedElectrode === i ? null : i)}
            className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
              selectedElectrode === i
                ? 'border'
                : 'bg-white/[0.03] border border-white/[0.04] hover:opacity-80'
            }`}
            style={selectedElectrode === i ? {
              backgroundColor: `${ELECTRODE_COLORS[i % ELECTRODE_COLORS.length]}20`,
              borderColor: `${ELECTRODE_COLORS[i % ELECTRODE_COLORS.length]}40`,
              color: ELECTRODE_COLORS[i % ELECTRODE_COLORS.length],
            } : undefined}
          >
            E{i}
          </button>
        ))}
      </div>

      {/* Raster plot — full width, tall */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <ChartCard title="Raster Plot" description={`${filteredSpikes.length.toLocaleString()} spikes${selectedElectrode !== null ? ` · E${selectedElectrode}` : ` across ${nElectrodes} electrodes`} · ${duration.toFixed(1)}s`}>
          <div className="w-full" style={{ height: 320 }}>
            <RasterPlotTall spikes={filteredSpikes} duration={duration} electrodes={nElectrodes} />
          </div>
        </ChartCard>
      </motion.div>

      {/* Firing rate timeline — full width */}
      {datasetId && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ChartCard title="Firing Rate Timeline" description="Per-electrode firing rate (1s bins)" loading={firing.loading} error={firing.error}>
            <FiringRateTimeline data={firing.data} />
          </ChartCard>
        </motion.div>
      )}

      {/* Bottom row: Amplitude dist + ISI + Waveforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <ChartCard title="Amplitude Distribution" description={selectedElectrode !== null ? `E${selectedElectrode} amplitudes` : "All electrode amplitudes"}>
            <AmplitudeHistogram spikes={filteredSpikes} />
          </ChartCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <ChartCard title="ISI Distribution" description={selectedElectrode !== null ? `E${selectedElectrode} ISI` : "All electrodes ISI"}>
            <ISIHistogram spikes={filteredSpikes} electrodes={nElectrodes} />
          </ChartCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="md:col-span-2 xl:col-span-1">
          <ChartCard
            title="Spike Waveforms"
            description={hasWaveforms ? 'Overlaid spike shapes per electrode' : 'Waveforms not available for API-generated data'}
          >
            {hasWaveforms
              ? <SpikeWaveforms spikes={spikes} electrodes={nElectrodes} />
              : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                    Waveform data requires recording files with raw traces.<br />
                    Synthetic data via the API does not include waveforms.
                  </div>
                </div>
              )
            }
          </ChartCard>
        </motion.div>
      </div>

      {/* PCA + State Classification row */}
      {datasetId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <ChartCard title="PCA Embedding" description="Neural state space — 2D projection of activity windows" loading={pca.loading} error={pca.error}>
              <PCAScatter data={pca.data} />
            </ChartCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <ChartCard title="State Classification" description="Automatic classification: resting / active / bursting" loading={states.loading} error={states.error}>
              <StateClassification data={states.data} />
            </ChartCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── PCA Scatter ─────────────────────────────────────────────────────────────

function PCAScatter({ data }: { data: Record<string, unknown> | null }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const tc = getThemeColors();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const embRaw = data.embedding ?? data.components ?? data.points ?? [];
    const embedding = Array.isArray(embRaw) ? embRaw as number[][] : [];
    const labRaw = data.labels ?? data.cluster_labels ?? [];
    const labels = Array.isArray(labRaw) ? labRaw.map(Number) : [];
    const expRaw = data.explained_variance ?? data.explained_variance_ratio ?? data.variance_explained ?? [];
    const explained = Array.isArray(expRaw) ? expRaw.map(Number) : [];

    if (embedding.length < 2) return;

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = 220;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xs = embedding.map(p => p[0] ?? 0);
    const ys = embedding.map(p => p[1] ?? 0);
    const x = d3.scaleLinear().domain([Math.min(...xs), Math.max(...xs)]).range([0, w]).nice();
    const y = d3.scaleLinear().domain([Math.min(...ys), Math.max(...ys)]).range([h, 0]).nice();

    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5))
      .call(ax => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '9px'))
      .call(ax => ax.selectAll('line,path').attr('stroke', tc.axis));

    g.append('g').call(d3.axisLeft(y).ticks(5))
      .call(ax => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '9px'))
      .call(ax => ax.selectAll('line,path').attr('stroke', tc.axis));

    const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#818cf8'];

    embedding.forEach((point, i) => {
      const label = labels[i] ?? 0;
      g.append('circle')
        .attr('cx', x(point[0] ?? 0))
        .attr('cy', y(point[1] ?? 0))
        .attr('r', 3)
        .attr('fill', colors[label % colors.length])
        .attr('opacity', 0.7);
    });

    // Axis labels
    if (explained.length >= 2) {
      g.append('text').attr('x', w / 2).attr('y', h + 25).attr('text-anchor', 'middle')
        .attr('fill', tc.textMuted).style('font-size', '9px')
        .text(`PC1 (${(Number(explained[0]) * 100).toFixed(0)}%)`);
      g.append('text').attr('x', -h / 2).attr('y', -30).attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('fill', tc.textMuted).style('font-size', '9px')
        .text(`PC2 (${(Number(explained[1]) * 100).toFixed(0)}%)`);
    }
  }, [data]);

  if (!data) return null;
  return <svg ref={svgRef} className="w-full" style={{ height: 220 }} />;
}

// ─── State Classification ────────────────────────────────────────────────────

function StateClassification({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  // Handle both array labels and dict states format
  const rawLabels = data.labels ?? data.state_labels ?? data.timeline;
  const rawStates = data.states;
  const stateColors = ['#818cf8', '#22d3ee', '#f87171', '#fbbf24', '#34d399'];

  let counts: Record<string, number> = {};
  let total = 1;

  if (Array.isArray(rawLabels)) {
    // Old format: array of state indices or objects
    for (const l of rawLabels) {
      const k = typeof l === 'object' && l !== null
        ? String((l as Record<string, unknown>).state ?? (l as Record<string, unknown>).name ?? (l as Record<string, unknown>).label ?? JSON.stringify(l))
        : String(l);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    total = rawLabels.length || 1;
  } else if (rawStates && typeof rawStates === 'object' && !Array.isArray(rawStates)) {
    // New format: { resting: {windows, fraction}, low_activity: {...} }
    const stateEntries = rawStates as Record<string, Record<string, unknown>>;
    for (const [name, info] of Object.entries(stateEntries)) {
      counts[name] = Number(info?.n_windows ?? info?.count ?? info?.windows ?? 0);
      total += counts[name];
    }
    if (total === 0) total = 1;
  }

  return (
    <div className="space-y-3">
      {Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1])).map(([state, count], idx) => {
        const pct = (count / total * 100).toFixed(1);
        const displayName = isNaN(Number(state)) ? state.replace(/_/g, ' ') : ['Resting', 'Active', 'Bursting'][Number(state)] ?? `State ${state}`;
        return (
          <div key={state} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span style={{ color: 'var(--text-muted)' }} className="capitalize">{displayName}</span>
              <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{pct}% ({count} windows)</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--chart-grid)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: stateColors[idx] ?? '#666' }}
              />
            </div>
          </div>
        );
      })}
      <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>{total} time windows classified</div>
    </div>
  );
}

// Wrapper to use full height for raster plot
function RasterPlotTall({ spikes, duration, electrodes }: { spikes: Spike[]; duration: number; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const tc = getThemeColors();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, duration]).range([0, w]);
    const y = d3.scaleBand<number>().domain(d3.range(electrodes)).range([0, h]).padding(0.25);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat((d) => `${d}s`))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat((d) => `E${d}`))
      .call((ax) => ax.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((ax) => ax.selectAll('line,path').attr('stroke', tc.axis));

    g.selectAll('.grid')
      .data(d3.range(electrodes))
      .join('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('y2', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('stroke', tc.grid);

    const subset = spikes.length > 12000
      ? spikes.filter((_, i) => i % Math.ceil(spikes.length / 12000) === 0)
      : spikes;

    g.selectAll('.spike')
      .data(subset)
      .join('circle')
      .attr('cx', (d) => x(d.time))
      .attr('cy', (d) => (y(d.electrode) ?? 0) + y.bandwidth() / 2)
      .attr('r', 1.8)
      .attr('fill', (d) => ELECTRODE_COLORS[d.electrode % ELECTRODE_COLORS.length])
      .attr('opacity', 0.75);
  }, [spikes, duration, electrodes]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { useDashboardContext } from '@/lib/dashboard-context';
import * as api from '@/lib/api';
import ChartCard from '@/components/dashboard/ChartCard';
import ConnectivityGraph from '@/components/dashboard/ConnectivityGraph';
import { ELECTRODE_COLORS } from '@/lib/utils';

// ─── Transfer Entropy Matrix ──────────────────────────────────────────────────

type TEData = {
  te_matrix: number[][];
  electrode_ids: number[];
  max_te_pair: { source: number; target: number; value: number };
  mean_te: number;
};

function TEMatrix({ data }: { data: TEData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.te_matrix.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const n = data.electrode_ids.length;
    const rect = svgRef.current.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const margin = { top: 30, right: 20, bottom: 20, left: 30 };
    const w = size - margin.left - margin.right;
    const cellSize = w / n;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const allVals = data.te_matrix.flat();
    const maxVal = d3.max(allVals) ?? 1;
    const color = d3.scaleSequential(d3.interpolatePlasma).domain([0, maxVal]);

    // Cells
    data.te_matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        g.append('rect')
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('fill', i === j ? 'rgba(255,255,255,0.03)' : color(val))
          .attr('rx', 2);

        if (cellSize > 20 && i !== j) {
          g.append('text')
            .attr('x', j * cellSize + cellSize / 2)
            .attr('y', i * cellSize + cellSize / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', val > maxVal * 0.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.5)')
            .style('font-size', '8px')
            .text(val.toFixed(3));
        }
      });
    });

    // Row/col labels
    data.electrode_ids.forEach((id, i) => {
      g.append('text')
        .attr('x', i * cellSize + cellSize / 2)
        .attr('y', -6)
        .attr('text-anchor', 'middle')
        .attr('fill', ELECTRODE_COLORS[id % ELECTRODE_COLORS.length])
        .style('font-size', '9px')
        .text(`E${id}`);

      g.append('text')
        .attr('x', -4)
        .attr('y', i * cellSize + cellSize / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', ELECTRODE_COLORS[id % ELECTRODE_COLORS.length])
        .style('font-size', '9px')
        .text(`E${id}`);
    });

    // Highlight max TE pair
    const { source: s, target: t } = data.max_te_pair;
    const si = data.electrode_ids.indexOf(s);
    const ti = data.electrode_ids.indexOf(t);
    if (si >= 0 && ti >= 0) {
      g.append('rect')
        .attr('x', ti * cellSize)
        .attr('y', si * cellSize)
        .attr('width', cellSize - 1)
        .attr('height', cellSize - 1)
        .attr('fill', 'none')
        .attr('stroke', '#22d3ee')
        .attr('stroke-width', 2)
        .attr('rx', 2);
    }
  }, [data]);

  return (
    <div>
      <div className="flex gap-4 mb-3 text-[11px]">
        <div>
          <span className="text-white/30">Max TE: </span>
          <span className="text-cyan-400">E{data.max_te_pair.source} → E{data.max_te_pair.target}</span>
          <span className="text-white/40 ml-1">({data.max_te_pair.value.toFixed(4)} bits)</span>
        </div>
        <div>
          <span className="text-white/30">Mean TE: </span>
          <span className="text-violet-400">{data.mean_te.toFixed(4)}</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full" style={{ height: 220 }} />
    </div>
  );
}

// ─── Cross-Correlation Heatmap (pairwise) ─────────────────────────────────────

function CrossCorrHeatmap({ datasetId, nElectrodes }: { datasetId: string; nElectrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCrossCorrelation(datasetId, 50, 1)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [datasetId]);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Try to find a correlation matrix in the response
    const corrMatrix = (data.correlation_matrix ?? data.cross_correlation_matrix ?? null) as number[][] | null;
    if (!corrMatrix || !Array.isArray(corrMatrix)) {
      // Fall back to rendering raw JSON summary
      d3.select(svgRef.current.parentElement)
        .select('.fallback-json')
        .style('display', 'block');
      return;
    }

    const n = corrMatrix.length;
    const rect = svgRef.current.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const margin = { top: 28, right: 16, bottom: 16, left: 28 };
    const w = size - margin.left - margin.right;
    const cellSize = w / n;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxVal = d3.max(corrMatrix.flat().map(Math.abs)) ?? 1;
    const color = d3.scaleDiverging(d3.interpolateRdBu).domain([-maxVal, 0, maxVal]);

    corrMatrix.forEach((row, i) => {
      row.forEach((val, j) => {
        g.append('rect')
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('fill', color(val))
          .attr('rx', 2);
      });
    });

    // Labels
    Array.from({ length: n }, (_, i) => {
      g.append('text')
        .attr('x', i * cellSize + cellSize / 2).attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', ELECTRODE_COLORS[i % ELECTRODE_COLORS.length])
        .style('font-size', '9px').text(`E${i}`);
      g.append('text')
        .attr('x', -4).attr('y', i * cellSize + cellSize / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', ELECTRODE_COLORS[i % ELECTRODE_COLORS.length])
        .style('font-size', '9px').text(`E${i}`);
    });
  }, [data, nElectrodes]);

  if (error) return <div className="text-[11px] text-red-400/60 py-4">{error}</div>;
  if (!data) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" style={{ height: 220 }} />
      <div className="fallback-json hidden mt-2">
        <div className="text-[10px] text-white/30 mb-1">Cross-correlation data:</div>
        <div className="space-y-1 font-mono text-[10px]">
          {Object.entries(data).slice(0, 8).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-white/25">{k}:</span>
              <span className="text-cyan-400/60 truncate">
                {Array.isArray(v) ? `[${(v as unknown[]).length} items]` :
                 typeof v === 'object' && v !== null ? `{${Object.keys(v).length} keys}` :
                 String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Weights JSON ─────────────────────────────────────────────────────────────

function WeightsDisplay({ datasetId }: { datasetId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getWeights(datasetId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [datasetId]);

  if (error) return <div className="text-[11px] text-red-400/60">{error}</div>;
  if (!data) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );

  const entries = Object.entries(data).slice(0, 14);
  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 py-0.5 border-b border-white/[0.03]">
          <span className="text-white/30 shrink-0 w-28 truncate">{k}:</span>
          <span className="text-cyan-400/70 truncate">
            {typeof v === 'number'   ? (Number.isInteger(v) ? v : Number(v).toFixed(4)) :
             typeof v === 'boolean'  ? String(v) :
             typeof v === 'string'   ? v :
             Array.isArray(v)        ? `[${v.length} items]` :
             typeof v === 'object' && v !== null ? `{${Object.keys(v).length} keys}` :
             String(v)}
          </span>
        </div>
      ))}
      {Object.keys(data).length > 14 && (
        <div className="text-white/20 text-[10px]">+ {Object.keys(data).length - 14} more keys</div>
      )}
    </div>
  );
}

// ─── Network Stats ────────────────────────────────────────────────────────────

function NetworkStats({ datasetId }: { datasetId: string }) {
  const [data, setData] = useState<{
    nodes: Array<{ id: number; n_spikes: number; firing_rate_hz: number; degree: number; strength: number }>;
    edges: Array<{ source: number; target: number; weight: number }>;
    n_edges: number;
    density: number;
    mean_clustering: number;
  } | null>(null);

  useEffect(() => {
    api.getConnectivity(datasetId).then(setData).catch(() => {});
  }, [datasetId]);

  if (!data) return null;

  const stats = [
    { label: 'Edges',       value: String(data.n_edges) },
    { label: 'Density',     value: data.density.toFixed(3) },
    { label: 'Clustering',  value: data.mean_clustering.toFixed(3) },
    { label: 'Nodes',       value: String(data.nodes.length) },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {stats.map((s) => (
        <div key={s.label} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <div className="text-[9px] text-white/25 uppercase tracking-widest">{s.label}</div>
          <div className="text-[14px] font-medium text-white/70 tabular-nums">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { datasetId, spikes, nElectrodes, status } = useDashboardContext();
  const [teData, setTEData] = useState<TEData | null>(null);
  const [teError, setTEError] = useState('');

  useEffect(() => {
    if (!datasetId) return;
    api.getTransferEntropy(datasetId)
      .then((d) => setTEData(d as unknown as TEData))
      .catch((e) => setTEError(e instanceof Error ? e.message : 'Failed'));
  }, [datasetId]);

  if (status === 'loading' && spikes.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-white/30">Loading network data...</p>
        </div>
      </div>
    );
  }

  if (spikes.length === 0) return null;

  return (
    <div className="p-3 sm:p-4 space-y-3">
      {/* Large connectivity graph */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ChartCard title="Functional Connectivity Graph" description="Force-directed layout · nodes = electrodes · edges = co-firing strength">
          <div className="w-full" style={{ height: 400 }}>
            <LargeConnectivityGraph spikes={spikes} electrodes={nElectrodes} />
          </div>
          {datasetId && <NetworkStats datasetId={datasetId} />}
        </ChartCard>
      </motion.div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Cross-correlation heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="lg:col-span-1"
        >
          <ChartCard title="Cross-Correlation Matrix" description="Pairwise electrode correlation">
            {datasetId
              ? <CrossCorrHeatmap datasetId={datasetId} nElectrodes={nElectrodes} />
              : <div className="text-[11px] text-white/30 py-4">No dataset loaded</div>}
          </ChartCard>
        </motion.div>

        {/* Transfer entropy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="lg:col-span-1"
        >
          <ChartCard title="Transfer Entropy Matrix" description="Directed information flow between electrodes (bits)">
            {teError
              ? <div className="text-[11px] text-red-400/60 py-4">{teError}</div>
              : teData
                ? <TEMatrix data={teData} />
                : (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                  </div>
                )
            }
          </ChartCard>
        </motion.div>

        {/* Synaptic weights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="lg:col-span-1"
        >
          <ChartCard title="Synaptic Weights" description="Inferred connectome from spike timing">
            {datasetId
              ? <WeightsDisplay datasetId={datasetId} />
              : <div className="text-[11px] text-white/30 py-4">No dataset loaded</div>}
          </ChartCard>
        </motion.div>
      </div>

      {/* Network Motifs + Information Flow row */}
      {datasetId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <ChartCard title="Network Motifs" description="3-node subgraph patterns vs random networks">
              <MotifsCard datasetId={datasetId} />
            </ChartCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}>
            <ChartCard title="Information Flow (Granger)" description="Directed causal information flow between electrodes">
              <InfoFlowCard datasetId={datasetId} />
            </ChartCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Motifs Card ─────────────────────────────────────────────────────────────

function MotifsCard({ datasetId }: { datasetId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMotifs(datasetId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [datasetId]);

  if (error) return <div className="text-[11px] text-red-400/60 py-4">{error}</div>;
  if (!data) return <div className="flex items-center justify-center py-6"><div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /></div>;

  const counts = (data.motif_counts ?? {}) as Record<string, number>;
  const zScore = Number(data.triangle_z_score ?? 0);
  const enrichment = String(data.triangle_enrichment ?? 'unknown');

  const motifTypes = [
    { key: 'triangle', label: 'Triangle (recurrent)', color: 'bg-violet-500/40' },
    { key: 'chain', label: 'Chain (feed-forward)', color: 'bg-cyan-500/40' },
    { key: 'star', label: 'Star (hub)', color: 'bg-amber-500/40' },
    { key: 'disconnected', label: 'Disconnected', color: 'bg-white/10' },
  ];

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="space-y-3">
      {motifTypes.map((m) => {
        const count = counts[m.key] ?? 0;
        return (
          <div key={m.key} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">{m.label}</span>
              <span className="text-white/60 tabular-nums">{count}</span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${m.color}`}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-2 mt-2 text-[10px]">
        <span className="text-white/25">Triangle z-score:</span>
        <span className={`font-mono tabular-nums ${zScore > 2 ? 'text-emerald-400' : zScore < -2 ? 'text-red-400' : 'text-white/50'}`}>
          {zScore.toFixed(2)}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] ${
          enrichment === 'over-represented' ? 'bg-emerald-500/15 text-emerald-400' :
          enrichment === 'under-represented' ? 'bg-red-500/15 text-red-400' :
          'bg-white/[0.05] text-white/40'
        }`}>
          {enrichment}
        </span>
      </div>
    </div>
  );
}

// ─── Information Flow Card ───────────────────────────────────────────────────

function InfoFlowCard({ datasetId }: { datasetId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInformationFlow(datasetId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [datasetId]);

  if (error) return <div className="text-[11px] text-red-400/60 py-4">{error}</div>;
  if (!data) return <div className="flex items-center justify-center py-6"><div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /></div>;

  const hubElectrode = Number(data.hub_electrode ?? 0);
  const hubStrength = Number(data.hub_out_strength ?? 0);
  const meanGC = Number(data.mean_gc ?? 0);
  const asymmetry = Number(data.flow_asymmetry ?? 0);
  const topPairs = (data.top_pairs ?? []) as Array<{ source: number; target: number; gc_value: number }>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/10">
          <div className="text-[10px] text-white/30">Hub Electrode</div>
          <div className="text-lg font-bold text-cyan-400 tabular-nums">E{hubElectrode}</div>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="text-white/40">Outgoing strength: <span className="text-cyan-400/70 tabular-nums">{hubStrength.toFixed(3)}</span></div>
          <div className="text-white/40">Mean GC: <span className="text-white/60 tabular-nums">{meanGC.toFixed(4)}</span></div>
          <div className="text-white/40">Flow asymmetry: <span className="text-white/60 tabular-nums">{asymmetry.toFixed(4)}</span></div>
        </div>
      </div>

      {topPairs.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-white/25 mb-1">Top causal pairs</div>
          {topPairs.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
              <span className="text-cyan-400/60 tabular-nums w-6">E{p.source}</span>
              <span className="text-white/20">&rarr;</span>
              <span className="text-violet-400/60 tabular-nums w-6">E{p.target}</span>
              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 to-violet-500/40"
                  style={{ width: `${Math.min(100, (p.gc_value / Math.max(topPairs[0]?.gc_value ?? 1, 0.001)) * 100)}%` }}
                />
              </div>
              <span className="text-white/30 tabular-nums w-12 text-right">{p.gc_value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Large connectivity graph (taller version) ────────────────────────────────

import type { Spike } from '@/lib/types';

interface SimNode extends d3.SimulationNodeDatum { id: number; label: string }
interface SimLink extends d3.SimulationLinkDatum<SimNode> { strength: number }

function LargeConnectivityGraph({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width  = rect.width;
    const height = rect.height;

    const spikesByEl: number[][] = Array.from({ length: electrodes }, () => []);
    for (const s of spikes) spikesByEl[s.electrode]?.push(s.time);

    const links: SimLink[] = [];
    for (let i = 0; i < electrodes; i++) {
      for (let j = i + 1; j < electrodes; j++) {
        let count = 0, ai = 0, bi = 0;
        const a = spikesByEl[i], b = spikesByEl[j];
        while (ai < a.length && bi < b.length) {
          const diff = Math.abs(a[ai] - b[bi]);
          if (diff < 0.01) { count++; ai++; bi++; }
          else if (a[ai] < b[bi]) ai++; else bi++;
        }
        const strength = count / (Math.min(a.length, b.length) || 1);
        if (strength > 0.02) links.push({ source: i, target: j, strength });
      }
    }

    const nodes: SimNode[] = Array.from({ length: electrodes }, (_, i) => ({ id: i, label: `E${i}` }));
    const maxStr = d3.max(links, (l) => l.strength) ?? 1;
    const lWidth   = d3.scaleLinear().domain([0, maxStr]).range([0.5, 6]);
    const lOpacity = d3.scaleLinear().domain([0, maxStr]).range([0.08, 0.9]);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(120).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(35));

    const linkEls = svg.selectAll('.link')
      .data(links)
      .join('line')
      .attr('stroke', '#a78bfa')
      .attr('stroke-width', (d) => lWidth(d.strength))
      .attr('opacity', (d) => lOpacity(d.strength));

    const nodeEls = svg.selectAll<SVGGElement, SimNode>('.node')
      .data(nodes)
      .join('g');

    nodeEls.call(d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end',   (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    const colors = ELECTRODE_COLORS;

    // Glow ring
    nodeEls.append('circle')
      .attr('r', 26)
      .attr('fill', (d) => colors[d.id % colors.length])
      .attr('opacity', 0.06);

    nodeEls.append('circle')
      .attr('r', 20)
      .attr('fill', (d) => colors[d.id % colors.length])
      .attr('opacity', 0.14)
      .attr('stroke', (d) => colors[d.id % colors.length])
      .attr('stroke-width', 1.5);

    nodeEls.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'rgba(255,255,255,0.85)')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('pointer-events', 'none');

    // Degree label below
    const degreeMap: Record<number, number> = {};
    links.forEach((l) => {
      const s = (l.source as SimNode).id ?? (l.source as number);
      const t = (l.target as SimNode).id ?? (l.target as number);
      degreeMap[s] = (degreeMap[s] ?? 0) + 1;
      degreeMap[t] = (degreeMap[t] ?? 0) + 1;
    });
    nodeEls.append('text')
      .text((d) => `deg ${degreeMap[d.id] ?? 0}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '2.2em')
      .attr('fill', 'rgba(255,255,255,0.25)')
      .style('font-size', '8px')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      linkEls
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      nodeEls.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simulation.stop(); };
  }, [spikes, electrodes]);

  return <svg ref={svgRef} className="w-full h-full" />;
}

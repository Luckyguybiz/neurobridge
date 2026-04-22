'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max } from 'd3-array';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS, getThemeColors } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';

const MAX_LAG_MS = 50;
const BIN_WIDTH_MS = 1;
const NUM_BINS = (MAX_LAG_MS * 2) / BIN_WIDTH_MS;
const MAX_LAG_S = MAX_LAG_MS / 1000;

export default function CrossCorrelogram({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pairA, setPairA] = useState(0);
  const [pairB, setPairB] = useState(1);
  const { theme } = useTheme();

  // Index once: electrode → sorted times[]. Re-running .filter on every pair
  // change was ~32× wasted work. Indexing is O(N), pair lookup is O(1).
  const spikesByElectrode = useMemo(() => {
    const idx: number[][] = Array.from({ length: electrodes }, () => []);
    for (const s of spikes) {
      if (s.electrode >= 0 && s.electrode < electrodes) idx[s.electrode].push(s.time);
    }
    for (const arr of idx) arr.sort((a, b) => a - b);
    return idx;
  }, [spikes, electrodes]);

  // Sliding window cross-correlogram, O(|A| + |B|) per pair (was O(|A| × |B|),
  // i.e. up to 1M ops on main thread per pair-selector change → frozen UI).
  const counts = useMemo(() => {
    const A = spikesByElectrode[pairA] ?? [];
    const B = spikesByElectrode[pairB] ?? [];
    const c = new Array(NUM_BINS).fill(0);
    if (A.length === 0 || B.length === 0) return c;

    let jLo = 0;
    let jHi = 0;
    for (const tA of A) {
      const lo = tA - MAX_LAG_S;
      const hi = tA + MAX_LAG_S;
      while (jLo < B.length && B[jLo] < lo) jLo++;
      if (jHi < jLo) jHi = jLo;
      while (jHi < B.length && B[jHi] < hi) jHi++;
      for (let j = jLo; j < jHi; j++) {
        const lag = (B[j] - tA) * 1000;
        const bin = Math.floor((lag + MAX_LAG_MS) / BIN_WIDTH_MS);
        if (bin >= 0 && bin < NUM_BINS) c[bin]++;
      }
    }
    return c;
  }, [spikesByElectrode, pairA, pairB]);

  useEffect(() => {
    if (!svgRef.current) return;
    const tc = getThemeColors();
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 45 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = scaleLinear().domain([-MAX_LAG_MS, MAX_LAG_MS]).range([0, w]);
    const maxC = max(counts) ?? 1;
    const y = scaleLinear().domain([0, maxC]).range([h, 0]);
    const barW = w / NUM_BINS;

    g.selectAll('.bar')
      .data(counts)
      .join('rect')
      .attr('x', (_, i) => i * barW)
      .attr('y', (d) => y(d))
      .attr('width', barW - 0.5)
      .attr('height', (d) => h - y(d))
      .attr('fill', (_, i) => {
        const lag = i * BIN_WIDTH_MS - MAX_LAG_MS;
        return lag >= 0 ? ELECTRODE_COLORS[pairB % ELECTRODE_COLORS.length] : ELECTRODE_COLORS[pairA % ELECTRODE_COLORS.length];
      })
      .attr('opacity', 0.6);

    g.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', h).attr('stroke', tc.textMuted).attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(axisBottom(x).ticks(5).tickFormat((d) => `${d} ms`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.append('g')
      .call(axisLeft(y).ticks(4))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));
  }, [counts, pairA, pairB, theme]);

  return (
    <div>
      <div className="flex gap-2 mb-2 items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>Pair:</span>
        <select value={pairA} onChange={(e) => setPairA(+e.target.value)} className="rounded px-2 py-0.5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          {Array.from({ length: electrodes }, (_, i) => <option key={i} value={i}>E{i}</option>)}
        </select>
        <span>vs</span>
        <select value={pairB} onChange={(e) => setPairB(+e.target.value)} className="rounded px-2 py-0.5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          {Array.from({ length: electrodes }, (_, i) => <option key={i} value={i}>E{i}</option>)}
        </select>
      </div>
      <svg ref={svgRef} className="w-full h-44 sm:h-56" />
    </div>
  );
}

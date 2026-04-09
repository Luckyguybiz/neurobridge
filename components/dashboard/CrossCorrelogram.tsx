'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS } from '@/lib/utils';

export default function CrossCorrelogram({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pairA, setPairA] = useState(0);
  const [pairB, setPairB] = useState(1);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 45 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const spikesA = spikes.filter((s) => s.electrode === pairA).map((s) => s.time);
    const spikesB = spikes.filter((s) => s.electrode === pairB).map((s) => s.time);

    // Compute cross-correlogram (±50ms, 1ms bins)
    const maxLag = 50; // ms
    const binWidth = 1; // ms
    const numBins = (maxLag * 2) / binWidth;
    const counts = new Array(numBins).fill(0);

    for (const tA of spikesA) {
      for (const tB of spikesB) {
        const lag = (tB - tA) * 1000; // ms
        if (lag >= -maxLag && lag < maxLag) {
          const bin = Math.floor((lag + maxLag) / binWidth);
          counts[bin]++;
        }
      }
    }

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([-maxLag, maxLag]).range([0, w]);
    const maxC = d3.max(counts) ?? 1;
    const y = d3.scaleLinear().domain([0, maxC]).range([h, 0]);

    const barW = w / numBins;

    g.selectAll('.bar')
      .data(counts)
      .join('rect')
      .attr('x', (_, i) => i * barW)
      .attr('y', (d) => y(d))
      .attr('width', barW - 0.5)
      .attr('height', (d) => h - y(d))
      .attr('fill', (_, i) => {
        const lag = i * binWidth - maxLag;
        return lag >= 0 ? ELECTRODE_COLORS[pairB] : ELECTRODE_COLORS[pairA];
      })
      .attr('opacity', 0.6);

    // Zero line
    g.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', h).attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d} ms`))
      .call((g) => g.selectAll('text').attr('fill', 'rgba(255,255,255,0.5)').style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.15)'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((g) => g.selectAll('text').attr('fill', 'rgba(255,255,255,0.5)').style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.15)'));
  }, [spikes, pairA, pairB, electrodes]);

  return (
    <div>
      <div className="flex gap-2 mb-2 items-center text-xs text-white/50">
        <span>Pair:</span>
        <select value={pairA} onChange={(e) => setPairA(+e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80">
          {Array.from({ length: electrodes }, (_, i) => <option key={i} value={i}>E{i}</option>)}
        </select>
        <span>vs</span>
        <select value={pairB} onChange={(e) => setPairB(+e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80">
          {Array.from({ length: electrodes }, (_, i) => <option key={i} value={i}>E{i}</option>)}
        </select>
      </div>
      <svg ref={svgRef} className="w-full h-56" />
    </div>
  );
}

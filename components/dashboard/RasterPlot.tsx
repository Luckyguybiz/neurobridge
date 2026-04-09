'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS } from '@/lib/utils';

export default function RasterPlot({ spikes, duration, electrodes }: { spikes: Spike[]; duration: number; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
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
    const y = d3.scaleBand<number>().domain(d3.range(electrodes)).range([0, h]).padding(0.3);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}s`))
      .call((g) => g.selectAll('text').attr('fill', 'rgba(255,255,255,0.5)').style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.15)'));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat((d) => `E${d}`))
      .call((g) => g.selectAll('text').attr('fill', 'rgba(255,255,255,0.5)').style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', 'rgba(255,255,255,0.15)'));

    // Horizontal grid lines
    g.selectAll('.grid-line')
      .data(d3.range(electrodes))
      .join('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('y2', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('stroke', 'rgba(255,255,255,0.05)');

    // Spike dots
    const subset = spikes.length > 8000 ? spikes.filter((_, i) => i % Math.ceil(spikes.length / 8000) === 0) : spikes;

    g.selectAll('.spike')
      .data(subset)
      .join('circle')
      .attr('cx', (d) => x(d.time))
      .attr('cy', (d) => (y(d.electrode) ?? 0) + y.bandwidth() / 2)
      .attr('r', 1.5)
      .attr('fill', (d) => ELECTRODE_COLORS[d.electrode % ELECTRODE_COLORS.length])
      .attr('opacity', 0.7);
  }, [spikes, duration, electrodes]);

  return <svg ref={svgRef} className="w-full h-64" />;
}

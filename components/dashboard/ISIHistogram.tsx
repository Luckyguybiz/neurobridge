'use client';

import { useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import { scaleLog, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { bin, max, range } from 'd3-array';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS, getThemeColors } from '@/lib/utils';

export default function ISIHistogram({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const tc = getThemeColors();
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 45 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Compute ISIs per electrode
    const isiAll: number[] = [];
    for (let e = 0; e < electrodes; e++) {
      const elSpikes = spikes.filter((s) => s.electrode === e).sort((a, b) => a.time - b.time);
      for (let i = 1; i < elSpikes.length; i++) {
        const isi = (elSpikes[i].time - elSpikes[i - 1].time) * 1000; // ms
        if (isi > 0 && isi < 1000) isiAll.push(isi);
      }
    }

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = scaleLog().domain([1, 1000]).range([0, w]).clamp(true);
    const bins = bin().domain([1, 1000] as [number, number]).thresholds(range(0, 3, 0.1).map((v) => 10 ** v))(isiAll);
    const maxCount = max(bins, (b) => b.length) ?? 1;
    const y = scaleLinear().domain([0, maxCount]).range([h, 0]);

    g.selectAll('.bar')
      .data(bins)
      .join('rect')
      .attr('x', (d) => x(d.x0 ?? 1))
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(0, x(d.x1 ?? 2) - x(d.x0 ?? 1) - 1))
      .attr('height', (d) => h - y(d.length))
      .attr('fill', ELECTRODE_COLORS[0])
      .attr('opacity', 0.7)
      .attr('rx', 1);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(axisBottom(x).tickValues([1, 5, 10, 50, 100, 500]).tickFormat((d) => `${d}ms`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.append('g')
      .call(axisLeft(y).ticks(5))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));
  }, [spikes, electrodes]);

  return <svg ref={svgRef} className="w-full h-44 sm:h-56" />;
}

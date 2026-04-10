'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Spike } from '@/lib/types';
import { getThemeColors } from '@/lib/utils';

export default function FiringRateHeatmap({ spikes, duration, electrodes }: { spikes: Spike[]; duration: number; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const tc = getThemeColors();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 50, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const binSize = 1; // 1 second bins
    const numBins = Math.ceil(duration / binSize);

    // Count spikes per bin per electrode
    const counts: number[][] = Array.from({ length: electrodes }, () => new Array(numBins).fill(0));
    for (const spike of spikes) {
      const bin = Math.min(Math.floor(spike.time / binSize), numBins - 1);
      counts[spike.electrode][bin]++;
    }

    const maxCount = d3.max(counts.flat()) ?? 1;
    const color = d3.scaleSequential(d3.interpolateInferno).domain([0, maxCount]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, duration]).range([0, w]);
    const y = d3.scaleBand<number>().domain(d3.range(electrodes)).range([0, h]).padding(0.08);

    const cellW = w / numBins;

    for (let e = 0; e < electrodes; e++) {
      for (let b = 0; b < numBins; b++) {
        g.append('rect')
          .attr('x', b * cellW)
          .attr('y', y(e) ?? 0)
          .attr('width', cellW + 0.5)
          .attr('height', y.bandwidth())
          .attr('fill', color(counts[e][b]))
          .attr('rx', 1);
      }
    }

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d}s`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.append('g')
      .call(d3.axisLeft(y).tickFormat((d) => `E${d}`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    // Color legend
    const legendW = 12;
    const legendH = h;
    const legendG = svg.append('g').attr('transform', `translate(${width - margin.right + 12},${margin.top})`);
    const legendScale = d3.scaleLinear().domain([0, maxCount]).range([legendH, 0]);
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'heatGrad').attr('x1', '0').attr('y1', '1').attr('x2', '0').attr('y2', '0');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color(0));
    gradient.append('stop').attr('offset', '50%').attr('stop-color', color(maxCount / 2));
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color(maxCount));
    legendG.append('rect').attr('width', legendW).attr('height', legendH).attr('fill', 'url(#heatGrad)').attr('rx', 3);
    legendG.append('g').attr('transform', `translate(${legendW},0)`)
      .call(d3.axisRight(legendScale).ticks(4).tickSize(3))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '9px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));
  }, [spikes, duration, electrodes]);

  return <svg ref={svgRef} className="w-full h-64" />;
}

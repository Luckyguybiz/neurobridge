'use client';

import { useRef, useEffect, useMemo } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { range } from 'd3-array';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS, getThemeColors } from '@/lib/utils';

const SVG_THRESHOLD = 1500;

/**
 * Hybrid raster: SVG axes always, dots on Canvas when spikes > 1500.
 *
 * SVG circles for raster dots are surprisingly expensive — at ~8K circles
 * (32 electrodes × 250 spikes/ch typical) the browser stalls 200–500ms on
 * each layout pass, and theme switches force a full re-render. Canvas
 * draws all dots in one pass, GPU-accelerated, regardless of count.
 */
export default function RasterPlot({ spikes, duration, electrodes }: { spikes: Spike[]; duration: number; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Decimate up-front so both renderers stay snappy. Canvas could handle more
  // but visual density above ~8K stops being informative anyway.
  const drawSpikes = useMemo(() => {
    if (spikes.length <= 8000) return spikes;
    const stride = Math.ceil(spikes.length / 8000);
    return spikes.filter((_, i) => i % stride === 0);
  }, [spikes]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const canvasEl = canvasRef.current;
    if (!svgEl) return;

    const tc = getThemeColors();
    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const rect = svgEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const x = scaleLinear().domain([0, duration]).range([0, w]);
    const y = scaleBand<number>().domain(range(electrodes)).range([0, h]).padding(0.3);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(axisBottom(x).ticks(6).tickFormat((d) => `${d}s`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.append('g')
      .call(axisLeft(y).tickFormat((d) => `E${d}`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.selectAll('.grid-line')
      .data(range(electrodes))
      .join('line')
      .attr('x1', 0).attr('x2', w)
      .attr('y1', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('y2', (d) => (y(d) ?? 0) + y.bandwidth() / 2)
      .attr('stroke', tc.grid);

    const useCanvas = drawSpikes.length > SVG_THRESHOLD && canvasEl;

    if (useCanvas) {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvasEl.style.left = `${margin.left}px`;
      canvasEl.style.top = `${margin.top}px`;
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      canvasEl.width = Math.round(w * dpr);
      canvasEl.height = Math.round(h * dpr);
      const ctx = canvasEl.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 0.7;
        for (const s of drawSpikes) {
          ctx.fillStyle = ELECTRODE_COLORS[s.electrode % ELECTRODE_COLORS.length];
          const cx = x(s.time);
          const cy = (y(s.electrode) ?? 0) + y.bandwidth() / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Hide canvas for small datasets — SVG is fine and crisper
      if (canvasEl) {
        canvasEl.width = 0;
        canvasEl.height = 0;
      }
      g.selectAll('.spike')
        .data(drawSpikes)
        .join('circle')
        .attr('cx', (d) => x(d.time))
        .attr('cy', (d) => (y(d.electrode) ?? 0) + y.bandwidth() / 2)
        .attr('r', 1.5)
        .attr('fill', (d) => ELECTRODE_COLORS[d.electrode % ELECTRODE_COLORS.length])
        .attr('opacity', 0.7);
    }
  }, [drawSpikes, duration, electrodes]);

  return (
    <div className="relative w-full h-52 sm:h-64">
      <canvas ref={canvasRef} className="absolute pointer-events-none" />
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

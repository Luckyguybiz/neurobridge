'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleBand, scaleSequential } from 'd3-scale';
import { interpolateInferno } from 'd3-scale-chromatic';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { max, range } from 'd3-array';
import type { Spike } from '@/lib/types';
import { getThemeColors } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';

/**
 * Hybrid Canvas + SVG renderer.
 *
 * Cells go on a Canvas layer (GPU-accelerated, single repaint regardless of
 * count). The previous version called `g.append('rect')` 3,800 times in a
 * synchronous loop — that's 3,800 DOM nodes plus 3,800 layout-affecting
 * inserts. Browser would freeze for hundreds of ms on a typical FinalSpark
 * dataset (32ch × 119s).
 *
 * SVG layer keeps axes and the color legend (small, accessible, crisp).
 */
export default function FiringRateHeatmap({ spikes, duration, electrodes }: { spikes: Spike[]; duration: number; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Bump on ResizeObserver to re-run the render effect after layout settles.
  // Without this, first mount in a hidden tab gets getBoundingClientRect() = 0
  // → canvas.width = negative → IndexSizeError → blank chart forever.
  const [sizeTick, setSizeTick] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSizeTick((n) => n + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-compute per-bin counts only when inputs actually change.
  // useMemo skips work when React re-renders for unrelated reasons (theme, parent state).
  const { counts, maxCount, numBins } = useMemo(() => {
    if (spikes.length === 0) return { counts: [], maxCount: 1, numBins: 0 };
    const binSize = 1; // 1 second bins
    const nBins = Math.ceil(duration / binSize);
    const c: number[][] = Array.from({ length: electrodes }, () => new Array(nBins).fill(0));
    for (const spike of spikes) {
      const bin = Math.min(Math.floor(spike.time / binSize), nBins - 1);
      if (spike.electrode >= 0 && spike.electrode < electrodes) c[spike.electrode][bin]++;
    }
    const m = max(c.flat()) ?? 1;
    return { counts: c, maxCount: m, numBins: nBins };
  }, [spikes, duration, electrodes]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const canvasEl = canvasRef.current;
    if (!svgEl || !canvasEl || counts.length === 0) return;

    const tc = getThemeColors();
    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const rect = svgEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 50, bottom: 30, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Guard: first mount in hidden tab / pre-layout returns 0-size rect.
    // Setting canvas to a negative int throws IndexSizeError; bail and wait
    // for ResizeObserver to bump sizeTick when layout arrives.
    if (w <= 0 || h <= 0) return;

    const x = scaleLinear().domain([0, duration]).range([0, w]);
    const y = scaleBand<number>().domain(range(electrodes)).range([0, h]).padding(0.08);
    const color = scaleSequential(interpolateInferno).domain([0, maxCount]);

    // ── Canvas layer: position + size + draw cells ──
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
      const cellW = w / numBins;
      const cellH = y.bandwidth();
      for (let e = 0; e < electrodes; e++) {
        const yPos = y(e) ?? 0;
        const row = counts[e];
        for (let b = 0; b < numBins; b++) {
          ctx.fillStyle = color(row[b]) as string;
          ctx.fillRect(b * cellW, yPos, cellW + 0.5, cellH);
        }
      }
    }

    // ── SVG: axes ──
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

    // ── SVG: color legend ──
    const legendW = 12;
    const legendH = h;
    const legendG = svg.append('g').attr('transform', `translate(${width - margin.right + 12},${margin.top})`);
    const legendScale = scaleLinear().domain([0, maxCount]).range([legendH, 0]);
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'heatGrad').attr('x1', '0').attr('y1', '1').attr('x2', '0').attr('y2', '0');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color(0));
    gradient.append('stop').attr('offset', '50%').attr('stop-color', color(maxCount / 2));
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color(maxCount));
    legendG.append('rect').attr('width', legendW).attr('height', legendH).attr('fill', 'url(#heatGrad)').attr('rx', 3);
    legendG.append('g').attr('transform', `translate(${legendW},0)`)
      .call(axisRight(legendScale).ticks(4).tickSize(3))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '9px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));
  }, [counts, maxCount, numBins, duration, electrodes, theme, sizeTick]);

  return (
    <div ref={wrapRef} className="relative w-full h-52 sm:h-64">
      <canvas ref={canvasRef} className="absolute pointer-events-none" />
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

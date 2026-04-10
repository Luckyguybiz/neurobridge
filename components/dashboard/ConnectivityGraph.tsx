'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS, ELECTRODE_POSITIONS, getThemeColors } from '@/lib/utils';

interface SimNode extends d3.SimulationNodeDatum {
  id: number;
  label: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  strength: number;
}

export default function ConnectivityGraph({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || spikes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Compute pairwise correlation (co-firing within 10ms window)
    const spikesByEl: number[][] = Array.from({ length: electrodes }, () => []);
    for (const s of spikes) spikesByEl[s.electrode].push(s.time);

    const links: SimLink[] = [];
    for (let i = 0; i < electrodes; i++) {
      for (let j = i + 1; j < electrodes; j++) {
        let count = 0;
        let ai = 0, bi = 0;
        const a = spikesByEl[i], b = spikesByEl[j];
        while (ai < a.length && bi < b.length) {
          const diff = Math.abs(a[ai] - b[bi]);
          if (diff < 0.01) { count++; ai++; bi++; }
          else if (a[ai] < b[bi]) ai++;
          else bi++;
        }
        const norm = Math.min(a.length, b.length) || 1;
        const strength = count / norm;
        if (strength > 0.02) {
          links.push({ source: i, target: j, strength });
        }
      }
    }

    const nodes: SimNode[] = ELECTRODE_POSITIONS.slice(0, electrodes).map((p, i) => ({
      id: i,
      label: p.label,
      x: width / 2 + (p.x - 1.5) * 60,
      y: height / 2 + (p.y - 0.5) * 80,
    }));

    const maxStrength = d3.max(links, (l) => l.strength) ?? 1;
    const linkWidth = d3.scaleLinear().domain([0, maxStrength]).range([0.5, 5]);
    const linkOpacity = d3.scaleLinear().domain([0, maxStrength]).range([0.1, 0.8]);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(80).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(25));

    const linkEls = svg.selectAll('.link')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', (d) => linkWidth(d.strength))
      .attr('opacity', (d) => linkOpacity(d.strength));

    const nodeEls = svg.selectAll<SVGGElement, SimNode>('.node')
      .data(nodes)
      .join('g');

    nodeEls.call(d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    nodeEls.append('circle')
      .attr('r', 18)
      .attr('fill', (d) => ELECTRODE_COLORS[d.id % ELECTRODE_COLORS.length])
      .attr('opacity', 0.2)
      .attr('stroke', (d) => ELECTRODE_COLORS[d.id % ELECTRODE_COLORS.length])
      .attr('stroke-width', 2);

    nodeEls.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      linkEls
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      nodeEls.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [spikes, electrodes]);

  return <svg ref={svgRef} className="w-full h-64" />;
}

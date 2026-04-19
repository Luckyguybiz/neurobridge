'use client';

import { useRef, useEffect, useState } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { min, max, mean } from 'd3-array';
import { line as d3Line } from 'd3-shape';
import type { Spike } from '@/lib/types';
import { ELECTRODE_COLORS, getThemeColors } from '@/lib/utils';

export default function SpikeWaveforms({ spikes, electrodes }: { spikes: Spike[]; electrodes: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedElectrode, setSelectedElectrode] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;
    const tc = getThemeColors();
    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = { top: 10, right: 15, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const electrodeSpikes = spikes.filter((s) => s.electrode === selectedElectrode);
    const sample = electrodeSpikes.length > 80 ? electrodeSpikes.slice(0, 80) : electrodeSpikes;
    if (sample.length === 0) return;

    const wfLen = sample[0].waveform.length;
    const allVals = sample.flatMap((s) => s.waveform);
    const yMin = min(allVals) ?? -200;
    const yMax = max(allVals) ?? 50;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = scaleLinear().domain([0, wfLen - 1]).range([0, w]);
    const y = scaleLinear().domain([yMin * 1.1, yMax * 1.3]).range([h, 0]);

    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(axisBottom(x).ticks(5).tickFormat((d) => `${((+d / 30000) * 1000).toFixed(1)} ms`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    g.append('g')
      .call(axisLeft(y).ticks(5).tickFormat((d) => `${d} uV`))
      .call((g) => g.selectAll('text').attr('fill', tc.textSecondary).style('font-size', '10px'))
      .call((g) => g.selectAll('line, path').attr('stroke', tc.axis));

    // Zero line
    g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', tc.grid);

    const line = d3Line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d));

    const color = ELECTRODE_COLORS[selectedElectrode % ELECTRODE_COLORS.length];

    for (const spike of sample) {
      g.append('path')
        .datum(spike.waveform)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.2);
    }

    // Mean waveform
    const meanWf = Array.from({ length: wfLen }, (_, i) => mean(sample.map((s) => s.waveform[i])) ?? 0);
    g.append('path')
      .datum(meanWf)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('opacity', 1);
  }, [spikes, selectedElectrode, electrodes]);

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: electrodes }, (_, i) => (
          <button
            key={i}
            onClick={() => setSelectedElectrode(i)}
            className="px-2 py-0.5 rounded text-xs transition-all"
            style={{
              backgroundColor: selectedElectrode === i ? ELECTRODE_COLORS[i] : 'var(--bg-card)',
              color: selectedElectrode === i ? '#000' : 'var(--text-secondary)',
            }}
          >
            E{i}
          </button>
        ))}
      </div>
      <svg ref={svgRef} className="w-full h-44 sm:h-56" />
    </div>
  );
}

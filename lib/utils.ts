import * as d3 from 'd3';

export const ELECTRODE_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb923c',
  '#4ade80', '#facc15', '#f87171', '#38bdf8',
] as const;

export const ELECTRODE_POSITIONS = [
  { x: 0, y: 0, label: 'E0' },
  { x: 1, y: 0, label: 'E1' },
  { x: 2, y: 0, label: 'E2' },
  { x: 3, y: 0, label: 'E3' },
  { x: 0, y: 1, label: 'E4' },
  { x: 1, y: 1, label: 'E5' },
  { x: 2, y: 1, label: 'E6' },
  { x: 3, y: 1, label: 'E7' },
];

export const firingRateColorScale = d3.scaleSequential(d3.interpolateInferno).domain([0, 30]);

export function formatTime(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(0).padStart(2, '0')}`;
}

export function groupSpikesByElectrode(spikes: { time: number; electrode: number }[], numElectrodes: number) {
  const groups: { time: number; electrode: number }[][] = Array.from({ length: numElectrodes }, () => []);
  for (const spike of spikes) {
    groups[spike.electrode]?.push(spike);
  }
  return groups;
}

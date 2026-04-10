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

/**
 * Get theme-aware colors for D3/Canvas rendering.
 * Reads CSS variables at runtime so charts adapt to light/dark mode.
 */
export function getThemeColors(): {
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  grid: string;
  axis: string;
  bg: string;
  bgCard: string;
  border: string;
  cyan: string;
  violet: string;
} {
  if (typeof window === 'undefined') {
    // SSR fallback — dark theme
    return {
      text: 'rgba(255,255,255,0.85)',
      textSecondary: 'rgba(255,255,255,0.6)',
      textMuted: 'rgba(255,255,255,0.3)',
      textFaint: 'rgba(255,255,255,0.15)',
      grid: 'rgba(255,255,255,0.06)',
      axis: 'rgba(255,255,255,0.12)',
      bg: '#05060a',
      bgCard: 'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.04)',
      cyan: '#22d3ee',
      violet: '#a78bfa',
    };
  }
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    text: v('--text-primary') || 'rgba(255,255,255,0.85)',
    textSecondary: v('--text-secondary') || 'rgba(255,255,255,0.6)',
    textMuted: v('--text-muted') || 'rgba(255,255,255,0.3)',
    textFaint: v('--text-faint') || 'rgba(255,255,255,0.15)',
    grid: v('--chart-grid') || 'rgba(255,255,255,0.06)',
    axis: v('--chart-axis') || 'rgba(255,255,255,0.12)',
    bg: v('--bg-primary') || '#05060a',
    bgCard: v('--bg-card') || 'rgba(255,255,255,0.03)',
    border: v('--border') || 'rgba(255,255,255,0.04)',
    cyan: v('--accent-cyan') || '#22d3ee',
    violet: v('--accent-violet') || '#a78bfa',
  };
}

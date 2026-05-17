'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export interface RadialGaugeProps {
  /** Main value, 0..max */
  value: number;
  /** Upper bound for the gauge arc. Defaults to 100. */
  max?: number;
  /** 0..1 where the arc starts (0 = 12 o'clock), defaults to 0.08 (8% gap below) */
  startAngle?: number;
  /** 0..1 where the arc ends, defaults to 0.92 */
  endAngle?: number;
  /** Pixel size of the square container. */
  size?: number;
  /** Stroke width of the arc, auto-scales if omitted. */
  stroke?: number;
  /** Accent tokens: "primary" | "neural" | "spark" | "auto" (threshold-based). */
  accent?: 'primary' | 'neural' | 'spark' | 'warn' | 'success' | 'auto';
  /** Auto-accent thresholds — used only when accent="auto". [warnBelow, primaryBelow] */
  autoThresholds?: [number, number];
  /** Main label over the value (e.g. "NCI Score"). */
  label?: ReactNode;
  /** Subtitle under the value (e.g. "Grade C"). */
  subtitle?: ReactNode;
  /** Optional unit glyph shown small next to the value ("%", "Hz"). */
  unit?: ReactNode;
  /** Tick marks every N units along the track. 0 = off. */
  ticks?: number;
  /** Loading state: pulses track without drawing the arc. */
  loading?: boolean;
  className?: string;
}

const accentColorFor = (accent: NonNullable<RadialGaugeProps['accent']>, value: number, thresholds: [number, number]): [string, string] => {
  const map = {
    primary: ['var(--bio-primary-500)', 'var(--bio-primary-400)'] as const,
    neural:  ['var(--bio-neural-500)',  'var(--bio-neural-400)']  as const,
    spark:   ['var(--bio-spark-600)',   'var(--bio-spark-400)']   as const,
    warn:    ['var(--bio-warn-500)',    'var(--bio-warn-400)']    as const,
    success: ['var(--bio-success-500)', 'var(--bio-success-400)'] as const,
  };
  if (accent !== 'auto') return [...map[accent]];
  const [warnBelow, primaryBelow] = thresholds;
  if (value < warnBelow)     return [...map.warn];
  if (value < primaryBelow)  return [...map.spark];
  return [...map.primary];
};

export function RadialGauge({
  value,
  max = 100,
  startAngle = 0.08,
  endAngle = 0.92,
  size = 220,
  stroke,
  accent = 'auto',
  autoThresholds = [40, 60],
  label,
  subtitle,
  unit,
  ticks = 10,
  loading = false,
  className = '',
}: RadialGaugeProps) {
  const gradientId = useId();
  const strokeW = stroke ?? Math.max(8, Math.round(size * 0.058));
  const r = (size - strokeW) / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcFraction = Math.max(0, Math.min(1, endAngle - startAngle));
  const arcLen = circumference * arcFraction;
  const progress = Math.max(0, Math.min(1, value / max));
  const arcDrawn = arcLen * progress;

  const rotateDeg = 360 * startAngle - 90; // start at top-left offset
  const [colorMain, colorGlow] = accentColorFor(accent, value, autoThresholds);

  // Animate the value so it counts up instead of snapping.
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (loading) return;
    const start = performance.now();
    const from = displayed;
    const to = value;
    const dur = 900;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplayed(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loading]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${rotateDeg}deg)`, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorGlow} />
            <stop offset="100%" stopColor={colorMain} />
          </linearGradient>
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--glass-thick)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          opacity={loading ? 0.7 : 1}
          className={loading ? 'anim-breathe' : ''}
        />

        {/* Ticks */}
        {ticks > 0 && !loading && Array.from({ length: ticks + 1 }, (_, i) => {
          const t = i / ticks;
          const angle = 2 * Math.PI * (t * arcFraction);
          const rInner = r - strokeW / 2 - 3;
          const rOuter = r - strokeW / 2 + 3;
          const x1 = cx + rInner * Math.cos(angle);
          const y1 = cy + rInner * Math.sin(angle);
          const x2 = cx + rOuter * Math.cos(angle);
          const y2 = cy + rOuter * Math.sin(angle);
          const passed = t <= progress;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={passed ? colorMain : 'var(--edge-outline)'}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={passed ? 0.6 : 0.25}
            />
          );
        })}

        {/* Progress arc */}
        {!loading && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${arcDrawn} ${circumference}`}
            style={{
              transition: 'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `url(#${gradientId}-glow)`,
            }}
          />
        )}
      </svg>

      {/* Center text block */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div>
          {label && (
            <div className="type-eyebrow" style={{ marginBottom: 'var(--space-1)' }}>
              {label}
            </div>
          )}
          <div
            className="font-display tabular"
            style={{
              fontSize: size > 180 ? 'var(--t-4xl)' : 'var(--t-3xl)',
              lineHeight: 1,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '4px',
            }}
          >
            {loading ? (
              <span className="anim-shimmer" style={{ display: 'inline-block', width: '3ch', height: '0.9em', borderRadius: 'var(--radius-sm)' }} />
            ) : (
              <>
                <span>{Math.round(displayed)}</span>
                {unit && (
                  <span style={{ fontSize: '0.35em', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>
          {subtitle && (
            <div className="type-caption" style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Outer glow — subtle bio pulse */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          boxShadow: loading ? 'none' : `0 0 48px color-mix(in srgb, ${colorMain} 14%, transparent)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

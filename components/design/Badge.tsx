'use client';

import { type ReactNode } from 'react';

export type BadgeTone = 'primary' | 'neural' | 'spark' | 'warn' | 'error' | 'success' | 'neutral';
export type BadgeSize = 'sm' | 'md';
export type BadgeVariant = 'glass' | 'solid' | 'outline';

export interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  variant?: BadgeVariant;
  dot?: boolean;
  pulsing?: boolean;
  className?: string;
  children?: ReactNode;
}

const toneVar: Record<BadgeTone, string> = {
  primary: 'var(--bio-primary-500)',
  neural: 'var(--bio-neural-500)',
  spark: 'var(--bio-spark-600)',
  warn: 'var(--bio-warn-500)',
  error: 'var(--bio-error-500)',
  success: 'var(--bio-success-500)',
  neutral: 'var(--text-secondary)',
};

export function Badge({
  tone = 'primary',
  size = 'sm',
  variant = 'glass',
  dot = false,
  pulsing = false,
  className = '',
  children,
}: BadgeProps) {
  const color = toneVar[tone];

  const sizeStyle: React.CSSProperties = size === 'sm'
    ? { height: '22px', padding: '0 8px', fontSize: 'var(--t-xs)', gap: '6px' }
    : { height: '28px', padding: '0 12px', fontSize: 'var(--t-sm)', gap: '8px' };

  const variantStyle: React.CSSProperties = variant === 'solid'
    ? { background: color, color: '#0a0c14' }
    : variant === 'outline'
      ? {
          background: 'transparent',
          color,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 55%, transparent)`,
        }
      : {
          background: `color-mix(in srgb, ${color} 14%, var(--glass-ultra-thin))`,
          color,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
        };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--tw-semibold)' as unknown as number,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...sizeStyle,
        ...variantStyle,
      }}
    >
      {dot && (
        <span
          className={pulsing ? 'anim-breathe' : ''}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: variant === 'solid' ? 'currentColor' : color,
            boxShadow: pulsing ? `0 0 8px ${color}` : undefined,
            flex: '0 0 auto',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

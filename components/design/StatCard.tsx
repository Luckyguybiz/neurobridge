'use client';

import { type ReactNode } from 'react';
import { Glass, type GlassTint } from './Glass';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  caption?: ReactNode;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  icon?: ReactNode;
  tint?: GlassTint;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
}

const valueSizeByCard = {
  sm: 'var(--t-2xl)',
  md: 'var(--t-3xl)',
  lg: 'var(--t-4xl)',
};

const deltaColor = {
  up: 'var(--bio-success-500)',
  down: 'var(--bio-error-500)',
  flat: 'var(--text-tertiary)',
};

const deltaArrow = {
  up: '↑',
  down: '↓',
  flat: '→',
};

export function StatCard({
  label,
  value,
  unit,
  caption,
  delta,
  icon,
  tint = 'none',
  size = 'md',
  loading = false,
  className = '',
}: StatCardProps) {
  return (
    <Glass
      tint={tint}
      radius="xl"
      elevation={2}
      className={`lift-on-hover ${className}`}
      style={{ padding: 'var(--space-5)', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div
          className="type-eyebrow"
          style={{ color: 'var(--text-tertiary)', minWidth: 0, flex: 1 }}
        >
          {label}
        </div>
        {icon && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--glass-thin)',
              color: 'var(--text-secondary)',
              flex: '0 0 auto',
            }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-1)',
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--tw-bold)',
          fontSize: valueSizeByCard[size],
          letterSpacing: '-0.022em',
          lineHeight: 1.05,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
          minHeight: size === 'lg' ? '4.5rem' : size === 'md' ? '3rem' : '2.2rem',
        }}
      >
        {loading ? (
          <span
            className="anim-shimmer"
            style={{
              width: '60%',
              height: '0.9em',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
            }}
          />
        ) : (
          <>
            <span>{value}</span>
            {unit && (
              <span
                style={{
                  fontSize: '0.45em',
                  fontWeight: 'var(--tw-medium)' as unknown as number,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.02em',
                }}
              >
                {unit}
              </span>
            )}
          </>
        )}
      </div>

      {(caption || delta) && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          {delta && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--t-sm)',
                fontWeight: 'var(--tw-semibold)' as unknown as number,
                color: deltaColor[delta.direction],
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span aria-hidden="true">{deltaArrow[delta.direction]}</span>
              {delta.value}
            </span>
          )}
          {caption && (
            <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>
              {caption}
            </span>
          )}
        </div>
      )}
    </Glass>
  );
}

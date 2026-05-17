'use client';

import { useId, type ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  accent?: 'primary' | 'neural' | 'spark';
  className?: string;
  label?: string;
}

const accentVar = {
  primary: 'var(--bio-primary-500)',
  neural: 'var(--bio-neural-500)',
  spark: 'var(--bio-spark-600)',
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  fullWidth = false,
  accent = 'primary',
  className = '',
  label,
}: SegmentedProps<T>) {
  const groupId = useId();
  const color = accentVar[accent];

  const heightPx = size === 'sm' ? 32 : 40;
  const fontVar = size === 'sm' ? 'var(--t-sm)' : 'var(--t-base)';

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={className}
      style={{
        display: 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        padding: '3px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--glass-ultra-thin)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: 'inset 0 0 0 1px var(--edge-outline), inset 0 1px 0 rgba(0,0,0,0.15)',
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${groupId}-${opt.value}`}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className="motion-spring"
            style={{
              flex: fullWidth ? '1 1 0' : '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: `${heightPx}px`,
              padding: '0 14px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-body)',
              fontSize: fontVar,
              fontWeight: selected
                ? 'var(--tw-semibold)' as unknown as number
                : 'var(--tw-medium)' as unknown as number,
              letterSpacing: '0.005em',
              cursor: 'pointer',
              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: selected ? 'var(--glass-thick)' : 'transparent',
              boxShadow: selected
                ? `inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px color-mix(in srgb, ${color} 25%, transparent), var(--shadow-sm)`
                : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

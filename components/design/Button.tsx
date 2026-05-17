'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'solid' | 'glass' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAccent = 'primary' | 'neural' | 'spark' | 'warn' | 'error' | 'neutral';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  accent?: ButtonAccent;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    height: '32px',
    padding: '0 12px',
    fontSize: 'var(--t-sm)',
    borderRadius: 'var(--radius-md)',
  },
  md: {
    height: '40px',
    padding: '0 18px',
    fontSize: 'var(--t-base)',
    borderRadius: 'var(--radius-lg)',
  },
  lg: {
    height: '52px',
    padding: '0 28px',
    fontSize: 'var(--t-md)',
    borderRadius: 'var(--radius-xl)',
  },
};

const accentVar: Record<ButtonAccent, string> = {
  primary: 'var(--bio-primary-500)',
  neural: 'var(--bio-neural-500)',
  spark: 'var(--bio-spark-600)',
  warn: 'var(--bio-warn-500)',
  error: 'var(--bio-error-500)',
  neutral: 'var(--text-primary)',
};

function variantStyle(
  variant: ButtonVariant,
  accent: ButtonAccent,
): React.CSSProperties {
  const color = accentVar[accent];

  switch (variant) {
    case 'solid':
      return {
        background: color,
        color: accent === 'neutral'
          ? 'var(--surface-1)'
          : '#0a0c14',
        boxShadow:
          `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.18), 0 6px 16px color-mix(in srgb, ${color} 32%, transparent)`,
      };
    case 'glass':
      return {
        background: `color-mix(in srgb, ${color} 12%, var(--glass-thin))`,
        color: 'var(--text-primary)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        boxShadow: `inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)`,
      };
    case 'outline':
      return {
        background: 'transparent',
        color,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 50%, transparent)`,
      };
    case 'ghost':
    default:
      return {
        background: 'transparent',
        color: 'var(--text-primary)',
      };
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    size = 'md',
    accent = 'primary',
    leftIcon,
    rightIcon,
    loading,
    fullWidth,
    className = '',
    style,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--tw-semibold)' as unknown as number,
    letterSpacing: '-0.005em',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
    border: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...sizeStyles[size],
    ...variantStyle(variant, accent),
    ...style,
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`btn-liquid motion-spring ripple-on-press ${className}`}
      style={baseStyle}
      {...rest}
    >
      {loading ? (
        <span className="anim-spin-slow" aria-hidden="true" style={{ display: 'inline-flex' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
            <path d="M12.5 7A5.5 5.5 0 0 0 7 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

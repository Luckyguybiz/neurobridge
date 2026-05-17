'use client';

import { ReactNode } from 'react';
import { ChartSkeleton, ErrorDisplay } from './shared';

export default function ChartCard({
  title,
  description,
  children,
  className = '',
  loading,
  error,
  onRetry,
  skeletonSize = 'md',
  subsampled,
  subsampledSpikes,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  skeletonSize?: 'sm' | 'md' | 'lg';
  /** Backend signalled it computed on a subset of the dataset. */
  subsampled?: boolean;
  /** Number of spikes the backend actually used (if provided). */
  subsampledSpikes?: number;
}) {
  return (
    <div
      className={`group relative rounded-2xl lift-on-hover ${className}`}
      style={{
        background: 'var(--glass-ultra-thin)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow:
          'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px var(--edge-outline), var(--shadow-sm)',
      }}
    >
      <div className="relative z-10 p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className="type-title-3"
              style={{ fontSize: 'var(--t-base)', letterSpacing: '-0.005em' }}
            >
              {title}
            </h3>
            {description && (
              <p
                className="type-caption"
                style={{ marginTop: '2px', color: 'var(--text-tertiary)', letterSpacing: '0.005em' }}
              >
                {description}
              </p>
            )}
            {subsampled && !loading && !error && (
              <span
                className="inline-flex items-center gap-1 mt-1.5"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--tw-semibold)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--bio-warn-500) 14%, transparent)',
                  color: 'var(--bio-warn-500)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bio-warn-500) 25%, transparent)',
                }}
                title="Backend subsampled the dataset to stay under the computation budget. Results reflect a representative window."
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M2 6h8M2 3h8M2 9h5" strokeLinecap="round" />
                </svg>
                {subsampledSpikes ? `subset: ${subsampledSpikes.toLocaleString()}` : 'subset'}
              </span>
            )}
          </div>
          <div
            className="w-2 h-2 rounded-full mt-2 shrink-0 motion-fast"
            style={{
              background: loading
                ? 'var(--bio-warn-500)'
                : error
                  ? 'var(--bio-error-500)'
                  : 'var(--bio-primary-500)',
              boxShadow: loading || error
                ? undefined
                : '0 0 6px color-mix(in srgb, var(--bio-primary-500) 60%, transparent)',
            }}
          />
        </div>
        <div className="w-full overflow-hidden">
          {loading ? <ChartSkeleton size={skeletonSize} /> :
           error  ? <ErrorDisplay message={error} onRetry={onRetry} /> :
                    children}
        </div>
      </div>
    </div>
  );
}

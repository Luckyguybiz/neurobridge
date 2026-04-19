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
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  skeletonSize?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div
      className={`group relative rounded-2xl hover:translate-y-[-2px] transition-all duration-500 ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px var(--shadow), 0 4px 16px var(--shadow)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="relative z-10 p-3 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13px] sm:text-[14px] font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>{description}</p>}
          </div>
          <div className="w-1.5 h-1.5 rounded-full transition-colors duration-700 mt-1.5 shrink-0"
            style={{
              background: loading ? 'var(--accent-amber, #fbbf24)' :
                          error   ? 'var(--accent-red, #f87171)' :
                                    'var(--accent-cyan)',
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

'use client';

import { ReactNode } from 'react';

export default function ChartCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
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
      <div className="relative z-10 p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>{description}</p>}
          </div>
          <div className="w-1.5 h-1.5 rounded-full transition-colors duration-700 mt-1.5 shrink-0"
            style={{ background: 'var(--accent-cyan)' }}
          />
        </div>
        <div className="w-full overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

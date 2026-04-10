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
      className={`group relative rounded-2xl backdrop-blur-sm hover:translate-y-[-2px] transition-all duration-700 ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: `0 2px 10px var(--shadow)`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Hover glow */}
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-cyan) 4%, transparent), transparent, color-mix(in srgb, var(--accent-violet) 4%, transparent))` }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: 'var(--text-muted)' }}>{description}</p>}
          </div>
          <div className="w-1.5 h-1.5 rounded-full transition-colors duration-700 mt-1.5 shrink-0"
            style={{ background: 'color-mix(in srgb, var(--accent-cyan) 20%, transparent)' }}
          />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

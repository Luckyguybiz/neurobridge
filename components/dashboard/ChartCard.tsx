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
    <div className={`group relative rounded-2xl border border-white/[0.04] bg-[#08090e]/80 backdrop-blur-sm hover:border-white/[0.08] hover:translate-y-[-2px] hover:shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-700 ${className}`}>
      {/* Hover glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-violet-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-[14px] font-display text-white/85">{title}</h3>
            {description && <p className="text-[10px] text-white/20 mt-0.5 tracking-wide">{description}</p>}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/20 group-hover:bg-cyan-400/60 transition-colors duration-700 mt-1.5 shrink-0" />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

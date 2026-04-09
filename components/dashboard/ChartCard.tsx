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
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

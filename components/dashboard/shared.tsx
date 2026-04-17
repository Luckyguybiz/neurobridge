'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/** Reusable metric pill — shows label + value + optional unit */
export function MetricPill({ label, value, unit, color = 'cyan' }: {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'red';
}) {
  const colorMap = {
    cyan: 'text-cyan-400',
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };
  return (
    <div className="flex flex-col px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
      <span className="text-[10px] text-th-muted uppercase tracking-wider">{label}</span>
      <span className={`text-[14px] font-medium tabular-nums ${colorMap[color] ?? 'text-th-primary'}`}>
        {value}{unit && <span className="text-[11px] text-th-muted ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

/** Loading spinner with optional message */
export function LoadingSpinner({ message, size = 'md' }: { message?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className={`${sizeMap[size]} border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3`} />
        {message && <p className="text-[12px] text-th-muted">{message}</p>}
      </div>
    </div>
  );
}

/** Error display with retry button */
export function ErrorDisplay({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-4 text-center">
      <p className="text-[11px] text-red-400/70 mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** Stat card for Quick Stats strip */
export function StatCard({ label, value, unit, icon, color = 'cyan', onClick }: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'cyan' | 'violet' | 'emerald' | 'amber';
  onClick?: () => void;
}) {
  const bgMap = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/10',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/10',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/10',
  };
  const textMap = {
    cyan: 'text-cyan-400',
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  };
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -1 } : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br ${bgMap[color]} border cursor-${onClick ? 'pointer' : 'default'} transition-all`}
      onClick={onClick}
    >
      {icon && <div className={`text-lg ${textMap[color]}`}>{icon}</div>}
      <div>
        <div className={`text-lg font-bold tabular-nums ${textMap[color]}`}>
          {value}{unit && <span className="text-[11px] text-th-muted ml-1">{unit}</span>}
        </div>
        <div className="text-[10px] text-th-muted uppercase tracking-wider">{label}</div>
      </div>
    </motion.div>
  );
}

/** JSON key-value renderer for API responses */
export function JsonView({ data, maxKeys = 10 }: { data: Record<string, unknown>; maxKeys?: number }) {
  const entries = Object.entries(data).slice(0, maxKeys);
  return (
    <div className="space-y-1 text-[11px] font-mono">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="text-th-faint shrink-0">{k}:</span>
          <span className="text-cyan-400/60 truncate" title={String(v)}>
            {typeof v === 'number' ? (Number.isInteger(v) ? String(v) : Number(v).toFixed(4)) :
             typeof v === 'boolean' ? String(v) :
             typeof v === 'string' ? v :
             Array.isArray(v) ? `[${v.length} items]` :
             typeof v === 'object' && v !== null ? `{${Object.keys(v).length} keys}` :
             String(v)}
          </span>
        </div>
      ))}
      {Object.keys(data).length > maxKeys && (
        <div className="text-th-faint">+ {Object.keys(data).length - maxKeys} more</div>
      )}
    </div>
  );
}

/** Elapsed timer for loading state */
function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(timer);
  }, []);
  const secs = (elapsed / 1000).toFixed(1);
  return (
    <span className="tabular-nums" style={{ color: 'var(--text-faint)' }}>
      {secs}s
    </span>
  );
}

/** Skeleton shimmer for chart cards while data is loading — with live elapsed timer */
export function ChartSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const hMap = { sm: 'h-32', md: 'h-48', lg: 'h-64' };
  return (
    <div className={`${hMap[size]} w-full flex flex-col justify-end gap-2 px-2 pb-2 relative`}>
      {/* Loading indicator with elapsed time */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-cyan)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Loading</span>
          <ElapsedTimer />
        </div>
      </div>
      {/* Shimmer bars mimicking a chart */}
      <div className="flex items-end gap-1.5 h-full opacity-40">
        {[0.4, 0.7, 0.5, 0.85, 0.6, 0.75, 0.45, 0.9, 0.55, 0.65, 0.8, 0.5].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm skeleton-shimmer"
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
      {/* Axis placeholder */}
      <div className="flex justify-between opacity-40">
        <div className="h-2 w-8 rounded skeleton-shimmer" />
        <div className="h-2 w-12 rounded skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
        <div className="h-2 w-8 rounded skeleton-shimmer" style={{ animationDelay: '0.2s' }} />
      </div>
      <style jsx>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--border) 25%,
            rgba(255,255,255,0.06) 50%,
            var(--border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/** Grade color helper — used across IQ, AdvancedAnalysis, Discovery */
export function getGradeColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-cyan-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

export function getGradeBg(score: number): string {
  if (score >= 80) return 'from-emerald-500/10 border-emerald-500/15';
  if (score >= 60) return 'from-cyan-500/10 border-cyan-500/15';
  if (score >= 40) return 'from-amber-500/10 border-amber-500/15';
  return 'from-red-500/10 border-red-500/15';
}

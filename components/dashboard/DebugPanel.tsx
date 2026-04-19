'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getEntries,
  getSummary,
  subscribe,
  clearEntries,
  downloadJSON,
  downloadCSV,
  type ApiLogEntry,
} from '@/lib/api-logger';

const EMPTY_ENTRIES: readonly ApiLogEntry[] = [];

function useApiLogs() {
  return useSyncExternalStore(
    subscribe,
    getEntries,
    () => EMPTY_ENTRIES,
  );
}

const statusIcon: Record<string, string> = {
  pending: '\u25CF', // filled circle
  success: '\u25CF',
  error:   '\u25CF',
};
const statusColor: Record<string, string> = {
  pending: 'text-amber-400',
  success: 'text-emerald-400',
  error:   'text-red-400',
};

function formatDuration(ms?: number): string {
  if (ms == null) return '...';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function shortenPath(path: string): string {
  // /api/analysis/abc123/iq → /iq
  // /api/datasets/abc123/spikes → /spikes
  const parts = path.split('/');
  return parts.length > 3 ? `/${parts.slice(-1)[0]}` : path;
}

export default function DebugPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useApiLogs();
  const summary = getSummary();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'error'>('all');

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.status === filter);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:w-[420px] max-h-[480px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>API Debug</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                {summary.total} req
              </span>
              {summary.pending > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md tabular-nums text-amber-400 bg-amber-500/10">
                  {summary.pending} in-flight
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-[16px] leading-none px-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
              &times;
            </button>
          </div>

          {/* Summary strip */}
          <div className="flex gap-3 px-4 py-2 text-[10px] border-b flex-wrap" style={{ borderColor: 'var(--border)' }}>
            <span className="text-emerald-400 tabular-nums">{summary.success} ok</span>
            <span className="text-red-400 tabular-nums">{summary.errors} err</span>
            <span style={{ color: 'var(--text-muted)' }} className="tabular-nums">avg {formatDuration(Math.round(summary.avgDuration))}</span>
            <div className="ml-auto flex gap-1">
              {(['all', 'pending', 'error'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all ${
                    filter === f ? 'bg-cyan-500/15 text-cyan-400' : ''
                  }`}
                  style={filter !== f ? { color: 'var(--text-faint)' } : undefined}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Request list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0"
            style={{ maxHeight: 320 }}
            onScroll={(e) => {
              const el = e.currentTarget;
              setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
            }}
          >
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                {entries.length === 0 ? 'No API requests yet' : 'No matching requests'}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filtered.map((entry) => (
                  <div key={entry.id} className="px-4 py-1.5 flex items-center gap-2 text-[11px] hover:bg-white/[0.02] transition-colors">
                    <span className={`${statusColor[entry.status]} text-[8px]`}>{statusIcon[entry.status]}</span>
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {formatTime(entry.startedAt)}
                    </span>
                    <span className="text-[9px] uppercase shrink-0 w-6" style={{ color: 'var(--text-muted)' }}>
                      {entry.method === 'GET' ? '' : entry.method}
                    </span>
                    <span className="truncate font-mono" style={{ color: 'var(--text-secondary)' }} title={entry.path}>
                      {shortenPath(entry.path)}
                    </span>
                    <span className={`ml-auto shrink-0 tabular-nums ${
                      entry.status === 'pending' ? 'text-amber-400' :
                      (entry.duration ?? 0) > 3000 ? 'text-red-400' :
                      (entry.duration ?? 0) > 1000 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {formatDuration(entry.duration)}
                    </span>
                    {entry.error && (
                      <span className="text-[9px] text-red-400/60 truncate max-w-[100px]" title={entry.error}>
                        {entry.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={downloadJSON}
              className="text-[10px] px-2.5 py-1 rounded-md transition-all hover:opacity-80"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Export JSON
            </button>
            <button
              onClick={downloadCSV}
              className="text-[10px] px-2.5 py-1 rounded-md transition-all hover:opacity-80"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Export CSV
            </button>
            <button
              onClick={clearEntries}
              className="text-[10px] px-2.5 py-1 rounded-md transition-all hover:opacity-80 ml-auto"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

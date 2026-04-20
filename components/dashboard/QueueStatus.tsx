'use client';

import { useEffect, useState } from 'react';
import { getQueueStats, subscribeQueue } from '@/lib/fetch-queue';

/**
 * Sticky status strip that shows the global fetch queue: how many API analyses
 * are actively running and how many are waiting. Without this, pages with many
 * cards (Advanced: 12, Network: 10, Discovery: 15) show a wall of identical
 * spinners and users can't tell "running" from "broken".
 */
export default function QueueStatus() {
  const [stats, setStats] = useState(getQueueStats());

  useEffect(() => {
    return subscribeQueue(() => setStats(getQueueStats()));
  }, []);

  if (stats.running === 0 && stats.queued === 0) return null;

  const total = stats.running + stats.queued;
  const runningLabels = stats.runningKeys.map((k) => k.split(':').slice(1).join(':')).slice(0, 3);

  return (
    <div
      className="mb-3 px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap text-[11px]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="w-3.5 h-3.5 border-[1.5px] border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />
      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-cyan-400">{stats.running}</span> running
        {stats.queued > 0 && (
          <> · <span className="text-amber-400">{stats.queued}</span> queued</>
        )}
        <span className="opacity-60"> / {total}</span>
      </span>
      {runningLabels.length > 0 && (
        <span className="font-mono text-[10px] opacity-70 truncate" style={{ color: 'var(--text-faint)' }}>
          {runningLabels.join(' · ')}
        </span>
      )}
    </div>
  );
}

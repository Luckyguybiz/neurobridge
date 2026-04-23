'use client';

import { useSubset } from '@/lib/subset-context';
import { clearCache } from '@/lib/analysis-cache';
import type { Subset } from '@/lib/api';

/**
 * Time-slice selector for large recordings (FinalSpark, long uploads).
 *
 * Heavy analysis endpoints can't complete on 118h of data — picking "1h"
 * makes them ~40x faster. Displayed in the dashboard header when the active
 * dataset is longer than 1h. Changing the value wipes the analysis cache
 * (results differ by slice) so new fetches go out with the new ?subset= param.
 */

interface SubsetSelectorProps {
  datasetId: string | null;
  durationSeconds: number;
}

const OPTIONS: Array<{ value: Subset; label: string; hint: string }> = [
  { value: '1h', label: '1h', hint: 'Fastest — first hour only' },
  { value: '10h', label: '10h', hint: 'Broader — first 10 hours' },
  { value: 'full', label: 'Full', hint: 'Entire recording (some analyses may time out)' },
];

export function SubsetSelector({ datasetId, durationSeconds }: SubsetSelectorProps) {
  const { subset, setSubset, clearCacheOnChange } = useSubset();

  // Only surface the control when the dataset is long enough that subset matters.
  // 3600s threshold: anything under 1h has nothing to slice.
  if (durationSeconds < 3600) return null;

  const handleChange = (next: Subset) => {
    if (next === subset) return;
    setSubset(next);
    if (clearCacheOnChange && datasetId) {
      // Wipe cached analyses — they were computed against the old subset.
      // Next render refetches with new ?subset=. clearCache() has no args
      // but also resets activeDatasetId, which is fine (next fetch reinits).
      clearCache();
    }
  };

  return (
    <div
      className="flex items-center gap-1 rounded-lg p-0.5 shrink-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      role="group"
      aria-label="Time-slice selector for heavy analyses"
    >
      <span
        className="hidden sm:inline text-[9px] uppercase tracking-wider px-1.5"
        style={{ color: 'var(--text-faint)' }}
      >
        Slice
      </span>
      {OPTIONS.map((opt) => {
        const active = subset === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            title={opt.hint}
            aria-pressed={active}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
              active
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 font-medium'
                : 'hover:text-cyan-300'
            }`}
            style={!active ? { color: 'var(--text-muted)' } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

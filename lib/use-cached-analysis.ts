'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCached, getOrFetch, clearOne } from './analysis-cache';

/**
 * Hook for fetching and caching analysis API data.
 *
 * KEY BEHAVIOR:
 * - Returns cached data instantly if available (no loading flash)
 * - If a fetch is already in-flight (started on another page), reattaches to it
 * - Navigating away does NOT cancel the fetch — it continues in the background
 * - When you come back, you get the result instantly from cache
 * - Cache auto-clears on dataset change
 * - `refetch()` wipes the cache entry for this key and re-runs the fetcher —
 *   used by the Retry button when an endpoint fails
 *
 * @param datasetId — current dataset ID
 * @param cacheKey — unique key for this analysis (e.g., 'pca', 'firing-rates')
 * @param fetcher — async function that returns the data
 * @param enabled — if false, skips fetch (default true). Useful for lazy
 *                  IntersectionObserver-based loading on long pages.
 * @returns { data, loading, error, refetch }
 */
export function useCachedAnalysis<T = Record<string, unknown>>(
  datasetId: string | null,
  cacheKey: string,
  fetcher: () => Promise<T>,
  enabled: boolean = true,
): { data: T | null; loading: boolean; error: string; refetch: () => void } {
  // Check cache synchronously for instant return (no loading flash)
  const cached = datasetId ? getCached<T>(datasetId, cacheKey) : undefined;

  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached && !!datasetId && enabled);
  const [error, setError] = useState('');
  // Bump to force the fetch effect to re-run (used by refetch).
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!datasetId || !enabled) return;

    // Already have cached data — show immediately
    const hit = getCached<T>(datasetId, cacheKey);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
      setError('');
      return;
    }

    // Use getOrFetch — reattaches to existing in-flight promise if one exists,
    // otherwise starts a new fetch (routed through fetch-queue, max 2 concurrent).
    let cancelled = false;
    setLoading(true);
    setError('');

    getOrFetch<T>(datasetId, cacheKey, fetcher)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed';
          // "cancelled" is our own signal when user navigates away — not a user-visible error
          if (msg !== 'cancelled') setError(msg);
          setLoading(false);
        }
      });

    return () => {
      // Mark as cancelled so we don't setState on unmounted component.
      // But the fetch itself continues in the background (stored in inflight map).
      cancelled = true;
    };
  }, [datasetId, cacheKey, enabled, refetchTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    if (!datasetId) return;
    clearOne(datasetId, cacheKey);
    setData(null);
    setError('');
    setRefetchTick((n) => n + 1);
  }, [datasetId, cacheKey]);

  return { data, loading, error, refetch };
}

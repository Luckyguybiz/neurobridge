'use client';

import { useState, useEffect } from 'react';
import { getCached, getOrFetch } from './analysis-cache';

/**
 * Hook for fetching and caching analysis API data.
 *
 * KEY BEHAVIOR:
 * - Returns cached data instantly if available (no loading flash)
 * - If a fetch is already in-flight (started on another page), reattaches to it
 * - Navigating away does NOT cancel the fetch — it continues in the background
 * - When you come back, you get the result instantly from cache
 * - Cache auto-clears on dataset change
 *
 * @param datasetId — current dataset ID
 * @param cacheKey — unique key for this analysis (e.g., 'pca', 'firing-rates')
 * @param fetcher — async function that returns the data
 * @returns { data, loading, error }
 */
export function useCachedAnalysis<T = Record<string, unknown>>(
  datasetId: string | null,
  cacheKey: string,
  fetcher: () => Promise<T>,
): { data: T | null; loading: boolean; error: string } {
  // Check cache synchronously for instant return (no loading flash)
  const cached = datasetId ? getCached<T>(datasetId, cacheKey) : undefined;

  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached && !!datasetId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!datasetId) return;

    // Already have cached data — show immediately
    const hit = getCached<T>(datasetId, cacheKey);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
      setError('');
      return;
    }

    // Use getOrFetch — reattaches to existing in-flight promise if one exists,
    // otherwise starts a new fetch. Either way, the promise is stored at module
    // level so navigating away won't lose it.
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
          setError(e instanceof Error ? e.message : 'Failed');
          setLoading(false);
        }
      });

    return () => {
      // Mark as cancelled so we don't setState on unmounted component.
      // But the fetch itself continues in the background (stored in inflight map).
      cancelled = true;
    };
  }, [datasetId, cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}

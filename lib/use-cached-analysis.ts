'use client';

import { useState, useEffect, useRef } from 'react';
import { getCached, setCached } from './analysis-cache';

/**
 * Hook for fetching and caching analysis API data.
 * - Returns cached data instantly if available (no loading flash)
 * - Fetches and caches if not available
 * - Cache persists across page navigation within same dataset
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
  // Check cache synchronously for instant return
  const cached = datasetId ? getCached<T>(datasetId, cacheKey) : undefined;

  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached && !!datasetId);
  const [error, setError] = useState('');
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;

    // Already have cached data for this dataset+key
    const hit = getCached<T>(datasetId, cacheKey);
    if (hit) {
      setData(hit);
      setLoading(false);
      setError('');
      fetchedRef.current = `${datasetId}:${cacheKey}`;
      return;
    }

    // Already fetching this exact combo
    if (fetchedRef.current === `${datasetId}:${cacheKey}`) return;
    fetchedRef.current = `${datasetId}:${cacheKey}`;

    setLoading(true);
    setError('');

    fetcher()
      .then((result) => {
        setCached(datasetId, cacheKey, result);
        setData(result);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed');
        setLoading(false);
      });
  }, [datasetId, cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps -- fetcher is stable by convention

  return { data, loading, error };
}

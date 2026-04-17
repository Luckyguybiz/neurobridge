/**
 * Module-level cache for API analysis responses.
 * Keyed by `datasetId:apiPath`. Auto-clears when dataset changes.
 * Used by useCachedAnalysis hook to persist data across page navigation.
 */

const cache = new Map<string, unknown>();
let activeDatasetId: string | null = null;

function key(datasetId: string, path: string): string {
  return `${datasetId}:${path}`;
}

/** Get cached value. Returns undefined if not cached. */
export function getCached<T>(datasetId: string, path: string): T | undefined {
  // Auto-clear if dataset changed
  if (datasetId !== activeDatasetId) {
    cache.clear();
    activeDatasetId = datasetId;
  }
  return cache.get(key(datasetId, path)) as T | undefined;
}

/** Store value in cache. */
export function setCached(datasetId: string, path: string, data: unknown): void {
  if (datasetId !== activeDatasetId) {
    cache.clear();
    activeDatasetId = datasetId;
  }
  cache.set(key(datasetId, path), data);
}

/** Explicitly clear all cached data (called on dataset change). */
export function clearCache(): void {
  cache.clear();
  activeDatasetId = null;
}

/** Get cache stats for debug panel. */
export function getCacheStats(): { size: number; datasetId: string | null } {
  return { size: cache.size, datasetId: activeDatasetId };
}

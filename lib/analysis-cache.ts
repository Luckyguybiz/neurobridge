/**
 * Module-level cache for API analysis responses.
 * Keyed by `datasetId:apiPath`. Auto-clears when dataset changes.
 *
 * Also stores in-flight promises so that navigating away and back
 * doesn't restart the same fetch — it reattaches to the existing one.
 */

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
let activeDatasetId: string | null = null;

function key(datasetId: string, path: string): string {
  return `${datasetId}:${path}`;
}

/** Auto-clear everything if dataset changed. */
function ensureDataset(datasetId: string): void {
  if (datasetId !== activeDatasetId) {
    cache.clear();
    inflight.clear();
    activeDatasetId = datasetId;
  }
}

/** Get cached value. Returns undefined if not cached. */
export function getCached<T>(datasetId: string, path: string): T | undefined {
  ensureDataset(datasetId);
  return cache.get(key(datasetId, path)) as T | undefined;
}

/** Store value in cache. */
export function setCached(datasetId: string, path: string, data: unknown): void {
  ensureDataset(datasetId);
  const k = key(datasetId, path);
  cache.set(k, data);
  inflight.delete(k); // fetch is done, remove promise
}

/**
 * Get or start an in-flight fetch.
 * If a fetch for this key is already running, returns the existing promise.
 * If not, starts the fetcher and stores the promise.
 * On success, result is cached automatically.
 * On error, the inflight entry is removed so retry is possible.
 */
export function getOrFetch<T>(
  datasetId: string,
  path: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  ensureDataset(datasetId);
  const k = key(datasetId, path);

  // Already have result
  const hit = cache.get(k);
  if (hit !== undefined) return Promise.resolve(hit as T);

  // Already fetching — reattach
  const existing = inflight.get(k);
  if (existing) return existing as Promise<T>;

  // Start new fetch
  const promise = fetcher()
    .then((result) => {
      cache.set(k, result);
      inflight.delete(k);
      return result;
    })
    .catch((err) => {
      inflight.delete(k); // allow retry
      throw err;
    });

  inflight.set(k, promise);
  return promise;
}

/** Check if a fetch is currently in-flight for this key. */
export function isInflight(datasetId: string, path: string): boolean {
  ensureDataset(datasetId);
  return inflight.has(key(datasetId, path));
}

/** Explicitly clear all cached data (called on dataset change). */
export function clearCache(): void {
  cache.clear();
  inflight.clear();
  activeDatasetId = null;
}

/** Get cache stats for debug panel. */
export function getCacheStats(): { size: number; inflight: number; datasetId: string | null } {
  return { size: cache.size, inflight: inflight.size, datasetId: activeDatasetId };
}

/**
 * Module-level cache for API analysis responses.
 * Keyed by `datasetId:apiPath`. Auto-clears when dataset changes.
 *
 * Also stores in-flight promises so that navigating away and back
 * doesn't restart the same fetch — it reattaches to the existing one.
 *
 * Heavy fetches are routed through fetch-queue (max 2 concurrent) so we
 * don't flood the API with 15+ parallel requests that all sit waiting
 * on the backend Semaphore(1) and look frozen to the user.
 */

import { enqueue, cancel as cancelQueued } from './fetch-queue';

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

  // Route through shared queue — max 2 concurrent heavy fetches, rest wait.
  // This is the second gate after backend Semaphore(1): frontend queue
  // keeps sockets free and surfaces "N queued" to UI.
  //
  // IMPORTANT: capture datasetId in closure. If the active dataset changes
  // while this fetch is in flight, the result must NOT be cached into the
  // new dataset's namespace. Without this guard, dataset A's slow analysis
  // finishing after user switched to dataset B would poison B's cache.
  const requestDatasetId = datasetId;
  const promise = enqueue<T>(k, fetcher)
    .then((result) => {
      if (activeDatasetId === requestDatasetId) {
        cache.set(k, result);
      }
      // Always remove from inflight — whether we kept the result or not
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

/** Cancel a pending fetch if it hasn't started yet. No-op if in-flight. */
export function cancelFetch(datasetId: string, path: string): boolean {
  const k = key(datasetId, path);
  const removed = cancelQueued(k);
  if (removed) inflight.delete(k);
  return removed;
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

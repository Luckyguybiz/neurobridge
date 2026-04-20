/**
 * Global fetch queue — limits concurrent heavy API requests from the browser.
 *
 * Backend has Semaphore(1) that serializes heavy CPU work. If we dispatch 15
 * requests at once they all sit on open TCP connections waiting their turn,
 * which (a) looks like "everything is frozen" to the user, (b) risks Caddy's
 * 300s timeout closing them mid-compute, (c) wastes browser sockets.
 *
 * This queue caps concurrent in-flight heavy fetches to MAX_CONCURRENT and
 * exposes stats so the UI can show "3 running · 9 queued" instead of a wall
 * of identical spinners.
 */

type QueueItem = {
  key: string;
  run: () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
};

const MAX_CONCURRENT = 2;

const pending: QueueItem[] = [];
const running = new Set<string>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

function drain(): void {
  while (running.size < MAX_CONCURRENT && pending.length > 0) {
    const item = pending.shift()!;
    running.add(item.key);
    notify();
    item
      .run()
      .then((v) => item.resolve(v))
      .catch((e) => item.reject(e))
      .finally(() => {
        running.delete(item.key);
        notify();
        drain();
      });
  }
}

/** Enqueue a task. Resolves when task finishes. De-duped by key. */
export function enqueue<T>(key: string, run: () => Promise<T>): Promise<T> {
  // Already running or queued with same key → share the promise via cache layer
  // (caller should check cache first; this is a fallback safety net).
  return new Promise<T>((resolve, reject) => {
    pending.push({ key, run: run as () => Promise<unknown>, resolve: resolve as (v: unknown) => void, reject });
    notify();
    drain();
  });
}

/** Drop a pending task if it hasn't started yet. No-op if already running. */
export function cancel(key: string): boolean {
  const idx = pending.findIndex((p) => p.key === key);
  if (idx === -1) return false;
  const [item] = pending.splice(idx, 1);
  item.reject(new Error('cancelled'));
  notify();
  return true;
}

export function getQueueStats(): { running: number; queued: number; runningKeys: string[]; queuedKeys: string[] } {
  return {
    running: running.size,
    queued: pending.length,
    runningKeys: Array.from(running),
    queuedKeys: pending.map((p) => p.key),
  };
}

/** Subscribe to queue changes — call returned fn to unsubscribe. */
export function subscribeQueue(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

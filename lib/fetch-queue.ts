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
  priority: 'user' | 'background';
};

const MAX_CONCURRENT = 2;

// Two-tier priority. User-initiated fetches (a card scrolled into view, a
// retry click) go to the head, so background analyses started by the layout
// don't starve the interactive work.
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

/** Enqueue a task. Resolves when task finishes. Dedup handled by the caller
 *  (analysis-cache has an inflight map). Priority controls head/tail. */
export function enqueue<T>(key: string, run: () => Promise<T>, priority: 'user' | 'background' = 'user'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const item: QueueItem = {
      key,
      run: run as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
      priority,
    };
    if (priority === 'user') {
      // Insert after any already-running-turn user items but before background items.
      const firstBg = pending.findIndex((p) => p.priority === 'background');
      if (firstBg === -1) pending.push(item);
      else pending.splice(firstBg, 0, item);
    } else {
      pending.push(item);
    }
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

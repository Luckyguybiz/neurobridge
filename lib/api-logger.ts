/**
 * API call logger — module-level singleton for tracking all API requests.
 * Used by DebugPanel to display live request status and export logs.
 */

export interface ApiLogEntry {
  id: string;
  method: string;
  path: string;
  status: 'pending' | 'success' | 'error';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  error?: string;
  httpStatus?: number;
}

type Listener = () => void;

const MAX_ENTRIES = 200;

let entries: ApiLogEntry[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function logStart(path: string, method = 'GET'): string {
  const id = `req-${nextId++}`;
  const entry: ApiLogEntry = {
    id,
    method,
    path,
    status: 'pending',
    startedAt: Date.now(),
  };
  entries.push(entry);
  // Ring buffer — drop oldest if over limit
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(-MAX_ENTRIES);
  }
  notify();
  return id;
}

export function logSuccess(id: string, httpStatus?: number) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.status = 'success';
  entry.completedAt = Date.now();
  entry.duration = entry.completedAt - entry.startedAt;
  entry.httpStatus = httpStatus;
  notify();
}

export function logError(id: string, error: string, httpStatus?: number) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.status = 'error';
  entry.completedAt = Date.now();
  entry.duration = entry.completedAt - entry.startedAt;
  entry.error = error;
  entry.httpStatus = httpStatus;
  notify();
}

export function getEntries(): readonly ApiLogEntry[] {
  return entries;
}

export function clearEntries() {
  entries = [];
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getSummary() {
  const total = entries.length;
  const pending = entries.filter((e) => e.status === 'pending').length;
  const success = entries.filter((e) => e.status === 'success').length;
  const errors = entries.filter((e) => e.status === 'error').length;
  const completed = entries.filter((e) => e.duration != null);
  const avgDuration = completed.length > 0
    ? completed.reduce((sum, e) => sum + (e.duration ?? 0), 0) / completed.length
    : 0;
  return { total, pending, success, errors, avgDuration };
}

export function exportJSON(): string {
  return JSON.stringify(entries, null, 2);
}

export function exportCSV(): string {
  const header = 'id,method,path,status,startedAt,completedAt,duration,httpStatus,error';
  const rows = entries.map((e) =>
    [e.id, e.method, e.path, e.status, e.startedAt, e.completedAt ?? '', e.duration ?? '', e.httpStatus ?? '', e.error ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadJSON() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neurobridge-api-logs-${new Date().toISOString().slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV() {
  const blob = new Blob([exportCSV()], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neurobridge-api-logs-${new Date().toISOString().slice(0, 19)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

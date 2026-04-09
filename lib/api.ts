/**
 * NeuroBridge API client — connects frontend dashboard to Python backend.
 */

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:8847`
  : 'http://localhost:8847';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Data Management ───

export async function generateDataset(params: {
  duration?: number;
  n_electrodes?: number;
  burst_probability?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.duration) q.set('duration', String(params.duration));
  if (params.n_electrodes) q.set('n_electrodes', String(params.n_electrodes));
  if (params.burst_probability) q.set('burst_probability', String(params.burst_probability));
  return apiFetch<{
    dataset_id: string;
    n_spikes: number;
    n_electrodes: number;
    duration_s: number;
  }>(`/api/generate?${q}`, { method: 'POST' });
}

export async function uploadDataset(file: File, samplingRate = 30000) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload?sampling_rate=${samplingRate}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function listDatasets() {
  return apiFetch<Record<string, { n_spikes: number; n_electrodes: number; duration_s: number }>>('/api/datasets');
}

export async function getSpikes(datasetId: string, params?: {
  start?: number;
  end?: number;
  electrodes?: number[];
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.start != null) q.set('start', String(params.start));
  if (params?.end != null) q.set('end', String(params.end));
  if (params?.electrodes) q.set('electrodes', params.electrodes.join(','));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiFetch<{
    times: number[];
    electrodes: number[];
    amplitudes: number[];
    n_total: number;
    n_returned: number;
    downsampled: boolean;
  }>(`/api/datasets/${datasetId}/spikes?${q}`);
}

// ─── Analysis ───

export async function getFullSummary(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/summary`);
}

export async function getQuality(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/quality`);
}

export async function getFiringRates(datasetId: string, binSize = 1.0) {
  return apiFetch<{
    bins: number[];
    rates: Record<string, number[]>;
    mean_rates: Record<string, number>;
  }>(`/api/analysis/${datasetId}/firing-rates?bin_size=${binSize}`);
}

export async function getISI(datasetId: string, electrode?: number) {
  const q = electrode != null ? `?electrode=${electrode}` : '';
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/isi${q}`);
}

export async function getBursts(datasetId: string, params?: {
  min_electrodes?: number;
  window_ms?: number;
}) {
  const q = new URLSearchParams();
  if (params?.min_electrodes) q.set('min_electrodes', String(params.min_electrodes));
  if (params?.window_ms) q.set('window_ms', String(params.window_ms));
  return apiFetch<{
    bursts: Array<{ start: number; end: number; n_electrodes: number; n_spikes: number; duration_ms: number }>;
    n_bursts: number;
    burst_rate_per_min: number;
    mean_duration_ms: number;
    total_burst_time_pct: number;
  }>(`/api/analysis/${datasetId}/bursts?${q}`);
}

export async function getConnectivity(datasetId: string) {
  return apiFetch<{
    nodes: Array<{ id: number; n_spikes: number; firing_rate_hz: number; degree: number; strength: number }>;
    edges: Array<{ source: number; target: number; weight: number }>;
    n_edges: number;
    density: number;
    mean_clustering: number;
  }>(`/api/analysis/${datasetId}/connectivity`);
}

export async function getCrossCorrelation(datasetId: string, maxLagMs = 50, binSizeMs = 1) {
  return apiFetch<Record<string, unknown>>(
    `/api/analysis/${datasetId}/cross-correlation?max_lag_ms=${maxLagMs}&bin_size_ms=${binSizeMs}`
  );
}

export async function getTransferEntropy(datasetId: string) {
  return apiFetch<{
    te_matrix: number[][];
    electrode_ids: number[];
    max_te_pair: { source: number; target: number; value: number };
    mean_te: number;
  }>(`/api/analysis/${datasetId}/transfer-entropy`);
}

export async function getTemporal(datasetId: string, binSize = 60) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/temporal?bin_size=${binSize}`);
}

export async function getAmplitudes(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/amplitudes`);
}

// ─── Export ───

export function getExportCSVUrl(datasetId: string) {
  return `${API_BASE}/api/export/${datasetId}/csv`;
}

export function getSwaggerUrl() {
  return `${API_BASE}/docs`;
}

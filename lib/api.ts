/**
 * Neurocomputers API client — connects frontend dashboard to Python backend.
 */

import { logStart, logSuccess, logError } from './api-logger';

const API_BASE = typeof window !== 'undefined'
  ? window.location.hostname === 'neurocomputers.io' || window.location.hostname === 'www.neurocomputers.io'
    ? 'https://api.neurocomputers.io'
    : `http://${window.location.hostname}:8847`
  : 'http://localhost:8847';

/** Map HTTP status + backend detail into a short, human-friendly message.
 *  Lets ChartCard show "Analysis ran out of time" instead of raw error blobs. */
function friendlyError(status: number, detail: string): string {
  if (status === 504) return 'Analysis ran longer than the 45s budget. Try again or switch to a smaller dataset (30s synthetic).';
  if (status === 503) return 'API is temporarily overloaded. Retry in a few seconds.';
  if (status === 429) return 'Rate limit reached. Wait a minute before retrying.';
  if (status === 413) return 'File too large (100MB max).';
  if (status === 410) return 'Your dataset was released to free memory. Reload the page to start a new session.';
  if (status === 404) return 'Dataset not found. Reload the page or pick a data source.';
  if (status === 0) return 'Network error — could not reach the API.';
  return detail || `API error ${status}`;
}

export async function apiFetchRaw<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const logId = logStart(path, method);
  let logged = false;
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = friendlyError(res.status, err.detail);
      logError(logId, msg, res.status);
      logged = true;
      throw new Error(msg);
    }
    logSuccess(logId, res.status);
    return res.json();
  } catch (e) {
    if (!logged && e instanceof Error) logError(logId, friendlyError(0, e.message));
    throw e;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const logId = logStart(path, method);
  let logged = false;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = friendlyError(res.status, err.detail);
      logError(logId, msg, res.status);
      logged = true;
      throw new Error(msg);
    }
    logSuccess(logId, res.status);
    return res.json();
  } catch (e) {
    if (!logged && e instanceof Error) logError(logId, friendlyError(0, e.message));
    throw e;
  }
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

export async function loadLocalDataset(filename: string, samplingRate = 437) {
  return apiFetch<{
    dataset_id: string;
    n_spikes: number;
    n_electrodes: number;
    duration_s: number;
  }>(`/api/load-local?filename=${encodeURIComponent(filename)}&sampling_rate=${samplingRate}`, {
    method: 'POST',
  });
}

export async function listLocalFiles() {
  return apiFetch<{ files: string[] }>('/api/local-files');
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

// ─── Advanced Analysis ───

export async function getOrganoidIQ(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/iq`);
}

export async function getSTDP(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/stdp`);
}

export async function getLearning(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/learning`);
}

export async function getAttractors(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/attractors`);
}

export async function getStateSpace(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/state-space`);
}

export async function getPhaseTransitions(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/phase-transitions`);
}

export async function getPredictiveCoding(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/predictive-coding`);
}

export async function getWeights(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/weights`);
}

export async function getWeightTracking(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/weight-tracking`);
}

export async function getEmergence(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/emergence`);
}

export async function getReplay(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/replay`);
}

export async function getSequences(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/sequences`);
}

export async function getMemoryCapacity(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/memory-capacity`);
}

export async function getFingerprint(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/fingerprint`);
}

export async function getAnomalies(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/anomalies`);
}

export async function getStates(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/states`);
}

export async function getPCA(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/pca`);
}

export async function getMultiscale(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/multiscale`);
}

export async function getHealth(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/health`);
}

export async function getPredictBursts(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/predict/bursts`);
}

export async function getFullReport(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/full-report`);
}

export async function getAvalanches(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/avalanches`);
}

export async function getEntropy(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/entropy`);
}

export async function getComplexity(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/complexity`);
}

// ─── Discovery Analysis (new modules) ───

export async function getSleepWake(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/sleep-wake`);
}

export async function getHabituation(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/habituation`);
}

export async function getMetastability(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/metastability`);
}

export async function getInformationFlow(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/information-flow`);
}

export async function getMotifs(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/motifs`);
}

export async function getEnergyLandscape(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/energy-landscape`);
}

export async function getConsciousness(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/consciousness`);
}

export async function getComparative(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/comparative`);
}

export async function getSuggestProtocol(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/suggest-protocol`);
}

export async function getEthics(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/ethics`);
}

// ─── Experiments ───

export async function runClosedLoop(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/experiments/${datasetId}/closed-loop`);
}

export async function runPong(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/experiments/${datasetId}/pong`);
}

export async function runLogicBenchmark(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/experiments/${datasetId}/xor`);
}

export async function runVowels(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/experiments/vowels/classify`);
}

export async function getMemoryTests(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/experiments/${datasetId}/memory`);
}

export async function getProtocols() {
  return apiFetch<Record<string, unknown>>('/api/protocols');
}

export async function getGrantMatch(datasetId?: string) {
  const path = datasetId ? `/api/funding/match/${datasetId}` : '/api/funding/match';
  return apiFetch<Record<string, unknown>>(path);
}

export async function generateDraft(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/publish/${datasetId}`, { method: 'POST' });
}

// ─── Extended Analysis ───

export async function getTuringTest(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/turing-test`);
}

export async function getWelfare(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/welfare`);
}

export async function getHomeostasis(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/homeostasis`);
}

export async function getSuffering(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/suffering`);
}

export async function getMorphology(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/morphology`);
}

export async function getSwarm(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/swarm`);
}

export async function getForgetting(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/forgetting`);
}

export async function getTransferLearning(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/transfer`);
}

export async function getConsolidation(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/consolidation`);
}

export async function getChannelCapacity(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/channel-capacity`);
}

export async function getTopology(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/topology`);
}

export async function getConnectome(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/connectome`);
}

export async function getCommunities(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/communities`);
}

export async function getGraphTheory(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/graph-theory`);
}

export async function getEffectiveConnectivity(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/effective-connectivity`);
}

export async function getCausalHierarchy(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/causal-hierarchy`);
}

export async function getHybridBenchmark(datasetId: string) {
  return apiFetch<Record<string, unknown>>(`/api/analysis/${datasetId}/hybrid-benchmark`);
}

// ─── Export ───

export function getExportCSVUrl(datasetId: string) {
  return `${API_BASE}/api/export/${datasetId}/csv`;
}

export function getSwaggerUrl() {
  return `${API_BASE}/docs`;
}

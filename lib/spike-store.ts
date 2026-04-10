/**
 * Server-side spike data store.
 * Parses CSV files, caches in memory, provides analysis functions.
 * Used by Next.js API route handlers.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredDataset {
  id: string;
  filename: string;
  times: Float64Array;
  electrodes: Int32Array;
  amplitudes: Float64Array;
  nSpikes: number;
  nElectrodes: number;
  electrodeIds: number[];
  duration: number;        // seconds
  samplingRate: number;
}

interface DatasetMeta {
  dataset_id: string;
  n_spikes: number;
  n_electrodes: number;
  duration_s: number;
}

// ─── Global cache (persists across requests in dev) ──────────────────────────

const g = globalThis as unknown as { __spikeStore?: Map<string, StoredDataset> };
if (!g.__spikeStore) g.__spikeStore = new Map();
const store = g.__spikeStore;

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCSVFile(filePath: string, samplingRate: number): StoredDataset {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  const dataLines: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length > 5) dataLines.push(lines[i]);
  }
  const n = dataLines.length;

  const times = new Float64Array(n);
  const electrodes = new Int32Array(n);
  const amplitudes = new Float64Array(n);
  const electrodeSet = new Set<number>();

  // Parse first line to get base timestamp
  const firstParts = dataLines[0].split(',');
  const baseTime = new Date(firstParts[1]).getTime() / 1000;

  for (let i = 0; i < n; i++) {
    const line = dataLines[i];
    // Fast CSV split: ,_time,_value,index
    const c1 = line.indexOf(',');
    const c2 = line.indexOf(',', c1 + 1);
    const c3 = line.indexOf(',', c2 + 1);

    const timeStr = line.substring(c1 + 1, c2);
    const valStr = line.substring(c2 + 1, c3);
    const elStr = line.substring(c3 + 1).trim();

    times[i] = new Date(timeStr).getTime() / 1000 - baseTime;
    amplitudes[i] = parseFloat(valStr);
    const el = parseInt(elStr);
    electrodes[i] = el;
    electrodeSet.add(el);
  }

  const electrodeIds = Array.from(electrodeSet).sort((a, b) => a - b);
  const id = 'fs437-' + Date.now().toString(36);

  return {
    id,
    filename: filePath.split('/').pop() || 'unknown',
    times,
    electrodes,
    amplitudes,
    nSpikes: n,
    nElectrodes: electrodeIds.length,
    electrodeIds,
    duration: times[n - 1],
    samplingRate,
  };
}

// ─── Store API ───────────────────────────────────────────────────────────────

export function loadLocalCSV(filename: string, samplingRate = 437): DatasetMeta {
  // Check if already loaded
  for (const [, ds] of store) {
    if (ds.filename === filename) {
      return { dataset_id: ds.id, n_spikes: ds.nSpikes, n_electrodes: ds.nElectrodes, duration_s: ds.duration };
    }
  }

  const filePath = join(process.cwd(), 'data', filename);
  if (!existsSync(filePath)) {
    throw new Error(`File not found: data/${filename}`);
  }

  const ds = parseCSVFile(filePath, samplingRate);
  store.set(ds.id, ds);
  return { dataset_id: ds.id, n_spikes: ds.nSpikes, n_electrodes: ds.nElectrodes, duration_s: ds.duration };
}

export function loadUploadedCSV(content: string, filename: string, samplingRate = 437): DatasetMeta {
  const lines = content.split('\n');
  const dataLines: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length > 5) dataLines.push(lines[i]);
  }
  const n = dataLines.length;

  const times = new Float64Array(n);
  const electrodes = new Int32Array(n);
  const amplitudes = new Float64Array(n);
  const electrodeSet = new Set<number>();

  const firstParts = dataLines[0].split(',');
  const baseTime = new Date(firstParts[1]).getTime() / 1000;

  for (let i = 0; i < n; i++) {
    const line = dataLines[i];
    const c1 = line.indexOf(',');
    const c2 = line.indexOf(',', c1 + 1);
    const c3 = line.indexOf(',', c2 + 1);
    times[i] = new Date(line.substring(c1 + 1, c2)).getTime() / 1000 - baseTime;
    amplitudes[i] = parseFloat(line.substring(c2 + 1, c3));
    const el = parseInt(line.substring(c3 + 1).trim());
    electrodes[i] = el;
    electrodeSet.add(el);
  }

  const electrodeIds = Array.from(electrodeSet).sort((a, b) => a - b);
  const id = 'upload-' + Date.now().toString(36);

  const ds: StoredDataset = {
    id, filename, times, electrodes, amplitudes,
    nSpikes: n, nElectrodes: electrodeIds.length, electrodeIds,
    duration: times[n - 1], samplingRate,
  };
  store.set(id, ds);
  return { dataset_id: id, n_spikes: n, n_electrodes: electrodeIds.length, duration_s: ds.duration };
}

export function getDataset(id: string): StoredDataset | undefined {
  return store.get(id);
}

export function listDatasets(): Record<string, { n_spikes: number; n_electrodes: number; duration_s: number }> {
  const result: Record<string, { n_spikes: number; n_electrodes: number; duration_s: number }> = {};
  for (const [id, ds] of store) {
    result[id] = { n_spikes: ds.nSpikes, n_electrodes: ds.nElectrodes, duration_s: ds.duration };
  }
  return result;
}

// ─── Analysis: Spikes ────────────────────────────────────────────────────────

export function getSpikes(id: string, params: {
  start?: number; end?: number; electrodes?: number[]; limit?: number;
}) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  const { start, end, electrodes: elFilter, limit = 15000 } = params;
  const indices: number[] = [];

  for (let i = 0; i < ds.nSpikes; i++) {
    if (start != null && ds.times[i] < start) continue;
    if (end != null && ds.times[i] > end) continue;
    if (elFilter && !elFilter.includes(ds.electrodes[i])) continue;
    indices.push(i);
  }

  const total = indices.length;
  let selected = indices;
  let downsampled = false;

  if (selected.length > limit) {
    // Uniform downsampling
    const step = selected.length / limit;
    const sampled: number[] = [];
    for (let i = 0; i < limit; i++) {
      sampled.push(selected[Math.floor(i * step)]);
    }
    selected = sampled;
    downsampled = true;
  }

  return {
    times: selected.map(i => ds.times[i]),
    electrodes: selected.map(i => ds.electrodes[i]),
    amplitudes: selected.map(i => ds.amplitudes[i]),
    n_total: total,
    n_returned: selected.length,
    downsampled,
  };
}

// ─── Analysis: Summary ───────────────────────────────────────────────────────

export function getSummary(id: string) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  // Per-electrode stats
  const elCounts: Record<number, number> = {};
  const elAmps: Record<number, number[]> = {};
  for (let i = 0; i < ds.nSpikes; i++) {
    const el = ds.electrodes[i];
    elCounts[el] = (elCounts[el] || 0) + 1;
    if (!elAmps[el]) elAmps[el] = [];
    elAmps[el].push(ds.amplitudes[i]);
  }

  const meanRate = ds.duration > 0 ? ds.nSpikes / ds.duration : 0;
  const allAmps = Array.from(ds.amplitudes);
  const meanAmp = allAmps.reduce((s, v) => s + v, 0) / allAmps.length;
  const absAmps = allAmps.map(Math.abs);
  const meanAbsAmp = absAmps.reduce((s, v) => s + v, 0) / absAmps.length;

  const perElectrode: Record<string, unknown>[] = ds.electrodeIds.map(el => {
    const count = elCounts[el] || 0;
    const amps = elAmps[el] || [];
    const rate = ds.duration > 0 ? count / ds.duration : 0;
    const mAmp = amps.length > 0 ? amps.reduce((s, v) => s + v, 0) / amps.length : 0;
    return { electrode: el, n_spikes: count, firing_rate_hz: parseFloat(rate.toFixed(4)), mean_amplitude: parseFloat(mAmp.toFixed(2)) };
  });

  return {
    dataset: {
      dataset_id: ds.id,
      n_spikes: ds.nSpikes,
      n_electrodes: ds.nElectrodes,
      duration_s: parseFloat(ds.duration.toFixed(2)),
      sampling_rate: ds.samplingRate,
    },
    population: {
      total_spikes: ds.nSpikes,
      mean_firing_rate_hz: parseFloat(meanRate.toFixed(4)),
      mean_amplitude: parseFloat(meanAmp.toFixed(2)),
      mean_abs_amplitude: parseFloat(meanAbsAmp.toFixed(2)),
    },
    per_electrode: perElectrode,
  };
}

// ─── Analysis: Firing Rates ──────────────────────────────────────────────────

export function getFiringRates(id: string, binSize = 1.0) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  const nBins = Math.ceil(ds.duration / binSize);
  // Cap bins for very long recordings
  const maxBins = 3600; // 1 hour worth of 1s bins
  const effectiveBinSize = nBins > maxBins ? ds.duration / maxBins : binSize;
  const effectiveNBins = Math.min(nBins, maxBins);

  const bins: number[] = [];
  for (let i = 0; i < effectiveNBins; i++) {
    bins.push(parseFloat((i * effectiveBinSize).toFixed(2)));
  }

  const rates: Record<string, number[]> = {};
  const counts: Record<string, number[]> = {};
  for (const el of ds.electrodeIds) {
    counts[el] = new Array(effectiveNBins).fill(0);
  }

  for (let i = 0; i < ds.nSpikes; i++) {
    const bin = Math.min(Math.floor(ds.times[i] / effectiveBinSize), effectiveNBins - 1);
    const el = ds.electrodes[i];
    if (counts[el]) counts[el][bin]++;
  }

  const meanRates: Record<string, number> = {};
  for (const el of ds.electrodeIds) {
    rates[el] = counts[el].map(c => parseFloat((c / effectiveBinSize).toFixed(4)));
    const total = counts[el].reduce((s, v) => s + v, 0);
    meanRates[el] = parseFloat((total / ds.duration).toFixed(4));
  }

  return { bins, rates, mean_rates: meanRates };
}

// ─── Analysis: Bursts ────────────────────────────────────────────────────────

export function getBursts(id: string, minElectrodes = 4, windowMs = 100) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  const windowSec = windowMs / 1000;
  const bursts: Array<{ start: number; end: number; n_electrodes: number; n_spikes: number; duration_ms: number }> = [];

  // Sliding window burst detection
  // For very large datasets, sample every Nth spike
  const step = ds.nSpikes > 500000 ? Math.floor(ds.nSpikes / 500000) : 1;

  let i = 0;
  while (i < ds.nSpikes) {
    const tStart = ds.times[i];
    const tEnd = tStart + windowSec;
    const electrodesInWindow = new Set<number>();
    let spikesInWindow = 0;
    let lastTime = tStart;

    let j = i;
    while (j < ds.nSpikes && ds.times[j] <= tEnd) {
      electrodesInWindow.add(ds.electrodes[j]);
      spikesInWindow++;
      if (ds.times[j] > lastTime) lastTime = ds.times[j];
      j++;
    }

    if (electrodesInWindow.size >= minElectrodes) {
      const burstDur = (lastTime - tStart) * 1000;
      bursts.push({
        start: parseFloat(tStart.toFixed(4)),
        end: parseFloat(lastTime.toFixed(4)),
        n_electrodes: electrodesInWindow.size,
        n_spikes: spikesInWindow,
        duration_ms: parseFloat(burstDur.toFixed(2)),
      });
      i = j; // skip past this burst
    } else {
      i += step;
    }
  }

  const totalBurstTime = bursts.reduce((s, b) => s + b.duration_ms, 0) / 1000;
  const meanDuration = bursts.length > 0
    ? bursts.reduce((s, b) => s + b.duration_ms, 0) / bursts.length
    : 0;

  return {
    bursts: bursts.slice(0, 500), // cap returned bursts
    n_bursts: bursts.length,
    burst_rate_per_min: ds.duration > 0 ? parseFloat((bursts.length / (ds.duration / 60)).toFixed(4)) : 0,
    mean_duration_ms: parseFloat(meanDuration.toFixed(2)),
    total_burst_time_pct: ds.duration > 0 ? parseFloat((totalBurstTime / ds.duration * 100).toFixed(2)) : 0,
  };
}

// ─── Analysis: ISI ───────────────────────────────────────────────────────────

export function getISI(id: string, electrode?: number) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  const result: Record<string, { intervals: number[]; mean_ms: number; median_ms: number; cv: number }> = {};

  const targetElectrodes = electrode != null ? [electrode] : ds.electrodeIds;

  for (const el of targetElectrodes) {
    const spikeTimes: number[] = [];
    for (let i = 0; i < ds.nSpikes; i++) {
      if (ds.electrodes[i] === el) spikeTimes.push(ds.times[i]);
    }

    const intervals: number[] = [];
    for (let i = 1; i < spikeTimes.length; i++) {
      intervals.push((spikeTimes[i] - spikeTimes[i - 1]) * 1000); // ms
    }

    if (intervals.length === 0) {
      result[el] = { intervals: [], mean_ms: 0, median_ms: 0, cv: 0 };
      continue;
    }

    const sorted = [...intervals].sort((a, b) => a - b);
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? std / mean : 0;

    // Return only a sample of intervals for histogram (cap at 2000)
    const sampleStep = intervals.length > 2000 ? Math.floor(intervals.length / 2000) : 1;
    const sampled = intervals.filter((_, i) => i % sampleStep === 0);

    result[el] = {
      intervals: sampled.map(v => parseFloat(v.toFixed(3))),
      mean_ms: parseFloat(mean.toFixed(3)),
      median_ms: parseFloat(median.toFixed(3)),
      cv: parseFloat(cv.toFixed(4)),
    };
  }

  return result;
}

// ─── Analysis: Connectivity ──────────────────────────────────────────────────

export function getConnectivity(id: string) {
  const ds = store.get(id);
  if (!ds) throw new Error('Dataset not found');

  const windowSec = 0.01; // 10ms co-firing window
  const pairCounts = new Map<string, number>();

  // Sample for large datasets
  const step = ds.nSpikes > 200000 ? Math.floor(ds.nSpikes / 200000) : 1;

  for (let i = 0; i < ds.nSpikes; i += step) {
    const t = ds.times[i];
    const e1 = ds.electrodes[i];
    for (let j = i + 1; j < ds.nSpikes && ds.times[j] - t <= windowSec; j++) {
      const e2 = ds.electrodes[j];
      if (e1 !== e2) {
        const key = e1 < e2 ? `${e1}-${e2}` : `${e2}-${e1}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }

  // Build nodes
  const elCounts: Record<number, number> = {};
  for (let i = 0; i < ds.nSpikes; i++) {
    elCounts[ds.electrodes[i]] = (elCounts[ds.electrodes[i]] || 0) + 1;
  }

  const maxPairCount = Math.max(1, ...pairCounts.values());
  const edges: Array<{ source: number; target: number; weight: number }> = [];
  const degree: Record<number, number> = {};
  const strength: Record<number, number> = {};

  for (const [key, count] of pairCounts) {
    const w = count / maxPairCount;
    if (w < 0.02) continue;
    const [s, t] = key.split('-').map(Number);
    edges.push({ source: s, target: t, weight: parseFloat(w.toFixed(4)) });
    degree[s] = (degree[s] || 0) + 1;
    degree[t] = (degree[t] || 0) + 1;
    strength[s] = (strength[s] || 0) + w;
    strength[t] = (strength[t] || 0) + w;
  }

  const nodes = ds.electrodeIds.map(el => ({
    id: el,
    n_spikes: elCounts[el] || 0,
    firing_rate_hz: parseFloat(((elCounts[el] || 0) / ds.duration).toFixed(4)),
    degree: degree[el] || 0,
    strength: parseFloat((strength[el] || 0).toFixed(4)),
  }));

  const maxEdges = ds.nElectrodes * (ds.nElectrodes - 1) / 2;

  return {
    nodes,
    edges,
    n_edges: edges.length,
    density: maxEdges > 0 ? parseFloat((edges.length / maxEdges).toFixed(4)) : 0,
    mean_clustering: 0,
  };
}

// ─── Synthetic Data Generator ────────────────────────────────────────────────

export function generateSynthetic(durationSec = 30, nElectrodes = 8, burstProb = 0.15): DatasetMeta {
  const id = 'synth-' + Date.now().toString(36);
  const baseRates = Array.from({ length: nElectrodes }, () => 2 + Math.random() * 13);

  const allTimes: number[] = [];
  const allElectrodes: number[] = [];
  const allAmplitudes: number[] = [];

  // Poisson spikes per electrode
  for (let e = 0; e < nElectrodes; e++) {
    let t = -Math.log(1 - Math.random()) / baseRates[e];
    while (t < durationSec) {
      allTimes.push(t);
      allElectrodes.push(e);
      allAmplitudes.push(-(60 + Math.random() * 140));
      t += -Math.log(1 - Math.random()) / baseRates[e];
    }
  }

  // Network bursts
  const numBursts = Math.floor(durationSec * burstProb);
  for (let b = 0; b < numBursts; b++) {
    const burstTime = Math.random() * durationSec;
    const burstElectrodes = Math.floor(3 + Math.random() * (nElectrodes - 3));
    const electrodeSet = new Set<number>();
    while (electrodeSet.size < burstElectrodes) {
      electrodeSet.add(Math.floor(Math.random() * nElectrodes));
    }
    for (const e of electrodeSet) {
      const numBurstSpikes = 3 + Math.floor(Math.random() * 5);
      for (let s = 0; s < numBurstSpikes; s++) {
        const t = burstTime + (Math.random() - 0.5) * 0.05;
        if (t >= 0 && t < durationSec) {
          allTimes.push(t);
          allElectrodes.push(e);
          allAmplitudes.push(-(100 + Math.random() * 100));
        }
      }
    }
  }

  // Sort by time
  const indices = allTimes.map((_, i) => i).sort((a, b) => allTimes[a] - allTimes[b]);
  const n = indices.length;
  const times = new Float64Array(n);
  const electrodes = new Int32Array(n);
  const amplitudes = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    times[i] = allTimes[indices[i]];
    electrodes[i] = allElectrodes[indices[i]];
    amplitudes[i] = allAmplitudes[indices[i]];
  }

  const electrodeIds = Array.from({ length: nElectrodes }, (_, i) => i);

  store.set(id, {
    id, filename: 'synthetic', times, electrodes, amplitudes,
    nSpikes: n, nElectrodes, electrodeIds,
    duration: durationSec, samplingRate: 30000,
  });

  return { dataset_id: id, n_spikes: n, n_electrodes: nElectrodes, duration_s: durationSec };
}

// ─── List local CSV files ────────────────────────────────────────────────────

export function listLocalFiles(): string[] {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) return [];
  const { readdirSync } = require('fs');
  return (readdirSync(dataDir) as string[]).filter((f: string) => f.endsWith('.csv'));
}

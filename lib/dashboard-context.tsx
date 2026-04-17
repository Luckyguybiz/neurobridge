'use client';

import { createContext, useContext } from 'react';
import type { Spike } from './types';

export type DashboardStatus = 'idle' | 'loading' | 'ready' | 'error';

export type DatasetSource = 'synthetic-30' | 'synthetic-120' | 'finalspark' | 'fs437' | 'upload' | null;

export interface BurstInfo {
  n_bursts: number;
  burst_rate_per_min: number;
  mean_duration_ms: number;
  total_burst_time_pct: number;
}

export interface LiveSpike {
  time: number;
  electrode: number;
  amplitude: number;
}

export interface LiveState {
  connected: boolean;
  paused: boolean;
  spikeCount: number;
  elapsed: number;
  spikes: LiveSpike[];
  rates: number[];
}

/** Cached analysis results — fetched once per dataset, persist across page navigation */
export interface CachedAnalysis {
  iq: Record<string, unknown> | null | undefined;          // undefined = loading
  health: Record<string, unknown> | null | undefined;
  consciousness: Record<string, unknown> | null | undefined;
}

export interface DashboardContextValue {
  datasetId: string | null;
  datasetSource: DatasetSource;
  loadingStep: string;
  spikes: Spike[];
  duration: number;
  nElectrodes: number;
  summary: Record<string, unknown> | null;
  burstInfo: BurstInfo | null;
  cached: CachedAnalysis;
  status: DashboardStatus;
  error: string;
  elapsed: number;
  generateData: (dur?: number, electrodes?: number, burstProb?: number) => Promise<void>;
  uploadData: (file: File) => Promise<void>;
  loadLocalData: (filename: string) => Promise<void>;
  // Live WebSocket
  live: LiveState;
  liveConnect: () => void;
  livePause: () => void;
  liveResume: () => void;
  liveDisconnect: () => void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardLayout');
  return ctx;
}

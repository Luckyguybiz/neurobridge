'use client';

import { createContext, useContext } from 'react';
import type { Spike } from './types';

export type DashboardStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BurstInfo {
  n_bursts: number;
  burst_rate_per_min: number;
  mean_duration_ms: number;
  total_burst_time_pct: number;
}

export interface DashboardContextValue {
  datasetId: string | null;
  spikes: Spike[];
  duration: number;
  nElectrodes: number;
  summary: Record<string, unknown> | null;
  burstInfo: BurstInfo | null;
  status: DashboardStatus;
  error: string;
  elapsed: number;
  generateData: (dur?: number, electrodes?: number, burstProb?: number) => Promise<void>;
  uploadData: (file: File) => Promise<void>;
  loadLocalData: (filename: string) => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardLayout');
  return ctx;
}

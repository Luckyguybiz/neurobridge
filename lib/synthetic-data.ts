import type { Spike, OrganoidData } from './types';

function poissonNext(rate: number): number {
  return -Math.log(1 - Math.random()) / rate;
}

const WAVEFORM_CACHE: number[][] = [];

function generateWaveform(): number[] {
  // Cache 50 templates, pick randomly with jitter
  if (WAVEFORM_CACHE.length < 50) {
    const samples = 90;
    const waveform: number[] = [];
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const mainPeak = -Math.exp(-((t - 0.3) ** 2) / 0.005) * (0.85 + Math.random() * 0.3);
      const rebound = Math.exp(-((t - 0.55) ** 2) / 0.008) * (0.25 + Math.random() * 0.15);
      const noise = (Math.random() - 0.5) * 0.05;
      waveform.push(mainPeak + rebound + noise);
    }
    WAVEFORM_CACHE.push(waveform);
    return waveform;
  }
  const base = WAVEFORM_CACHE[Math.floor(Math.random() * WAVEFORM_CACHE.length)];
  return base.map((v) => v * (0.9 + Math.random() * 0.2));
}

export function generateSyntheticData(durationSec = 60, numElectrodes = 8): OrganoidData {
  const spikes: Spike[] = [];
  const baseRates = Array.from({ length: numElectrodes }, () => 2 + Math.random() * 13);

  // Generate spikes per electrode via Poisson process
  for (let e = 0; e < numElectrodes; e++) {
    let t = poissonNext(baseRates[e]);
    while (t < durationSec) {
      const amplitude = -(60 + Math.random() * 140);
      spikes.push({
        time: t,
        electrode: e,
        amplitude,
        waveform: generateWaveform().map((v) => v * amplitude),
      });
      t += poissonNext(baseRates[e]);
    }
  }

  // Inject network bursts: 10-20% of recording
  const numBursts = Math.floor(durationSec * 0.15);
  for (let b = 0; b < numBursts; b++) {
    const burstTime = Math.random() * durationSec;
    const burstElectrodes = Math.floor(3 + Math.random() * (numElectrodes - 3));
    const electrodeSet = new Set<number>();
    while (electrodeSet.size < burstElectrodes) {
      electrodeSet.add(Math.floor(Math.random() * numElectrodes));
    }
    for (const e of electrodeSet) {
      const numBurstSpikes = 3 + Math.floor(Math.random() * 5);
      for (let s = 0; s < numBurstSpikes; s++) {
        const t = burstTime + (Math.random() - 0.5) * 0.05;
        if (t >= 0 && t < durationSec) {
          const amplitude = -(100 + Math.random() * 100);
          spikes.push({
            time: t,
            electrode: e,
            amplitude,
            waveform: generateWaveform().map((v) => v * amplitude),
          });
        }
      }
    }
  }

  spikes.sort((a, b) => a.time - b.time);

  return {
    id: `organoid-${Math.random().toString(36).slice(2, 8)}`,
    electrodes: numElectrodes,
    samplingRate: 30000,
    duration: durationSec,
    spikes,
    metadata: {
      organoidAge: 45 + Math.floor(Math.random() * 60),
      meaId: Math.floor(Math.random() * 4),
      temperature: 36.8 + Math.random() * 0.4,
    },
  };
}

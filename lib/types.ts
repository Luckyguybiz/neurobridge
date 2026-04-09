export interface Spike {
  time: number;
  electrode: number;
  amplitude: number;
  waveform: number[];
}

export interface OrganoidData {
  id: string;
  electrodes: number;
  samplingRate: number;
  duration: number;
  spikes: Spike[];
  metadata: {
    organoidAge: number;
    meaId: number;
    temperature: number;
  };
}

export interface ElectrodePosition {
  x: number;
  y: number;
  label: string;
}

import { NextRequest, NextResponse } from 'next/server';
import { generateSynthetic } from '@/lib/spike-store';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const duration = Number(url.searchParams.get('duration') || 30);
  const nElectrodes = Number(url.searchParams.get('n_electrodes') || 8);
  const burstProb = Number(url.searchParams.get('burst_probability') || 0.15);

  const result = generateSynthetic(duration, nElectrodes, burstProb);
  return NextResponse.json(result);
}

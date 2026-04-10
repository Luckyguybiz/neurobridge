import { NextRequest, NextResponse } from 'next/server';
import { getBursts } from '@/lib/spike-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const minElectrodes = Number(url.searchParams.get('min_electrodes') || 4);
  const windowMs = Number(url.searchParams.get('window_ms') || 100);

  try {
    return NextResponse.json(getBursts(id, minElectrodes, windowMs));
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 404 });
  }
}

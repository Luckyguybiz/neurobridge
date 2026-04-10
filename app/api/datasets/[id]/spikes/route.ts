import { NextRequest, NextResponse } from 'next/server';
import { getSpikes } from '@/lib/spike-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const start = url.searchParams.get('start') ? Number(url.searchParams.get('start')) : undefined;
  const end = url.searchParams.get('end') ? Number(url.searchParams.get('end')) : undefined;
  const electrodes = url.searchParams.get('electrodes')
    ? url.searchParams.get('electrodes')!.split(',').map(Number)
    : undefined;
  const limit = Number(url.searchParams.get('limit') || 15000);

  try {
    const result = getSpikes(id, { start, end, electrodes, limit });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 404 });
  }
}

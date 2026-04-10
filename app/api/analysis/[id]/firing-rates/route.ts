import { NextRequest, NextResponse } from 'next/server';
import { getFiringRates } from '@/lib/spike-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const binSize = Number(url.searchParams.get('bin_size') || 1);

  try {
    return NextResponse.json(getFiringRates(id, binSize));
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 404 });
  }
}

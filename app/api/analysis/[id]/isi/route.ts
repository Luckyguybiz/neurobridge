import { NextRequest, NextResponse } from 'next/server';
import { getISI } from '@/lib/spike-store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const electrode = url.searchParams.get('electrode') ? Number(url.searchParams.get('electrode')) : undefined;

  try {
    return NextResponse.json(getISI(id, electrode));
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 404 });
  }
}

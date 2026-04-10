import { NextRequest, NextResponse } from 'next/server';
import { getSummary } from '@/lib/spike-store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(getSummary(id));
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 404 });
  }
}

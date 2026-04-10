import { NextRequest, NextResponse } from 'next/server';
import { loadLocalCSV } from '@/lib/spike-store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const filename = body.filename as string;
  const samplingRate = (body.sampling_rate as number) || 437;

  if (!filename) {
    return NextResponse.json({ detail: 'filename is required' }, { status: 400 });
  }

  try {
    const result = loadLocalCSV(filename, samplingRate);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ detail: (e as Error).message }, { status: 500 });
  }
}

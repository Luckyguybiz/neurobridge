import { NextRequest, NextResponse } from 'next/server';
import { loadUploadedCSV } from '@/lib/spike-store';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const samplingRate = Number(url.searchParams.get('sampling_rate') || 437);

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ detail: 'No file provided' }, { status: 400 });
  }

  const text = await file.text();
  const result = loadUploadedCSV(text, file.name, samplingRate);
  return NextResponse.json(result);
}

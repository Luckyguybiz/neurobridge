import { NextResponse } from 'next/server';
import { listDatasets } from '@/lib/spike-store';

export async function GET() {
  return NextResponse.json(listDatasets());
}

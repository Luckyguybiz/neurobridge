import { NextResponse } from 'next/server';
import { listLocalFiles } from '@/lib/spike-store';

export async function GET() {
  return NextResponse.json({ files: listLocalFiles() });
}

import { NextResponse } from 'next/server';
import { loadPublicBearSchedule } from '../../../lib/publicBearSchedule';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return NextResponse.json({ alliances: await loadPublicBearSchedule() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Bear Hunt schedule load failed', error);
    return NextResponse.json({ error: 'Bear Hunt times are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

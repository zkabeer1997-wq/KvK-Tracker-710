import { NextResponse } from 'next/server';
import { loadPublicAllianceEvents } from '../../../lib/publicAllianceEvents';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ events: await loadPublicAllianceEvents() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Alliance events are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

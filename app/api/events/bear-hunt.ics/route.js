import { NextResponse } from 'next/server';
import { huntsFromAlliances } from '../../../../lib/bearHuntSchedule';
import { loadPublicBearSchedule } from '../../../../lib/publicBearSchedule';
import { buildIcsCalendar } from '../../../../lib/ics';

// A daily-recurring calendar subscription for the real Bear Hunt windows -
// arguably more useful day-to-day than any single one-off event's ICS,
// since this is the schedule K710 actually runs on every day. One VEVENT
// per window with RRULE:FREQ=DAILY; no recurrence library needed since
// ICS natively expresses "every day at this UTC time."
export const dynamic = 'force-dynamic';

function nextOccurrence(utcHHMM) {
  const now = new Date();
  const [h, m] = utcHHMM.split(':').map(Number);
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function GET() {
  let alliances;
  try { alliances = await loadPublicBearSchedule(); }
  catch (error) {
    console.error('Bear Hunt calendar load failed', error);
    return NextResponse.json({ error: 'The Bear Hunt calendar is temporarily unavailable.' }, { status: 503 });
  }
  const events = huntsFromAlliances(alliances)
    .map((hunt) => ({
      uid: `bear-hunt-${hunt.band}-${hunt.utc.replace(':', '')}@k710hub`,
      start: nextOccurrence(hunt.utc),
      rrule: 'FREQ=DAILY',
      summary: `Bear Hunt — ${hunt.band} (${hunt.utc} UTC)`,
      description: `Kingdom 710 ${hunt.band} alliance Bear Hunt window, daily at ${hunt.utc} UTC.`,
    }));

  const ics = buildIcsCalendar({ name: 'K710 Bear Hunt Schedule', events });

  return new NextResponse(ics, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="k710-bear-hunt.ics"',
    },
  });
}

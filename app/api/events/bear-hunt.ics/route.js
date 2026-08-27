import { NextResponse } from 'next/server';
import { HUNTS, toMinutes } from '../../../../lib/bearHuntSchedule';
import { buildIcsCalendar } from '../../../../lib/ics';

// A daily-recurring calendar subscription for the real Bear Hunt windows -
// arguably more useful day-to-day than any single one-off event's ICS,
// since this is the schedule K710 actually runs on every day. One VEVENT
// per window with RRULE:FREQ=DAILY; no recurrence library needed since
// ICS natively expresses "every day at this UTC time."
export const dynamic = 'force-static';

function nextOccurrence(utcHHMM) {
  const now = new Date();
  const [h, m] = utcHHMM.split(':').map(Number);
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export async function GET() {
  const events = [...HUNTS]
    .sort((a, b) => toMinutes(a.utc) - toMinutes(b.utc))
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
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="k710-bear-hunt.ics"',
    },
  });
}

'use client';

import { useEffect, useState } from 'react';
import { nextEventOccurrence, recurrenceLabel } from '../../lib/eventRecurrence.mjs';

export default function EventSchedule({ event }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const recurring = event.recurrence_frequency && event.recurrence_frequency !== 'none';
  const occurrence = now === null ? null : nextEventOccurrence(event, now);
  const displayed = recurring ? occurrence : event;
  const format = value => new Date(value).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
  return (
    <div className="event-when">
      {recurring && <p>{recurrenceLabel(event)} · UTC schedule</p>}
      {now === null ? <p>Loading event times…</p> : displayed ? (
        <p>{recurring ? 'Current or next occurrence: ' : ''}{format(displayed.starts_at)}{displayed.ends_at ? ` – ${format(displayed.ends_at)}` : ''}</p>
      ) : <p>This recurring series has ended.</p>}
    </div>
  );
}

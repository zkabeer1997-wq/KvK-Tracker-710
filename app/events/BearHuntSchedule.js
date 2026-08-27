'use client';

import { useEffect, useState } from 'react';
import { HUNTS, toMinutes } from '../../lib/bearHuntSchedule';

// Renders the real Bear Hunt windows in the VIEWER's local time, not UTC -
// kingdom846.com's events page is UTC-only, real friction for a kingdom
// with members across every timezone. Server-rendered fallback shows UTC
// (so there's real content before hydration); once mounted, each row
// re-renders in the browser's own timezone.
export default function BearHuntSchedule() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sorted = [...HUNTS].sort((a, b) => toMinutes(a.utc) - toMinutes(b.utc));

  return (
    <div className="events-hunts">
      <table className="ui-table">
        <thead>
          <tr>
            <th>Alliance</th>
            <th>{mounted ? 'Your local time' : 'UTC'}</th>
            {mounted && <th>UTC</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((hunt) => {
            const [h, m] = hunt.utc.split(':').map(Number);
            const today = new Date();
            const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), h, m));
            const localLabel = mounted
              ? utcDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              : `${hunt.utc} UTC`;
            return (
              <tr key={`${hunt.band}-${hunt.utc}`}>
                <td>
                  <span className="ui-tag" data-band={hunt.band}>{hunt.band}</span>
                </td>
                <td>{localLabel}</td>
                {mounted && <td className="events-hunts-utc">{hunt.utc} UTC</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <a href="/api/events/bear-hunt.ics" className="events-ics-link" download>
        📅 Subscribe to Bear Hunt schedule (.ics)
      </a>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KIND_LABEL = {
  kvk: 'KvK',
  championship: 'Championship',
  swordland: 'Swordland',
  custom: 'Kingdom Event',
};

function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function splitDuration(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

function formatRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  const optsDate = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const optsTime = { hour: '2-digit', minute: '2-digit' };
  const startDate = start.toLocaleDateString(undefined, optsDate);
  const startTime = start.toLocaleTimeString(undefined, optsTime);
  if (!endsAt) {
    return { local: `${startDate} · ${startTime}`, utc: `${start.toISOString().slice(0, 16).replace('T', ' ')} UTC` };
  }
  const end = new Date(endsAt);
  const endDate = end.toLocaleDateString(undefined, optsDate);
  const endTime = end.toLocaleTimeString(undefined, optsTime);
  const sameDay = startDate === endDate;
  const local = sameDay
    ? `${startDate} · ${startTime} – ${endTime}`
    : `${startDate} ${startTime} → ${endDate} ${endTime}`;
  const utc = `${start.toISOString().slice(0, 16).replace('T', ' ')} → ${end.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  return { local, utc };
}

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

function CountdownBlock({ targetMs, label, live }) {
  const parts = splitDuration(targetMs - Date.now());
  const done = targetMs <= Date.now();
  return (
    <div className={`ev-countdown ${done ? 'ev-countdown-done' : ''}`}>
      <span className="ev-countdown-label">{done ? (live ? 'Ended' : 'Started') : label}</span>
      {!done && (
        <div className="ev-countdown-units" aria-live="polite">
          <div><strong>{parts.days}</strong><span>d</span></div>
          <div><strong>{pad(parts.hours)}</strong><span>h</span></div>
          <div><strong>{pad(parts.minutes)}</strong><span>m</span></div>
          <div><strong>{pad(parts.seconds)}</strong><span>s</span></div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  useNow(1000);
  const startMs = new Date(event.starts_at).getTime();
  const endMs = event.ends_at ? new Date(event.ends_at).getTime() : null;
  const now = Date.now();
  const notStarted = now < startMs;
  const inProgress = !notStarted && (endMs == null || now < endMs);
  const range = formatRange(event.starts_at, event.ends_at);

  let status = 'upcoming';
  if (inProgress) status = 'live';
  else if (!notStarted) status = 'ended';

  return (
    <article className={`ev-card ev-card-${status}`}>
      <div className="ev-card-top">
        <span className="ev-kind">{KIND_LABEL[event.kind] || event.kind}</span>
        <span className={`ev-status ev-status-${status}`}>
          {status === 'live' ? 'Live now' : status === 'ended' ? 'Ended' : 'Upcoming'}
        </span>
      </div>

      <h3 className="ev-card-title">
        <Link href={`/events/${event.slug}`}>{event.title}</Link>
      </h3>

      {notStarted && (
        <CountdownBlock targetMs={startMs} label="Starts in" />
      )}
      {inProgress && endMs && (
        <CountdownBlock targetMs={endMs} label="Ends in" live />
      )}
      {inProgress && !endMs && (
        <div className="ev-countdown ev-countdown-live">
          <span className="ev-countdown-label">In progress</span>
        </div>
      )}

      <div className="ev-timings">
        <div className="ev-timing-row">
          <span className="ev-timing-label">Your local time</span>
          <span className="ev-timing-value">{range.local}</span>
        </div>
        <div className="ev-timing-row">
          <span className="ev-timing-label">UTC</span>
          <span className="ev-timing-value muted">{range.utc}</span>
        </div>
      </div>

      {event.description ? (
        <div className="ev-desc-box">
          <p>{event.description}</p>
        </div>
      ) : null}

      <div className="ev-card-actions">
        <Link href={`/events/${event.slug}`} className="ev-link-detail">
          Event details →
        </Link>
        <a href={`/api/events/${event.slug}/ics`} className="ev-link-ics">
          📅 Add to calendar
        </a>
      </div>
    </article>
  );
}

/**
 * @param {{ events: Array<{ slug: string, title: string, kind: string, description?: string, starts_at: string, ends_at?: string }> }}
 */
export default function EventCountdownCards({ events }) {
  if (!events?.length) return null;

  return (
    <div className="ev-cards">
      {events.map((event) => (
        <EventCard key={event.slug} event={event} />
      ))}

      <style>{`
        .ev-cards{display:flex;flex-direction:column;gap:18px}
        .ev-card{padding:22px 24px;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);display:flex;flex-direction:column;gap:14px;transition:border-color .16s,box-shadow .16s}
        .ev-card:hover{border-color:var(--color-accent)}
        .ev-card-live{border-color:rgba(62,207,142,.45);box-shadow:0 0 0 1px rgba(62,207,142,.15)}
        .ev-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
        .ev-kind{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:999px;background:rgba(180,140,255,.14);color:var(--color-accent-strong)}
        .ev-status{font-size:12px;font-weight:700}
        .ev-status-upcoming{color:var(--color-ink-muted)}
        .ev-status-live{color:#3ecf8e}
        .ev-status-ended{color:var(--color-ink-muted)}
        .ev-card-title{margin:0;font-family:var(--font-display);font-size:clamp(20px,3vw,26px);line-height:1.2}
        .ev-card-title a{color:inherit;text-decoration:none}
        .ev-card-title a:hover{color:var(--color-accent-strong)}
        .ev-countdown{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:12px;background:var(--color-surface-alt);border:1px solid var(--color-border)}
        .ev-countdown-live{border-color:rgba(62,207,142,.35)}
        .ev-countdown-label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-ink-muted);font-weight:700}
        .ev-countdown-units{display:flex;gap:10px;flex-wrap:wrap}
        .ev-countdown-units > div{min-width:52px;display:flex;flex-direction:column;align-items:center;padding:6px 8px;border-radius:8px;background:var(--color-surface);border:1px solid var(--color-border)}
        .ev-countdown-units strong{font-family:var(--font-display);font-size:22px;line-height:1.1;font-variant-numeric:tabular-nums}
        .ev-countdown-units span{font-size:10px;text-transform:uppercase;color:var(--color-ink-muted);letter-spacing:.04em}
        .ev-timings{display:flex;flex-direction:column;gap:6px}
        .ev-timing-row{display:flex;flex-direction:column;gap:2px;font-size:13.5px}
        .ev-timing-label{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--color-ink-muted);font-weight:700}
        .ev-timing-value{font-weight:600}
        .ev-timing-value.muted{font-weight:500;color:var(--color-ink-muted);font-size:12.5px}
        .ev-desc-box{padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.12);border:1px solid var(--color-border)}
        .ev-desc-box p{margin:0;font-size:14px;line-height:1.55;color:var(--color-ink-muted)}
        .ev-card-actions{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding-top:2px}
        .ev-link-detail{font-size:13px;font-weight:700;color:var(--color-accent-strong);text-decoration:none}
        .ev-link-detail:hover{text-decoration:underline}
        .ev-link-ics{font-size:12.5px;color:var(--color-ink-muted);text-decoration:none}
        .ev-link-ics:hover{color:var(--color-accent-strong)}
        @media (min-width:720px){
          .ev-timing-row{flex-direction:row;justify-content:space-between;align-items:baseline;gap:12px}
        }
      `}</style>
    </div>
  );
}

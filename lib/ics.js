// Minimal hand-written ICS (RFC 5545) generation - no external calendar
// library needed for what this app actually requires: a handful of
// VEVENTs, one of them daily-recurring. RRULE:FREQ=DAILY is native ICS
// syntax, so the recurring Bear Hunt schedule needs no recurrence engine
// at all; every calendar app already knows how to expand it.

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// UTC, "Zulu" form (YYYYMMDDTHHMMSSZ) - timezone-unambiguous, so every
// calendar app converts to the viewer's local time itself.
function toIcsUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function foldLine(line) {
  // RFC 5545 requires folding lines longer than 75 octets; long
  // descriptions are the only field here likely to exceed it.
  if (line.length <= 75) return line;
  const parts = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function buildIcsCalendar({ name, events }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kingdom 710//K710 Hub//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(name)}`,
  ];

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${toIcsUtc(new Date())}`);
    lines.push(`DTSTART:${toIcsUtc(ev.start)}`);
    if (ev.end) lines.push(`DTEND:${toIcsUtc(ev.end)}`);
    if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);
    lines.push(foldLine(`SUMMARY:${escapeText(ev.summary)}`));
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

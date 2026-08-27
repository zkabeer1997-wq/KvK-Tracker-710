// The real K710 Bear Hunt schedule - shared between the Chronometer widget
// (components/kingdom/world/Chronometer.jsx) and the public events page
// (app/events), so both read from one source rather than two copies that
// could drift. No React here: this needs to be importable from a server
// component (the events page) as well as a 'use client' one.
export const HUNTS = [
  { band: '710', utc: '02:00' },
  { band: 'RED', utc: '11:05' },
  { band: 'SKY', utc: '12:00' },
  { band: '710', utc: '13:00' },
  { band: 'RED', utc: '19:00' },
  { band: 'SKY', utc: '20:00' },
  { band: 'RED', utc: '23:20' },
];

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function nextHunt(nowMin) {
  const sorted = [...HUNTS].sort((a, b) => toMinutes(a.utc) - toMinutes(b.utc));
  const upcoming = sorted.find((h) => toMinutes(h.utc) > nowMin);
  const target = upcoming || sorted[0];
  const delta = upcoming
    ? toMinutes(target.utc) - nowMin
    : 1440 - nowMin + toMinutes(target.utc);
  return { ...target, inMin: delta };
}

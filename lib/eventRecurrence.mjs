// UTC schedules, matching the kingdom clock and RFC 5545 calendar exports.
export const RECURRENCE_FIELDS = 'recurrence_frequency, recurrence_interval, recurrence_until';
const FREQUENCIES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
const DAY = 86400000;

export function validateEventSchedule(event) {
  const start = Date.parse(event.starts_at);
  if (!Number.isFinite(start)) return { error: 'A valid start date/time is required.' };
  const end = event.ends_at ? Date.parse(event.ends_at) : null;
  if (end !== null && (!Number.isFinite(end) || end <= start)) return { error: 'End time must be after the start time.' };
  const frequency = event.recurrence_frequency ?? 'none';
  if (!FREQUENCIES.includes(frequency)) return { error: 'Choose a supported repeat frequency.' };
  const interval = frequency === 'none' ? 1 : Number(event.recurrence_interval ?? 1);
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) return { error: 'Repeat interval must be a whole number from 1 to 365.' };
  let until = null;
  if (frequency !== 'none' && event.recurrence_until) {
    const value = event.recurrence_until;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) return { error: 'Choose a valid repeat stop date.' };
    if (Date.parse(`${value}T23:59:59.999Z`) < start) return { error: 'Repeat stop date cannot be before the first event.' };
    until = value;
  }
  return { schedule: { starts_at: new Date(start).toISOString(), ends_at: end === null ? null : new Date(end).toISOString(), recurrence_frequency: frequency, recurrence_interval: interval, recurrence_until: until } };
}

export function recurrenceLabel(event) {
  const frequency = event.recurrence_frequency || 'none';
  if (frequency === 'none') return 'Does not repeat';
  const interval = Number(event.recurrence_interval) || 1;
  const unit = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[frequency];
  const label = interval === 1 ? { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[frequency] : `Every ${interval} ${unit}s`;
  return `${label}${event.recurrence_until ? ` · through ${event.recurrence_until} (UTC)` : ''}`;
}

export function recurrenceRule(event) {
  if (!event.recurrence_frequency || event.recurrence_frequency === 'none') return null;
  const { schedule, error } = validateEventSchedule(event);
  if (error) return null;
  return `FREQ=${schedule.recurrence_frequency.toUpperCase()};INTERVAL=${schedule.recurrence_interval}${schedule.recurrence_until ? `;UNTIL=${schedule.recurrence_until.replaceAll('-', '')}T235959Z` : ''}`;
}

// Return the first ongoing or next occurrence, preserving the original event row.
// Month-end/leap-day dates that do not exist are skipped, as in ICS RRULE.
export function nextEventOccurrence(event, now = Date.now()) {
  const { schedule, error } = validateEventSchedule(event);
  if (error) return null;
  const start = Date.parse(schedule.starts_at);
  const duration = schedule.ends_at ? Date.parse(schedule.ends_at) - start : 0;
  const isRelevant = ms => duration ? ms + duration > now : ms >= now;
  const occurrence = ms => ({ ...event, starts_at: new Date(ms).toISOString(), ends_at: duration ? new Date(ms + duration).toISOString() : null });
  if (schedule.recurrence_frequency === 'none') return isRelevant(start) ? occurrence(start) : null;
  const until = schedule.recurrence_until ? Date.parse(`${schedule.recurrence_until}T23:59:59.999Z`) : Infinity;
  const threshold = now - duration;
  const interval = schedule.recurrence_interval;
  const frequency = schedule.recurrence_frequency;
  const anchor = new Date(start);
  if (frequency === 'daily' || frequency === 'weekly') {
    const step = DAY * interval * (frequency === 'weekly' ? 7 : 1);
    let n = Math.max(0, Math.floor((threshold - start) / step));
    let ms = start + n * step;
    if (!isRelevant(ms)) ms = start + (++n) * step;
    return ms <= until && Number.isFinite(new Date(ms).getTime()) ? occurrence(ms) : null;
  }
  const target = new Date(Math.max(start, threshold));
  const months = (target.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + target.getUTCMonth() - anchor.getUTCMonth();
  const stepMonths = interval * (frequency === 'yearly' ? 12 : 1);
  const first = Math.max(0, Math.floor(months / stepMonths));
  // Gregorian dates repeat every 400 years; this bound also covers sparse leap-day schedules.
  for (let n = first; n < first + 4800; n++) {
    const month = anchor.getUTCMonth() + n * stepMonths;
    const date = new Date(start);
    date.setUTCDate(1);
    date.setUTCFullYear(anchor.getUTCFullYear() + Math.floor(month / 12), month % 12, anchor.getUTCDate());
    const ms = date.getTime();
    if (!Number.isFinite(ms) || ms > until) return null;
    if (date.getUTCMonth() !== month % 12 || date.getUTCDate() !== anchor.getUTCDate()) continue;
    if (isRelevant(ms)) return occurrence(ms);
  }
  return null;
}

export function upcomingEventSeries(events, now = Date.now()) {
  return events.map(event => {
    const oneOff = !event.recurrence_frequency || event.recurrence_frequency === 'none';
    // Keep the existing one-day grace period for one-off entries.
    const occurrence = nextEventOccurrence(event, now) || (oneOff && Date.parse(event.starts_at) >= now - DAY ? event : null);
    return { event, occurrence };
  })
    .filter(entry => entry.occurrence)
    .sort((a, b) => Date.parse(a.occurrence.starts_at) - Date.parse(b.occurrence.starts_at));
}

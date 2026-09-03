import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextEventOccurrence, validateEventSchedule, recurrenceRule, upcomingEventSeries } from '../lib/eventRecurrence.mjs';
import { buildIcsCalendar } from '../lib/ics.js';

const base = { slug: 'event', starts_at: '2026-09-01T20:00:00Z', ends_at: '2026-09-01T21:30:00Z', recurrence_frequency: 'daily', recurrence_interval: 1 };
const at = (event, now) => nextEventOccurrence(event, Date.parse(now));

test('daily recurrence keeps duration and advances exactly at its end', () => {
  assert.equal(at(base, '2026-09-03T20:30:00Z').starts_at, '2026-09-03T20:00:00.000Z');
  const next = at(base, '2026-09-03T21:30:00Z');
  assert.equal(next.starts_at, '2026-09-04T20:00:00.000Z');
  assert.equal(next.ends_at, '2026-09-04T21:30:00.000Z');
  assert.equal(base.starts_at, '2026-09-01T20:00:00Z');
});
test('weekly custom interval stays anchored to first occurrence', () => {
  assert.equal(at({ ...base, recurrence_frequency: 'weekly', recurrence_interval: 2 }, '2026-09-02T00:00:00Z').starts_at, '2026-09-15T20:00:00.000Z');
});
test('monthly 31st skips invalid dates without drifting', () => {
  const event = { ...base, starts_at: '2026-01-31T20:00:00Z', ends_at: null, recurrence_frequency: 'monthly' };
  assert.equal(at(event, '2026-02-01T00:00:00Z').starts_at, '2026-03-31T20:00:00.000Z');
  assert.equal(at({ ...event, recurrence_interval: 2 }, '2026-04-01T00:00:00Z').starts_at, '2026-05-31T20:00:00.000Z');
});
test('yearly leap day skips non-leap years including 2100', () => {
  const event = { ...base, starts_at: '2096-02-29T20:00:00Z', ends_at: null, recurrence_frequency: 'yearly' };
  assert.equal(at(event, '2097-01-01T00:00:00Z').starts_at, '2104-02-29T20:00:00.000Z');
});
test('stop date includes starts that day and allows final occurrence to finish', () => {
  const event = { ...base, ends_at: '2026-09-02T01:00:00Z', recurrence_until: '2026-09-03' };
  assert.equal(at(event, '2026-09-04T00:30:00Z').starts_at, '2026-09-03T20:00:00.000Z');
  assert.equal(at(event, '2026-09-04T01:00:00Z'), null);
});
test('no-end recurrence advances after starting and eventually expires', () => {
  const event = { ...base, ends_at: null, recurrence_until: '2026-09-03' };
  assert.equal(at(event, '2026-09-03T19:00:00Z').starts_at, '2026-09-03T20:00:00.000Z');
  assert.equal(at(event, '2026-09-03T20:00:01Z'), null);
});
test('UTC hour stays fixed over daylight saving transitions', () => {
  assert.equal(at(base, '2026-11-01T00:00:00Z').starts_at, '2026-11-01T20:00:00.000Z');
});
test('validation rejects malformed intervals, dates and backwards durations', () => {
  for (const changes of [{ recurrence_interval: 0 }, { recurrence_interval: 1.5 }, { recurrence_interval: 366 }, { recurrence_frequency: 'sometimes' }, { recurrence_until: '2026-02-30' }, { recurrence_until: '2026-08-30' }, { ends_at: 'bad' }, { ends_at: base.starts_at }]) {
    assert.ok(validateEventSchedule({ ...base, ...changes }).error, JSON.stringify(changes));
  }
});
test('turning repeats off clears obsolete recurrence fields', () => {
  const { schedule } = validateEventSchedule({ ...base, recurrence_frequency: 'none', recurrence_interval: 14, recurrence_until: '2026-12-31' });
  assert.equal(schedule.recurrence_interval, 1);
  assert.equal(schedule.recurrence_until, null);
  assert.equal(recurrenceRule(schedule), null);
});
test('upcoming list orders by actual next occurrence, retains one-off grace, and hides expired series', () => {
  const rows = [base, { ...base, slug: 'one-off', recurrence_frequency: 'none', starts_at: '2026-09-03T10:00:00Z', ends_at: null }, { ...base, slug: 'expired', recurrence_until: '2026-09-02' }];
  assert.deepEqual(upcomingEventSeries(rows, Date.parse('2026-09-03T12:00:00Z')).map(row => row.event.slug), ['one-off', 'event']);
});
test('calendar export carries original anchor and inclusive UTC recurrence rule', () => {
  const event = { ...base, recurrence_frequency: 'weekly', recurrence_interval: 2, recurrence_until: '2026-12-31' };
  const ics = buildIcsCalendar({ name: 'Schedule', events: [{ uid: 'event@k710hub', start: new Date(event.starts_at), end: new Date(event.ends_at), summary: 'Event', rrule: recurrenceRule(event) }] });
  assert.match(ics, /DTSTART:20260901T200000Z/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T235959Z/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mintAdminToken } from '../lib/adminAuth.js';

const state = { writes: [], existing: { id: 'event-id', slug: 'event', starts_at: '2026-09-01T20:00:00Z', ends_at: '2026-09-01T21:00:00Z', recurrence_frequency: 'weekly', recurrence_interval: 2, recurrence_until: '2026-12-31' } };
globalThis.__eventScheduleTest = state;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('/lib/adminSupabase')) return { url: 'test:event-database', shortCircuit: true };
    if (specifier === 'next/cache') return { url: 'test:event-cache', shortCircuit: true };
    if (specifier === 'next/server') return next('next/server.js', context);
    if (specifier.endsWith('/lib/adminAuth')) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'test:event-database') return { format: 'module', shortCircuit: true, source: 'export const createAdminSupabaseClient = () => globalThis.__eventScheduleTest.client;' };
    if (url === 'test:event-cache') return { format: 'module', shortCircuit: true, source: 'export const revalidatePath = () => {};' };
    return next(url, context);
  },
});
const chain = {
  select() { return this; }, eq() { return this; },
  async maybeSingle() { return { data: state.existing, error: null }; },
  insert(value) { state.writes.push(value); return this; },
  update(value) { state.writes.push(value); return this; },
  async single() { return { data: state.writes.at(-1), error: null }; },
};
state.client = { from: () => chain };
const { POST } = await import('../app/api/admin-events/route.js');
const { PUT } = await import('../app/api/admin-events/[id]/route.js');
process.env.ADMIN_PASSWORD = 'event-schedule-test-only';
process.env.K710_ENABLE_LEGACY_ADMIN = 'true';
const token = await mintAdminToken();
const request = (body, admin = true) => ({ cookies: { get: () => admin ? { value: token } : undefined }, json: async () => body });
const params = { params: Promise.resolve({ id: 'event-id' }) };

test('event mutations require admin authentication', async () => {
  assert.equal((await POST(request({}, false))).status, 401);
  assert.equal((await PUT(request({}, false), params)).status, 401);
  assert.equal(state.writes.length, 0);
});
test('creation saves frequency, interval and stop date together', async () => {
  const result = await POST(request({ ...state.existing, title: 'Weekly event', kind: 'custom', published: true }));
  assert.equal(result.status, 200);
  assert.equal(state.writes.at(-1).recurrence_interval, 2);
  assert.equal(state.writes.at(-1).recurrence_until, '2026-12-31');
});
test('partial edit keeps existing repeat schedule and rejects invalid stop dates', async () => {
  assert.equal((await PUT(request({ title: 'New title' }), params)).status, 200);
  assert.equal(state.writes.at(-1).recurrence_frequency, 'weekly');
  const count = state.writes.length;
  assert.equal((await PUT(request({ recurrence_until: '2026-01-01' }), params)).status, 400);
  assert.equal(state.writes.length, count);
});
test('editing back to one-off clears stop date and interval', async () => {
  assert.equal((await PUT(request({ recurrence_frequency: 'none' }), params)).status, 200);
  assert.equal(state.writes.at(-1).recurrence_until, null);
  assert.equal(state.writes.at(-1).recurrence_interval, 1);
});

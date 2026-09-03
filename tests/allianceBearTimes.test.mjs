import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { mintAdminToken } from '../lib/adminAuth.js';
import { validateBearTimes, huntsFromAlliances, nextHunt } from '../lib/bearHuntSchedule.js';

const state = { rows: [{ tag: 'RED', name: 'RED', active: true, bear_times_utc: ['11:05', '19:00', '23:20'], leader_player_id: 'private-test-field', updated_at: '2026-09-03' }], paths: [], writes: 0 };
globalThis.__bearScheduleTest = state;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('/lib/adminSupabase') || specifier === './adminSupabase') return { url: 'test:bear-database', shortCircuit: true };
    if (specifier === 'next/cache') return { url: 'test:bear-cache', shortCircuit: true };
    if (specifier === 'next/server') return next('next/server.js', context);
    if (/\/(adminAuth|bearHuntSchedule|publicBearSchedule|revalidateAlliancePages|ics)$/.test(specifier)) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'test:bear-database') return { format: 'module', shortCircuit: true, source: 'export const createAdminSupabaseClient = () => globalThis.__bearScheduleTest.client;' };
    if (url === 'test:bear-cache') return { format: 'module', shortCircuit: true, source: 'export const revalidatePath = path => globalThis.__bearScheduleTest.paths.push(path);' };
    return next(url, context);
  },
});
state.client = { from() {
  const query = {
    filters: [], fields: '*', changes: null, removing: false,
    select(fields) { this.fields = fields; return this; },
    eq(key, value) { this.filters.push([key, value]); return this; },
    order() { return this; },
    update(changes) { this.changes = changes; return this; },
    insert(changes) { state.rows.push(changes); state.writes++; return this; },
    delete() { this.removing = true; return this; },
    execute(single = false) {
      if (state.failRead && !this.changes && !this.removing) return { data: null, error: new Error('Database unavailable') };
      const selected = state.rows.filter(row => this.filters.every(([key, value]) => row[key] === value));
      if (this.changes) { selected.forEach(row => Object.assign(row, this.changes)); state.writes++; }
      if (this.removing) { state.rows = state.rows.filter(row => !selected.includes(row)); state.writes++; }
      const result = selected.map(row => this.fields === '*' ? { ...row } : Object.fromEntries(this.fields.split(',').map(field => [field.trim(), row[field.trim()]])));
      return { data: single ? result[0] : result, error: null };
    },
    async single() { return this.execute(true); },
    then(resolve, reject) { return Promise.resolve(this.execute()).then(resolve, reject); },
  };
  return query;
} };
const { PUT, DELETE } = await import('../app/api/admin-alliances/[tag]/route.js');
const { POST } = await import('../app/api/admin-alliances/route.js');
const { GET: publicGet } = await import('../app/api/bear-schedule/route.js');
const { GET: calendarGet } = await import('../app/api/events/bear-hunt.ics/route.js');
process.env.ADMIN_PASSWORD = 'bear-test-only';
const token = await mintAdminToken();
const request = (body, admin = true) => ({ cookies: { get: () => admin ? { value: token } : undefined }, json: async () => body });
const params = { params: Promise.resolve({ tag: 'RED' }) };

test('times validate, deduplicate by rejection, and sort without mutating input', () => {
  const input = ['23:20', '00:00', '12:45'];
  assert.deepEqual(validateBearTimes(input).times, ['00:00', '12:45', '23:20']);
  assert.equal(input[0], '23:20');
  for (const value of [['24:00'], ['12:60'], ['1:00'], [''], ['10:00', '10:00'], '10:00', null]) assert.ok(validateBearTimes(value).error);
  assert.deepEqual(validateBearTimes([]).times, []);
});
test('admin authentication gates all alliance writes', async () => {
  assert.equal((await PUT(request({}, false), params)).status, 401);
  assert.equal((await POST(request({}, false))).status, 401);
  assert.equal((await DELETE(request({}, false), params)).status, 401);
  assert.equal(state.writes, 0);
});
test('invalid times do not modify stored data', async () => {
  assert.equal((await PUT(request({ bear_times_utc: ['25:00'] }), params)).status, 400);
  assert.equal(state.writes, 0);
});
test('save flows through public schedule, clock helpers, and calendar with no old times', async () => {
  const result = await PUT(request({ bear_times_utc: ['22:15', '03:40'] }), params);
  assert.equal(result.status, 200);
  const response = await publicGet();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { alliances } = await response.json();
  assert.deepEqual(alliances[0].bear_times_utc, ['03:40', '22:15']);
  assert.equal(alliances[0].leader_player_id, undefined);
  const hunts = huntsFromAlliances(alliances);
  assert.deepEqual(nextHunt(23 * 60, hunts), { band: 'RED', utc: '03:40', inMin: 280 });
  const ics = await (await calendarGet()).text();
  assert.match(ics, /034000Z/); assert.match(ics, /221500Z/);
  assert.doesNotMatch(ics, /11:05|19:00|23:20/);
  for (const path of ['/', '/about', '/alliances', '/alliances/red', '/events', '/chronometer', '/api/bear-schedule', '/api/events/bear-hunt.ics']) assert.ok(state.paths.includes(path), path);
});
test('partial alliance edits preserve saved times', async () => {
  await PUT(request({ language: 'English' }), params);
  assert.deepEqual(state.rows[0].bear_times_utc, ['03:40', '22:15']);
});
test('hidden alliances vanish from public data and downloads', async () => {
  await PUT(request({ active: false }), params);
  assert.deepEqual((await (await publicGet()).json()).alliances, []);
  assert.doesNotMatch(await (await calendarGet()).text(), /BEGIN:VEVENT/);
  await PUT(request({ active: true }), params);
});
test('removing all times is intentional and never restores hardcoded defaults', async () => {
  await PUT(request({ bear_times_utc: [] }), params);
  const { alliances } = await (await publicGet()).json();
  assert.deepEqual(huntsFromAlliances(alliances), []);
  assert.equal(nextHunt(100, []), null);
  assert.doesNotMatch(await (await calendarGet()).text(), /BEGIN:VEVENT/);
});
test('new alliances can publish their own hunt times', async () => {
  assert.equal((await POST(request({ tag: 'NEW', name: 'New alliance', bear_times_utc: ['14:10'], active: true }))).status, 200);
  assert.match(await (await calendarGet()).text(), /Bear Hunt — NEW/);
});
test('database failure returns unavailable instead of an outdated fallback', async () => {
  state.failRead = true;
  assert.equal((await publicGet()).status, 503);
  assert.equal((await calendarGet()).status, 503);
  state.failRead = false;
});
test('deletion removes that alliance from the shared schedule', async () => {
  await DELETE(request({}), params);
  const { alliances } = await (await publicGet()).json();
  assert.ok(alliances.every(alliance => alliance.tag !== 'RED'));
});

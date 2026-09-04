import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationPath = new URL('../supabase/migrations/20260904190000_personal_login_codes.sql', import.meta.url);
const bootstrapMigrationPath = new URL('../supabase/migrations/20260904200000_bootstrap_personal_owner.sql', import.meta.url);
const adminRoutePath = new URL('../app/api/admin-personal-codes/route.js', import.meta.url);
const roleRoutePath = new URL('../app/api/admin-user-roles/route.js', import.meta.url);
const personalLoginRoutePath = new URL('../app/api/login/verify-personal-code/route.js', import.meta.url);
const instrumentationPath = new URL('../instrumentation.js', import.meta.url);

test('personal login codes are bcrypt protected and the requested initial code is provisioned', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /extensions\.crypt\('479377', extensions\.gen_salt\('bf', 10\)\)/);
  assert.match(sql, /verify_kingshot_personal_code/);
  assert.match(sql, /reset_kingshot_personal_code/);
  assert.match(sql, /p_personal_code ~ '\^\[0-9\]\{6\}\$'/);
});

test('the initial owner is bootstrapped idempotently at migration and server startup', async () => {
  const [sql, instrumentation] = await Promise.all([
    readFile(bootstrapMigrationPath, 'utf8'),
    readFile(instrumentationPath, 'utf8'),
  ]);
  assert.match(sql, /create or replace function public\.ensure_initial_kingshot_owner/);
  assert.match(sql, /on conflict \(player_id\) do update/);
  assert.match(sql, /coalesce\(\s*public\.kingshot_users\.personal_code_hash,\s*excluded\.personal_code_hash/);
  assert.match(sql, /select public\.ensure_initial_kingshot_owner\(\)/);
  assert.match(instrumentation, /await ensureInitialKingshotOwner\(\)/);
});

test('personal login refreshes and stores the API profile before creating a session', async () => {
  const route = await readFile(personalLoginRoutePath, 'utf8');
  const refreshAt = route.indexOf('await loadPlayerData(flow.playerId)');
  const upsertAt = route.indexOf('.upsert(storedUser');
  const sessionAt = route.indexOf('await createMemberSession(flow.playerId, request)');
  assert.ok(refreshAt > 0);
  assert.ok(upsertAt > refreshAt);
  assert.ok(sessionAt > upsertAt);
});

test('personal code management is superadmin-only and never lists stored hashes', async () => {
  const [adminRoute, roleRoute] = await Promise.all([
    readFile(adminRoutePath, 'utf8'),
    readFile(roleRoutePath, 'utf8'),
  ]);
  assert.match(adminRoute, /actor\?\.role !== 'superadmin'/);
  assert.match(adminRoute, /randomInt\(0, 1_000_000\)/);
  assert.doesNotMatch(adminRoute, /personal_code_hash/);
  assert.match(roleRoute, /personal_code_configured/);
  assert.match(roleRoute, /personal_code_hash: personalCodeHash/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationPath = new URL('../supabase/migrations/20260904190000_personal_login_codes.sql', import.meta.url);
const adminRoutePath = new URL('../app/api/admin-personal-codes/route.js', import.meta.url);
const roleRoutePath = new URL('../app/api/admin-user-roles/route.js', import.meta.url);

test('personal login codes are bcrypt protected and the requested initial code is provisioned', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /extensions\.crypt\('479377', extensions\.gen_salt\('bf', 10\)\)/);
  assert.match(sql, /verify_kingshot_personal_code/);
  assert.match(sql, /reset_kingshot_personal_code/);
  assert.match(sql, /p_personal_code ~ '\^\[0-9\]\{6\}\$'/);
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

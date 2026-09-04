import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MEMBER_TOKEN_TTL_MS,
  MEMBER_TOKEN_TTL_SECONDS,
  memberSessionCookieOptions,
  memberSessionExpiresAt,
} from '../lib/memberAuth.js';

test('member login persists in the browser and database for exactly 30 days', () => {
  const thirtyDaysInSeconds = 2_592_000;
  const loginTime = Date.parse('2026-09-04T12:00:00.000Z');
  const cookie = memberSessionCookieOptions();

  assert.equal(MEMBER_TOKEN_TTL_SECONDS, thirtyDaysInSeconds);
  assert.equal(MEMBER_TOKEN_TTL_MS, thirtyDaysInSeconds * 1000);
  assert.equal(cookie.maxAge, thirtyDaysInSeconds);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, 'lax');
  assert.equal(cookie.path, '/');
  assert.equal(
    memberSessionExpiresAt(loginTime),
    '2026-10-04T12:00:00.000Z',
  );
});

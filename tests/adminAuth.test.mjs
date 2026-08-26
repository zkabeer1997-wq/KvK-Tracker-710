import assert from 'node:assert/strict';
import {
  ADMIN_COOKIE_NAME,
  computeAdminToken,
  isValidAdminToken,
  isAdminRequest,
} from '../lib/adminAuth.js';

// Minimal stand-in for the NextRequest shape the real callers pass in.
function requestWithCookie(value) {
  return {
    cookies: {
      get: (name) => (name === ADMIN_COOKIE_NAME && value !== undefined ? { value } : undefined),
    },
  };
}

process.env.ADMIN_PASSWORD = 'shared-rally-secret';

const token = await computeAdminToken();

assert.equal(typeof token, 'string');
assert.equal(token.length, 64, 'token should be sha-256 hex');
assert.equal(await computeAdminToken(), token, 'token should be deterministic');

assert.equal(await isValidAdminToken(token), true);
assert.equal(await isValidAdminToken('wrong-token'), false);
assert.equal(await isValidAdminToken(''), false);
assert.equal(await isValidAdminToken(null), false);
assert.equal(await isValidAdminToken(undefined), false);

// Same length as a real token, so this exercises the comparison rather than
// the length guard.
assert.equal(await isValidAdminToken('0'.repeat(64)), false);

assert.equal(await isAdminRequest(requestWithCookie(token)), true);
assert.equal(await isAdminRequest(requestWithCookie('nope')), false);
assert.equal(await isAdminRequest(requestWithCookie()), false, 'missing cookie should be rejected');

// Fail closed: with no ADMIN_PASSWORD configured, nothing authenticates —
// not even a token that was valid a moment ago.
delete process.env.ADMIN_PASSWORD;
assert.equal(await isValidAdminToken(token), false, 'must fail closed when ADMIN_PASSWORD is unset');
assert.equal(await isAdminRequest(requestWithCookie(token)), false);

console.log('adminAuth tests passed');

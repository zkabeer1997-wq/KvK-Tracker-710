import assert from 'node:assert/strict';
import { createAdminSession, isValidAdminToken } from '../lib/adminAuth.js';

process.env.ADMIN_SESSION_SECRET = 'test-session-secret-that-is-long-enough';

const token = await createAdminSession();
assert.equal(await isValidAdminToken(token), true);
assert.equal(await isValidAdminToken('wrong-token'), false);
assert.equal(await isValidAdminToken(''), false);

console.log('adminAuth tests passed');

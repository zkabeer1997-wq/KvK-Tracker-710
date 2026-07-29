import assert from 'node:assert/strict';
import { computeAdminToken, isValidAdminToken } from '../lib/adminAuth.js';

process.env.ADMIN_PASSWORD = 'shared-rally-secret';

const token = await computeAdminToken();

assert.equal(await isValidAdminToken(token), true);
assert.equal(await isValidAdminToken('wrong-token'), false);
assert.equal(await isValidAdminToken(''), false);

console.log('adminAuth tests passed');

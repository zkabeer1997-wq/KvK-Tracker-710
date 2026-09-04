import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMemberSessionSecret,
  MemberSessionConfigurationError,
  requireMemberSessionSecret,
} from '../lib/memberSessionSecret.js';

test('blank local configuration gets a stable development-only session secret', () => {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    memberSecret: process.env.MEMBER_SESSION_SECRET,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  try {
    process.env.NODE_ENV = 'development';
    delete process.env.MEMBER_SESSION_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const first = getMemberSessionSecret();
    const second = getMemberSessionSecret();
    assert.ok(first.length >= 32);
    assert.equal(second, first);

    process.env.NODE_ENV = 'production';
    assert.equal(getMemberSessionSecret(), '');
    assert.throws(() => requireMemberSessionSecret(), MemberSessionConfigurationError);
  } finally {
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.nodeEnv;
    if (original.memberSecret === undefined) delete process.env.MEMBER_SESSION_SECRET;
    else process.env.MEMBER_SESSION_SECRET = original.memberSecret;
    if (original.serviceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = original.serviceKey;
  }
});

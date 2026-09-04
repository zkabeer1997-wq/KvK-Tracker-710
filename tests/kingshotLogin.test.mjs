import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createLoginFlow,
  deriveKingdomId,
  isLoginSuperadmin,
  sendVerificationCode,
  toPublicProfile,
  toStoredUser,
} from '../lib/kingshotLogin.js';
import { openLoginFlow, sealLoginFlow } from '../lib/kingshotLoginState.js';
import { hasAdminRole } from '../lib/adminAuth.js';

process.env.MEMBER_SESSION_SECRET = 'synthetic-kingshot-login-test-secret';

test('login flow accepts only numeric Player IDs and seals pending credentials', () => {
  assert.throws(() => createLoginFlow('not-a-player'));
  const flow = createLoginFlow('108051086');
  assert.equal(flow.playerId, '108051086');
  assert.equal(flow.state, 'awaiting_game_confirmation');
  assert.ok(flow.signingKey);
  assert.ok(flow.authKey);

  const sealed = sealLoginFlow(flow);
  assert.doesNotMatch(sealed, /108051086|signingKey|authKey/);
  assert.equal(openLoginFlow(sealed).playerId, flow.playerId);
  assert.equal(openLoginFlow(`${sealed}tampered`), null);

  const personalCodeFlow = sealLoginFlow({ ...flow, state: 'awaiting_personal_code' });
  assert.equal(openLoginFlow(personalCodeFlow).state, 'awaiting_personal_code');
});

test('designated owner accounts receive superadmin access on login', () => {
  assert.equal(isLoginSuperadmin('108051086'), true);
  assert.equal(isLoginSuperadmin('106599852'), true);
  assert.equal(isLoginSuperadmin('100000000'), false);
});

test('the official Chinese send-limit response is classified for personal-code fallback', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    code: 0,
    msg: '验证码发送次数已达上限，请稍后再试',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    await assert.rejects(
      sendVerificationCode(createLoginFlow('108051086')),
      (error) => error?.code === 'CODE_LIMIT' && error?.status === 429,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('kingdom resolution prefers the detailed profile and supports official fallback', () => {
  assert.equal(deriveKingdomId({
    profileResponse: { kid: 710 },
    searchMatch: { kid: 999 },
    officialProfile: { section: '888' },
  }), 710);
  assert.equal(deriveKingdomId({
    profileResponse: {},
    searchMatch: {},
    officialProfile: { extra_info: { key: 'kid', value: '710' } },
  }), 710);
  assert.equal(deriveKingdomId({ profileResponse: {}, searchMatch: {}, officialProfile: {} }), null);
});

test('stored account keeps complete API payloads while public profile stays minimal', () => {
  const officialProfile = { role_id: '108051086', nickname: 'Dosojin', icon: 'https://cdn.example/avatar.png', private_field: 'preserved' };
  const officialResponse = { code: 1, data: { user_data: [officialProfile], mail_data: { mail: 'stored@example.test' } }, msg: 'success' };
  const searchResponse = { query: '108051086', results: [{ fid: 108051086, uid: 27173713, kid: 710 }] };
  const profileResponse = { uid: 27173713, kid: 710, power: 318231784, kills: 7703101, nested: { complete: true } };
  const stored = toStoredUser({
    playerId: '108051086',
    officialProfile,
    officialResponse,
    searchResponse,
    searchMatch: searchResponse.results[0],
    profileResponse,
    kingdomId: 710,
  });
  assert.deepEqual(stored.official_api_response, officialResponse);
  assert.deepEqual(stored.mightpulse_search_response, searchResponse);
  assert.deepEqual(stored.mightpulse_profile_response, profileResponse);

  const publicProfile = toPublicProfile({ ...stored, access_role: 'superadmin' });
  assert.equal(publicProfile.playerId, '108051086');
  assert.equal(publicProfile.role, 'superadmin');
  assert.equal(publicProfile.power, 318231784);
  assert.equal('official_api_response' in publicProfile, false);
  assert.equal('mightpulse_profile_response' in publicProfile, false);
});

test('only admin and superadmin roles satisfy the admin boundary', () => {
  assert.equal(hasAdminRole('member'), false);
  assert.equal(hasAdminRole('admin'), true);
  assert.equal(hasAdminRole('superadmin'), true);
});

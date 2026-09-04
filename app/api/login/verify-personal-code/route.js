import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../lib/adminSupabase';
import {
  deriveKingdomId,
  isLoginSuperadmin,
  KingshotLoginError,
  loadPlayerData,
  toPublicProfile,
  toStoredUser,
} from '../../../../lib/kingshotLogin';
import {
  LOGIN_FLOW_COOKIE_NAME,
  loginFlowCookieOptions,
  readLoginFlow,
  sealLoginFlow,
} from '../../../../lib/kingshotLoginState';
import {
  createMemberSession,
  MEMBER_COOKIE_NAME,
  memberSessionCookieOptions,
} from '../../../../lib/memberAuth';
import { isPersonalCodeRateLimited, recordLoginEvent } from '../../../../lib/kingshotLoginAudit';

const PUBLIC_COLUMNS = 'player_id, nickname, avatar_url, kingdom_id, access_role, alliance_id, alliance_abbr, alliance_name, alliance_rank, power, kills, mystic_trial, coordinate_x, coordinate_y';

function json(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function isPersonalCodeSchemaError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return ['PGRST202', '42703', '42883'].includes(code)
    || /verify_kingshot_personal_code|personal_code_hash/i.test(message);
}

export async function POST(request) {
  const flow = readLoginFlow(request);
  if (!flow) {
    return json({ error: 'Your login attempt expired. Enter your Player ID again.' }, { status: 401 });
  }
  if (flow.state !== 'awaiting_personal_code') {
    return json({ error: 'Personal-code login is not available for this attempt.' }, { status: 409 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, { status: 400 });
  }

  const personalCode = String(body?.code || '').trim();
  if (!/^\d{6}$/.test(personalCode)) {
    return json({ error: 'Enter your 6-digit personal code.' }, { status: 400 });
  }

  try {
    const db = createAdminSupabaseClient();
    if (await isPersonalCodeRateLimited(request, flow.playerId)) {
      const response = json({
        error: 'Too many incorrect verification attempts. Please try again later.',
        code: 'PERSONAL_CODE_LIMIT',
        retryAllowed: false,
      }, { status: 429 });
      response.cookies.set(LOGIN_FLOW_COOKIE_NAME, '', loginFlowCookieOptions(0));
      return response;
    }
    const { data: verified, error: verifyError } = await db.rpc('verify_kingshot_personal_code', {
      p_player_id: flow.playerId,
      p_personal_code: personalCode,
    });
    if (verifyError) throw verifyError;

    if (verified !== true) {
      const failedAttempts = (flow.failedPersonalCodeAttempts || 0) + 1;
      await recordLoginEvent(request, 'verification_failed', flow.playerId, {
        attempt: failedAttempts,
        method: 'personal_code',
      });
      const retryAllowed = failedAttempts < 5;
      const response = json({
        error: retryAllowed
          ? 'That personal code is incorrect. Ask a superadmin to reset it if needed.'
          : 'Too many incorrect personal codes. Start a new login attempt.',
        code: 'PERSONAL_CODE_ERROR',
        retryAllowed,
      }, { status: 401 });
      response.cookies.set(
        LOGIN_FLOW_COOKIE_NAME,
        retryAllowed
          ? sealLoginFlow({ ...flow, failedPersonalCodeAttempts: failedAttempts })
          : '',
        loginFlowCookieOptions(retryAllowed ? undefined : 0),
      );
      return response;
    }

    const { data: existingUser, error: existingUserError } = await db
      .from('kingshot_users')
      .select(`${PUBLIC_COLUMNS}, official_profile, official_api_response`)
      .eq('player_id', flow.playerId)
      .eq('kingdom_id', 710)
      .single();
    if (existingUserError || !existingUser) {
      throw existingUserError || new Error('Account was not found.');
    }

    // Personal-code authentication replaces only the official one-time-code
    // exchange. Refresh the same MightPulse search/profile payload used by a
    // normal login, then persist the normalized and complete response data.
    const { searchResponse, searchMatch, profileResponse } = await loadPlayerData(flow.playerId);
    const officialProfile = existingUser.official_profile || {};
    const officialResponse = existingUser.official_api_response || {};
    const kingdomId = deriveKingdomId({ officialProfile, searchMatch, profileResponse });
    if (kingdomId !== 710) {
      await recordLoginEvent(request, 'kingdom_denied', flow.playerId, { kingdomId });
      const response = json({
        error: kingdomId
          ? `This account belongs to Kingdom ${kingdomId}. Member login is only available to Kingdom 710.`
          : 'We could not confirm that this account belongs to Kingdom 710.',
        code: 'KINGDOM_ACCESS_DENIED',
        kingdomId,
      }, { status: 403 });
      response.cookies.set(LOGIN_FLOW_COOKIE_NAME, '', loginFlowCookieOptions(0));
      return response;
    }

    const storedUser = toStoredUser({
      playerId: flow.playerId,
      officialProfile,
      officialResponse,
      searchResponse,
      searchMatch,
      profileResponse,
      kingdomId,
    });
    storedUser.access_role = isLoginSuperadmin(flow.playerId)
      ? 'superadmin'
      : existingUser.access_role;

    const { data: user, error: userError } = await db
      .from('kingshot_users')
      .upsert(storedUser, { onConflict: 'player_id', defaultToNull: false })
      .select(PUBLIC_COLUMNS)
      .single();
    if (userError || !user) throw userError || new Error('Account was not refreshed.');

    const session = await createMemberSession(flow.playerId, request);
    await recordLoginEvent(request, 'login_success', flow.playerId, {
      role: user.access_role,
      method: 'personal_code',
    });

    const response = json({
      ok: true,
      state: 'authenticated',
      profile: toPublicProfile(user),
    });
    response.cookies.set(MEMBER_COOKIE_NAME, session.token, memberSessionCookieOptions());
    response.cookies.set(LOGIN_FLOW_COOKIE_NAME, '', loginFlowCookieOptions(0));
    return response;
  } catch (error) {
    if (error instanceof KingshotLoginError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Personal-code login failed.', error);
    if (isPersonalCodeSchemaError(error)) {
      return json({
        error: 'Personal login database setup is incomplete. Apply the latest Supabase migrations.',
        code: 'PERSONAL_CODE_SETUP_REQUIRED',
      }, { status: 503 });
    }
    return json({
      error: 'Personal-code login is temporarily unavailable. Please try again.',
      code: 'PERSONAL_CODE_UNAVAILABLE',
    }, { status: 500 });
  }
}

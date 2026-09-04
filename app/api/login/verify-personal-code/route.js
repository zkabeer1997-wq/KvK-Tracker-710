import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { isLoginSuperadmin, toPublicProfile } from '../../../../lib/kingshotLogin';
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
    const db = createSupabaseAdminClient();
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

    if (isLoginSuperadmin(flow.playerId)) {
      const { error: roleError } = await db
        .from('kingshot_users')
        .update({ access_role: 'superadmin', updated_at: new Date().toISOString() })
        .eq('player_id', flow.playerId);
      if (roleError) throw roleError;
    }

    const { data: user, error: userError } = await db
      .from('kingshot_users')
      .select(PUBLIC_COLUMNS)
      .eq('player_id', flow.playerId)
      .eq('kingdom_id', 710)
      .single();
    if (userError || !user) throw userError || new Error('Account was not found.');

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
    console.error('Personal-code login failed.', error);
    return json({
      error: 'Personal-code login is temporarily unavailable. Please try again.',
      code: 'PERSONAL_CODE_UNAVAILABLE',
    }, { status: 500 });
  }
}

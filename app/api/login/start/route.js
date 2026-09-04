import { NextResponse } from 'next/server';
import { createLoginFlow, KingshotLoginError } from '../../../../lib/kingshotLogin';
import {
  LOGIN_FLOW_COOKIE_NAME,
  loginFlowCookieOptions,
  sealLoginFlow,
} from '../../../../lib/kingshotLoginState';
import { MemberSessionConfigurationError } from '../../../../lib/memberSessionSecret';

function json(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const flow = createLoginFlow(body?.playerId);
    const response = json({ ok: true, state: flow.state });
    response.cookies.set(
      LOGIN_FLOW_COOKIE_NAME,
      sealLoginFlow(flow),
      loginFlowCookieOptions(),
    );
    return response;
  } catch (error) {
    if (error instanceof KingshotLoginError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof MemberSessionConfigurationError) {
      return json({ error: error.message, code: 'LOGIN_NOT_CONFIGURED' }, { status: 503 });
    }
    return json({ error: 'Invalid request.' }, { status: 400 });
  }
}

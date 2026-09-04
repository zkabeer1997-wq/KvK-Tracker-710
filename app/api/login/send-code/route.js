import { NextResponse } from 'next/server';
import { KingshotLoginError, sendVerificationCode } from '../../../../lib/kingshotLogin';
import {
  LOGIN_FLOW_COOKIE_NAME,
  loginFlowCookieOptions,
  readLoginFlow,
  sealLoginFlow,
} from '../../../../lib/kingshotLoginState';
import { isCodeRequestRateLimited, recordLoginEvent } from '../../../../lib/kingshotLoginAudit';

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

  try {
    if (await isCodeRequestRateLimited(request, flow.playerId)) {
      return json({
        error: 'Too many verification codes were requested. Please try again later.',
        code: 'CODE_LIMIT',
      }, { status: 429 });
    }

    await recordLoginEvent(request, 'code_requested', flow.playerId);
    const nextFlow = await sendVerificationCode(flow);
    const response = json({ ok: true, state: nextFlow.state });
    response.cookies.set(
      LOGIN_FLOW_COOKIE_NAME,
      sealLoginFlow(nextFlow),
      loginFlowCookieOptions(),
    );
    return response;
  } catch (error) {
    if (error instanceof KingshotLoginError) {
      return json({ error: error.message, code: error.code }, { status: error.status });
    }
    return json({ error: 'The verification code could not be requested.' }, { status: 502 });
  }
}

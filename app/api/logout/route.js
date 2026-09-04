import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '../../../lib/adminAuth';
import {
  MEMBER_COOKIE_NAME,
  memberSessionCookieOptions,
  readMemberSession,
  revokeMemberSession,
} from '../../../lib/memberAuth';
import {
  LOGIN_FLOW_COOKIE_NAME,
  loginFlowCookieOptions,
} from '../../../lib/kingshotLoginState';
import { recordLoginEvent } from '../../../lib/kingshotLoginAudit';

export async function POST(request) {
  const member = await readMemberSession(request);
  try {
    await revokeMemberSession(request);
  } catch (error) {
    console.error('Member session revocation failed.', error);
  }
  if (member) await recordLoginEvent(request, 'logout', member.playerId);

  const response = NextResponse.json({ ok: true });
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(MEMBER_COOKIE_NAME, '', memberSessionCookieOptions(0));
  response.cookies.set(LOGIN_FLOW_COOKIE_NAME, '', loginFlowCookieOptions(0));
  response.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}

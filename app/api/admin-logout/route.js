import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '../../../lib/adminAuth';
import {
  MEMBER_COOKIE_NAME,
  memberSessionCookieOptions,
  revokeMemberSession,
} from '../../../lib/memberAuth';

export async function POST(request) {
  try {
    await revokeMemberSession(request);
  } catch (error) {
    console.error('Member session revocation failed.', error);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  response.cookies.set(MEMBER_COOKIE_NAME, '', memberSessionCookieOptions(0));
  return response;
  }

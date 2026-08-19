import { NextResponse } from 'next/server';
import {
  MEMBER_ACCESS_COOKIE,
  memberCookieOptions,
  requestIsSameOrigin,
  revokeRequestSession,
} from '../../../../lib/memberAccessV2';

export async function POST(request) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403 });
  }

  await revokeRequestSession(request).catch((error) => {
    console.error('member access logout revoke failed', error);
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MEMBER_ACCESS_COOKIE, '', { ...memberCookieOptions(), maxAge: 0 });
  return response;
}

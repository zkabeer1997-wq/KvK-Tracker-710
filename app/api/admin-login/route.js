import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, createAdminSession, SESSION_TTL_SECONDS } from '../../../lib/adminAuth';

export const runtime = 'edge';

export async function POST(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { password } = await request.json();
  if (!process.env.ADMIN_PASSWORD || !password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  try {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, await createAdminSession(), {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Admin sessions are not configured.' }, { status: 503 });
  }
}

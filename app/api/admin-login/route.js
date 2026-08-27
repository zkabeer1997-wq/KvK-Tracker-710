import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, TOKEN_TTL_MS, mintAdminToken } from '../../../lib/adminAuth';

export async function POST(request) {
  const body = await request.json();
  const password = body.password;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword || !password || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

  const token = await mintAdminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_MS / 1000,
    });
  return response;
  }

import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isSameOriginRequest } from '../../../lib/adminAuth';

export const runtime = 'edge';

export async function POST(request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
  }

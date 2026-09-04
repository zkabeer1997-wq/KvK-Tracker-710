import { NextResponse } from 'next/server';
import { readMemberSession } from '../../../lib/memberAuth';
import { readLoginFlow } from '../../../lib/kingshotLoginState';

export async function GET(request) {
  const member = await readMemberSession(request);
  const response = member
    ? NextResponse.json({ state: 'authenticated', profile: member })
    : NextResponse.json({ state: readLoginFlow(request)?.state || 'signed_out' });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}


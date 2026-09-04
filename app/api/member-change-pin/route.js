import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import {
  createMemberToken,
  MEMBER_COOKIE_NAME,
  MEMBER_TOKEN_TTL_MS,
  readMemberSession,
} from '../../../lib/memberAuth';
import { validatePinChange } from '../../../lib/memberPin.mjs';

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request) {
  const session = await readMemberSession(request);
  if (!session) {
    return noStoreJson({ error: 'Please sign in again before changing your PIN.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: 'Invalid request.' }, { status: 400 });
  }

  const currentPin = String(body?.currentPin || '');
  const newPin = String(body?.newPin || '');
  const confirmPin = String(body?.confirmPin || '');
  const validationError = validatePinChange(currentPin, newPin, confirmPin);
  if (validationError) return noStoreJson({ error: validationError }, { status: 400 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('change_member_pin', {
      p_member_id: session.memberId,
      p_current_pin: currentPin,
      p_new_pin: newPin,
    });

    if (error) throw error;
    if (data !== true) {
      return noStoreJson({ error: 'Current PIN is incorrect.' }, { status: 403 });
    }

    const token = await createMemberToken(session.memberId);
    const response = noStoreJson({ ok: true, message: 'Your PIN has been changed.' });
    response.cookies.set(MEMBER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MEMBER_TOKEN_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    console.error('member-change-pin failed', error);
    return noStoreJson({ error: 'Unable to change your PIN right now.' }, { status: 500 });
  }
}

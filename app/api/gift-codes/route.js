import { NextResponse } from 'next/server';
import { readMemberSession } from '../../../lib/memberAuth';
import { getMemberGiftStatus, enrollMemberForGiftCodes } from '../../../lib/giftCodes.mjs';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request) {
  try {
    const session = await readMemberSession(request);
    const memberId = session?.memberId;
    if (!memberId) {
      return noStoreJson({ error: 'Sign in required.' }, { status: 401 });
    }
    const status = await getMemberGiftStatus(memberId);
    return noStoreJson({ ok: true, ...status });
  } catch (error) {
    console.error('gift-codes GET failed', error);
    return noStoreJson({ error: 'Unable to load gift code status.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await readMemberSession(request);
    const memberId = session?.memberId;
    if (!memberId) {
      return noStoreJson({ error: 'Sign in required.' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return noStoreJson({ error: 'Invalid request.' }, { status: 400 });
    }

    const enabled = Boolean(body?.enabled);
    const client = createSupabaseAdminClient();

    if (enabled) {
      await enrollMemberForGiftCodes(memberId, memberId, 710);
    } else {
      await client
        .from('gift_code_enrollments')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('member_id', memberId);
    }

    const status = await getMemberGiftStatus(memberId);
    return noStoreJson({ ok: true, ...status });
  } catch (error) {
    console.error('gift-codes PATCH failed', error);
    return noStoreJson({ error: 'Unable to update gift code preference.' }, { status: 500 });
  }
}

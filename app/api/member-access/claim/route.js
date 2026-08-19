import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import {
  MEMBER_ACCESS_COOKIE,
  cleanMemberId,
  hashPassphrase,
  issueMemberSession,
  memberCookieOptions,
  requestIsSameOrigin,
  validatePassphrase,
} from '../../../../lib/memberAccessV2';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const memberId = cleanMemberId(body?.memberId);
  const currentPin = String(body?.currentPin || '');
  const passphrase = String(body?.passphrase || '');
  const passphraseError = validatePassphrase(passphrase);

  if (!memberId || memberId.length > 120 || !currentPin) {
    return NextResponse.json({ error: 'Enter your Player ID and your existing PIN.' }, { status: 400 });
  }
  if (passphraseError) {
    return NextResponse.json({ error: passphraseError }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: account, error: accountError } = await supabase
      .from('member_access_v2_accounts')
      .select('member_id, display_name, status, claimed_at')
      .eq('member_id', memberId)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account || account.status !== 'active') {
      return NextResponse.json({ error: 'This Player ID is not on the approved secure roster.' }, { status: 403 });
    }
    if (account.claimed_at) {
      return NextResponse.json({ error: 'Secure access is already activated for this Player ID. Use Sign In.' }, { status: 409 });
    }

    // Safe here because membership was established above. The legacy RPC's permissive
    // unknown-ID behavior cannot grant access to an ID absent from member_access_v2_accounts.
    const { data: pinMatches, error: pinError } = await supabase.rpc('verify_page_pin', {
      p_member_id: memberId,
      p_pin: currentPin,
    });
    if (pinError) throw pinError;
    if (pinMatches !== true) {
      return NextResponse.json({ error: 'That existing PIN does not match this Player ID.' }, { status: 401 });
    }

    const { salt, hash } = hashPassphrase(passphrase);
    const now = new Date().toISOString();
    const { data: claimed, error: updateError } = await supabase
      .from('member_access_v2_accounts')
      .update({
        passphrase_salt: salt,
        passphrase_hash: hash,
        claimed_at: now,
        failed_attempts: 0,
        locked_until: null,
        updated_at: now,
      })
      .eq('member_id', memberId)
      .is('claimed_at', null)
      .select('member_id')
      .maybeSingle();
    if (updateError) throw updateError;
    if (!claimed) {
      return NextResponse.json({ error: 'Secure access was activated in another session. Use Sign In.' }, { status: 409 });
    }

    const { token } = await issueMemberSession(memberId, request.headers.get('user-agent'));
    const response = NextResponse.json({ ok: true, memberId, displayName: account.display_name });
    response.cookies.set(MEMBER_ACCESS_COOKIE, token, memberCookieOptions());
    return response;
  } catch (error) {
    console.error('member access activation failed', error);
    return NextResponse.json({ error: 'Unable to activate secure access.' }, { status: 500 });
  }
}

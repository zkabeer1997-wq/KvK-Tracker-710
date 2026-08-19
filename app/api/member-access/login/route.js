import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import {
  MEMBER_ACCESS_COOKIE,
  cleanMemberId,
  issueMemberSession,
  isCurrentlyLocked,
  lockUpdateForFailure,
  memberCookieOptions,
  requestIsSameOrigin,
  verifyPassphrase,
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
  const passphrase = String(body?.passphrase || '');
  if (!memberId || memberId.length > 120 || !passphrase) {
    return NextResponse.json({ error: 'Enter your Player ID and access phrase.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: account, error: accountError } = await supabase
      .from('member_access_v2_accounts')
      .select('member_id, display_name, role, status, claimed_at, passphrase_salt, passphrase_hash, failed_attempts, locked_until')
      .eq('member_id', memberId)
      .maybeSingle();
    if (accountError) throw accountError;

    const genericError = 'Player ID or access phrase is incorrect.';
    if (!account || account.status !== 'active' || !account.claimed_at) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }
    if (isCurrentlyLocked(account)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in about 15 minutes.' }, { status: 429 });
    }

    if (!verifyPassphrase(passphrase, account.passphrase_salt, account.passphrase_hash)) {
      await supabase
        .from('member_access_v2_accounts')
        .update(lockUpdateForFailure(account))
        .eq('member_id', memberId);
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const now = new Date().toISOString();
    await supabase
      .from('member_access_v2_accounts')
      .update({ failed_attempts: 0, locked_until: null, updated_at: now })
      .eq('member_id', memberId);

    const { token } = await issueMemberSession(memberId, request.headers.get('user-agent'));
    const response = NextResponse.json({
      ok: true,
      member: {
        memberId: account.member_id,
        displayName: account.display_name,
        role: account.role,
      },
    });
    response.cookies.set(MEMBER_ACCESS_COOKIE, token, memberCookieOptions());
    return response;
  } catch (error) {
    console.error('member access login failed', error);
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
}

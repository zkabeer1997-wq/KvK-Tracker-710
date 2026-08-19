import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { createMemberToken, MEMBER_COOKIE_NAME } from '../../../lib/memberAuth';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const memberId = String(body?.memberId || '').trim();
  const pin = String(body?.pin || '');
  if (!memberId || memberId.length > 120) {
    return NextResponse.json({ error: 'Please enter a valid Member ID.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('verify_page_pin', {
      p_member_id: memberId,
      p_pin: pin,
    });

    if (error) throw error;
    if (data !== true) {
      return NextResponse.json({ error: 'Incorrect PIN for this Member ID.' }, { status: 401 });
    }

    const token = await createMemberToken(memberId);
    const response = NextResponse.json({ ok: true, memberId });
    response.cookies.set(MEMBER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    console.error('member-login failed', error);
    return NextResponse.json({ error: 'Unable to verify member access.' }, { status: 500 });
  }
}

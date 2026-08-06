import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

export async function POST(request) {
  try {
    const { member_id, pin } = await request.json();
    const memberId = String(member_id || '').trim().slice(0, 100);
    if (!memberId) return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 });
    const { data, error } = await createAdminSupabaseClient().rpc('verify_page_pin', { p_member_id: memberId, p_pin: String(pin || '').slice(0, 100) });
    if (error) return NextResponse.json({ error: 'Unable to verify access.' }, { status: 500 });
    return NextResponse.json({ valid: data === true });
  } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
}

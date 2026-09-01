import { NextResponse } from 'next/server';
import { readMemberSession } from '../../../lib/memberAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  const session = await readMemberSession(request);
  if (!session) return NextResponse.json({ error: 'Member login required.' }, { status: 401 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('power_profiles')
      .select('member_id,charms,updated_at')
      .eq('member_id', session.memberId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ profile: data || null });
  } catch (error) {
    console.error('member-charm-profile GET failed', error);
    return NextResponse.json({ error: 'Unable to load saved charm levels.' }, { status: 500 });
  }
}

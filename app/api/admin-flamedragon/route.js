import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const ADMIN_COLUMNS = 'member_id,name,current_alliance,infantry_tier,infantry_tg,cavalry_tier,cavalry_tg,archer_tier,archer_tg,heroes,charms,governor_gear,pet_power,masters_power,mystic_trial_score,availability,voice_chat,auto_help,updated_at';

function isMissingTableError(error) {
  return error && (
    error.code === '42P01' || String(error.message || '').toLowerCase().includes('flamedragon_forms')
  );
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('flamedragon_forms')
      .select(ADMIN_COLUMNS)
      .order('updated_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ rows: [], configured: false });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data || [], configured: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

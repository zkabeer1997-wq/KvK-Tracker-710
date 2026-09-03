import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../../lib/adminSupabase';

export async function GET(request, { params: paramsPromise }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = await paramsPromise;
  const cycleId = params?.cycleId;
  if (!cycleId) {
    return NextResponse.json({ error: 'Missing cycle id.' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('noble_advisor_submissions_archive')
      .select('*')
      .eq('cycle_archive_id', cycleId)
      .order('in_game_name', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

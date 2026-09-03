import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../../../lib/adminSupabase';

export async function GET(request, { params: paramsPromise }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const params = await paramsPromise;
  const eventId = params?.eventId;
  if (!eventId) {
    return NextResponse.json({ error: 'Missing event id.' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('flamedragon_forms_archive')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

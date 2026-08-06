import { NextResponse } from 'next/server';
import { isAdminRequest, isSameOriginRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

export async function GET(request) {
  if (!(await isAdminRequest(request)) || !isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('prep_backpack_submissions')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

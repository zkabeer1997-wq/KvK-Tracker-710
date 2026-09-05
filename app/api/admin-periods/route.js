import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const SCOPES = ['members', 'prep'];
const ARCHIVE_FN = {
  members: 'admin_archive_members_period',
  prep: 'admin_archive_prep_period',
};

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const scope = new URL(request.url).searchParams.get('scope');
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kvk_periods')
      .select('id, scope, label, archived_at')
      .eq('scope', scope)
      .order('archived_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ periods: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Snapshots the live table(s) for `scope` into a new named period. This is
// copy-only: it never deletes or modifies a row in the live tables, so
// existing member logins/PINs and roster data are untouched.
export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const scope = payload && payload.scope;
  const label = String((payload && payload.label) || '').trim();
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 });
  }
  if (!label) {
    return NextResponse.json({ error: 'A label is required for the new period.' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data: period, error: insertError } = await supabase
      .from('kvk_periods')
      .insert({ scope, label })
      .select('id, scope, label, archived_at')
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    const { error: archiveError } = await supabase.rpc(ARCHIVE_FN[scope], { p_period_id: period.id });
    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }
    return NextResponse.json({ period });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

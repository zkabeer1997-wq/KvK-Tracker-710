import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

// Backed by the pre-existing event_cycle_archives / archive_cycle_occurrence
// system (see supabase/event_cycle_archive_safety.sql) rather than a new
// table of our own - "scope" here is this feature's word for what that
// system calls "kind".
const SCOPE_TO_KIND = { members: 'kvk', prep: 'prep' };

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const scope = new URL(request.url).searchParams.get('scope');
  const kind = SCOPE_TO_KIND[scope];
  if (!kind) {
    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('event_cycle_archives')
      .select('id, label, archived_at')
      .eq('kind', kind)
      .order('archived_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ periods: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Snapshots the live table(s) for `scope` into a new named period via the
// copy-only archive_cycle_occurrence() RPC. This never deletes or modifies
// a row in the live tables, so existing member logins/PINs and roster data
// are untouched.
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
  const kind = SCOPE_TO_KIND[payload && payload.scope];
  const label = String((payload && payload.label) || '').trim();
  if (!kind) {
    return NextResponse.json({ error: 'Unsupported scope' }, { status: 400 });
  }
  if (!label) {
    return NextResponse.json({ error: 'A label is required for the new period.' }, { status: 400 });
  }
  try {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const { data: cycleId, error: archiveError } = await supabase.rpc('archive_cycle_occurrence', {
      p_kind: kind,
      p_event_id: null,
      p_starts_at: now,
      p_ends_at: now,
      p_label: label,
    });
    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }
    if (!cycleId) {
      return NextResponse.json({ error: 'Could not start a new period. Please try again.' }, { status: 500 });
    }
    const { data: period, error: fetchError } = await supabase
      .from('event_cycle_archives')
      .select('id, label, archived_at')
      .eq('id', cycleId)
      .single();
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    return NextResponse.json({ period });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

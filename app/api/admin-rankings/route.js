import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';
import { parseRankingCsv } from '../../../lib/rankingCsv';

const SCOPES = ['kingdom', 'alliance', 'player'];

async function requireAdmin(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('ranking_snapshots')
    .select('id, scope, metric, source, rows, captured_at, published')
    .order('captured_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ snapshots: data || [] });
}

// Append-only: every POST creates a new snapshot row. There is no PUT/PATCH
// here — correcting a bad upload means deleting that snapshot (DELETE on
// /api/admin-rankings/[id]) and posting a new one, so trend deltas always
// compare real historical uploads, never an edited-in-place row.
export async function POST(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const scope = String(body.scope || '').trim();
  const metric = String(body.metric || '').trim();

  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: 'Scope must be kingdom, alliance, or player.' }, { status: 400 });
  }
  if (!metric) {
    return NextResponse.json({ error: 'Metric is required, e.g. "Total Power" or "KvK Points".' }, { status: 400 });
  }

  const { rows, errors } = parseRankingCsv(body.csv);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Could not parse the pasted data.', details: errors }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows found. Paste one "rank,name,value" line per row.' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('ranking_snapshots')
    .insert({
      scope,
      metric,
      source: body.source ? String(body.source) : null,
      rows,
      published: Boolean(body.published),
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/rankings');

  return NextResponse.json({ snapshot: data });
}

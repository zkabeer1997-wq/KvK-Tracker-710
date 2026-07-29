import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isValidAdminToken } from '../../../lib/adminAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import {
  formatRallyRows,
  serializeRalliesForSave,
} from '../../admin/dashboard/rallyState.mjs';

export const runtime = 'edge';

async function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminToken(token);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function GET(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('admin_rallies')
    .select('id, name, position, member_ids, lead_member_id, formation')
    .order('position', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rallies: formatRallyRows(data || []) });
}

export async function PUT(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const body = await request.json();
  const rallies = Array.isArray(body.rallies) ? body.rallies : [];
  const rows = serializeRalliesForSave(rallies);

  const deleteResult = await supabase.from('admin_rallies').delete().neq('id', '');
  if (deleteResult.error) {
    return NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
  }

  if (rows.length > 0) {
    const insertResult = await supabase.from('admin_rallies').insert(rows);
    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ rallies });
}

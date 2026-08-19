import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { requestIsSameOrigin } from '../../../lib/memberAccessV2';

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: accounts, error: accountError }, { data: submissions, error: submissionError }] = await Promise.all([
      supabase
        .from('member_access_v2_accounts')
        .select('member_id, display_name, role, status, claimed_at, approved_at, approved_by, locked_until, updated_at')
        .order('display_name', { ascending: true }),
      supabase
        .from('submissions')
        .select('member_id, name, current_alliance, updated_at')
        .order('name', { ascending: true }),
    ]);
    if (accountError) throw accountError;
    if (submissionError) throw submissionError;

    const accountIds = new Set((accounts || []).map((row) => String(row.member_id)));
    const pending = (submissions || []).filter((row) => !accountIds.has(String(row.member_id)));
    return NextResponse.json({ accounts: accounts || [], pending });
  } catch (error) {
    console.error('admin member access load failed', error);
    return NextResponse.json({ error: 'Unable to load access controls.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: 'Request origin was not accepted.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const action = String(body?.action || '');
  const memberId = String(body?.memberId || '').trim();
  if (!memberId || memberId.length > 120) {
    return NextResponse.json({ error: 'A valid Player ID is required.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    if (action === 'approve') {
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('member_id, name')
        .eq('member_id', memberId)
        .maybeSingle();
      if (submissionError) throw submissionError;
      if (!submission) return NextResponse.json({ error: 'No Player Record exists for that ID.' }, { status: 404 });

      const { error } = await supabase.from('member_access_v2_accounts').upsert({
        member_id: memberId,
        display_name: submission.name || memberId,
        role: 'member',
        status: 'active',
        approved_at: now,
        approved_by: 'admin_dashboard',
        updated_at: now,
      }, { onConflict: 'member_id' });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'revoke' || action === 'restore') {
      const status = action === 'revoke' ? 'revoked' : 'active';
      const { error } = await supabase
        .from('member_access_v2_accounts')
        .update({ status, updated_at: now })
        .eq('member_id', memberId);
      if (error) throw error;
      if (action === 'revoke') {
        await supabase
          .from('member_access_v2_sessions')
          .update({ revoked_at: now })
          .eq('member_id', memberId)
          .is('revoked_at', null);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'role') {
      const role = String(body?.role || '');
      if (!['member', 'leadership', 'recruitment', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }
      const { error } = await supabase
        .from('member_access_v2_accounts')
        .update({ role, updated_at: now })
        .eq('member_id', memberId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('admin member access action failed', error);
    return NextResponse.json({ error: 'Unable to update member access.' }, { status: 500 });
  }
}

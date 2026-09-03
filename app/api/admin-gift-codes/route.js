import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import {
  getAdminGiftOverview,
  discoverWikiCodes,
  processRedemptionQueue,
  enrollMemberForGiftCodes,
} from '../../../lib/giftCodes.mjs';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return noStoreJson({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const overview = await getAdminGiftOverview();
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    let history = [];
    if (q) {
      const client = createSupabaseAdminClient();
      const { data } = await client
        .from('gift_code_redemptions')
        .select('id, player_id, code, status, attempts, last_response, completed_at, created_at')
        .or(`player_id.ilike.%${q}%,code.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(100);
      history = data || [];
    }
    return noStoreJson({ ok: true, ...overview, history });
  } catch (error) {
    console.error('admin-gift-codes GET failed', error);
    return noStoreJson({ error: 'Unable to load gift codes.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return noStoreJson({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: 'Invalid request.' }, { status: 400 });
  }

  const action = String(body?.action || '').trim();
  const client = createSupabaseAdminClient();

  try {
    if (action === 'check_wiki') {
      const discovery = await discoverWikiCodes({ supabase: client });
      return noStoreJson({ ok: true, discovery });
    }

    if (action === 'process_queue') {
      const queue = await processRedemptionQueue({
        limit: Math.min(Number(body?.limit) || 10, 25),
        workerId: 'admin',
      });
      return noStoreJson({ ok: true, queue });
    }

    if (action === 'add_code') {
      const code = String(body?.code || '').trim().toUpperCase();
      if (!code || code.length < 4 || code.length > 32) {
        return noStoreJson({ error: 'Invalid code.' }, { status: 400 });
      }
      const { error } = await client.from('gift_codes').upsert(
        {
          code,
          source: body?.source || 'manual',
          active: true,
          discovered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: body?.notes || null,
        },
        { onConflict: 'code' }
      );
      if (error) throw error;
      const { data: enrollments } = await client
        .from('gift_code_enrollments')
        .select('id')
        .eq('enabled', true);
      for (const e of enrollments || []) {
        await client.rpc('gift_code_queue_for_enrollment', { p_enrollment_id: e.id });
      }
      return noStoreJson({ ok: true, code });
    }

    if (action === 'set_code_active') {
      const code = String(body?.code || '').trim().toUpperCase();
      const active = Boolean(body?.active);
      await client
        .from('gift_codes')
        .update({
          active,
          expired_at: active ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('code', code);
      return noStoreJson({ ok: true });
    }

    if (action === 'enroll_member') {
      const memberId = String(body?.memberId || '').trim();
      const playerId = String(body?.playerId || memberId).trim();
      if (!memberId) return noStoreJson({ error: 'memberId required' }, { status: 400 });
      const id = await enrollMemberForGiftCodes(memberId, playerId, 710);
      return noStoreJson({ ok: true, enrollmentId: id });
    }

    if (action === 'retry_failures') {
      await client
        .from('gift_code_redemptions')
        .update({
          status: 'pending',
          next_retry_at: null,
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'temporary_failure');
      const queue = await processRedemptionQueue({ limit: 15, workerId: 'admin-retry' });
      return noStoreJson({ ok: true, queue });
    }

    return noStoreJson({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('admin-gift-codes POST failed', error);
    return noStoreJson({ error: error?.message || 'Action failed.' }, { status: 500 });
  }
}

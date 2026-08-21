import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../lib/adminAuth';
import { createAdminSupabaseClient } from '../../../lib/adminSupabase';

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

function noStoreJson(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function pinStatus(pinHash) {
  return BCRYPT_HASH_RE.test(String(pinHash || '')) ? 'secured' : 'needs_reset';
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return noStoreJson({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('submissions')
      .select('name,member_id,pin_hash,updated_at')
      .order('name', { ascending: true });

    if (error) throw error;

    return noStoreJson({
      rows: (data || []).map((row) => ({
        name: row.name || '',
        member_id: row.member_id || '',
        pin_status: pinStatus(row.pin_hash),
        updated_at: row.updated_at || null,
      })),
    });
  } catch (error) {
    console.error('admin-member-pins GET failed', error);
    return noStoreJson({ error: 'Unable to load member PIN status.' }, { status: 500 });
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

  const memberId = String(body?.memberId || '').trim();
  if (!memberId || memberId.length > 120) {
    return noStoreJson({ error: 'Invalid Member ID.' }, { status: 400 });
  }

  // Generate on the server so the replacement PIN is unpredictable and never
  // supplied by an unauthenticated client. Leading zeroes are allowed.
  const newPin = String(randomInt(0, 1_000_000)).padStart(6, '0');

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc('admin_reset_member_pin', {
      p_member_id: memberId,
      p_new_pin: newPin,
    });

    if (error) throw error;
    if (data !== true) {
      return noStoreJson({ error: 'Member not found.' }, { status: 404 });
    }

    return noStoreJson({
      ok: true,
      memberId,
      pin: newPin,
      message: 'PIN reset. This replacement PIN is shown only in this response.',
    });
  } catch (error) {
    console.error('admin-member-pins POST failed', error);
    return noStoreJson({ error: 'Unable to reset member PIN.' }, { status: 500 });
  }
}

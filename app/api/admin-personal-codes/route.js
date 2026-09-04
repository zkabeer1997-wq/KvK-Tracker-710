import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { readMemberSession } from '../../../lib/memberAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

function json(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request) {
  const actor = await readMemberSession(request);
  if (actor?.role !== 'superadmin') {
    return json({ error: 'Superadmin access required.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, { status: 400 });
  }

  const targetPlayerId = String(body?.playerId || '').trim();
  if (!/^\d{4,20}$/.test(targetPlayerId)) {
    return json({ error: 'Choose a valid user.' }, { status: 400 });
  }

  // Generate server-side with unbiased cryptographic randomness. The plaintext
  // value is returned once; PostgreSQL persists only its bcrypt hash.
  const personalCode = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const { data, error } = await createSupabaseAdminClient().rpc('reset_kingshot_personal_code', {
    p_actor_player_id: actor.playerId,
    p_target_player_id: targetPlayerId,
    p_personal_code: personalCode,
  });

  if (error || data !== true) {
    const message = String(error?.message || '');
    if (message.includes('user_not_found')) {
      return json({ error: 'That user no longer exists.' }, { status: 404 });
    }
    if (message.includes('superadmin_required')) {
      return json({ error: 'Superadmin access required.' }, { status: 403 });
    }
    return json({ error: 'The personal code could not be reset.' }, { status: 500 });
  }

  return json({
    ok: true,
    playerId: targetPlayerId,
    personalCode,
    message: 'Personal code reset. This code is shown only in this response.',
  });
}

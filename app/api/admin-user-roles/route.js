import { NextResponse } from 'next/server';
import { readMemberSession } from '../../../lib/memberAuth';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

const ROLES = new Set(['member', 'admin', 'superadmin']);

function json(body, init = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function requireSuperadmin(request) {
  const session = await readMemberSession(request);
  return session?.role === 'superadmin' ? session : null;
}

export async function GET(request) {
  const actor = await requireSuperadmin(request);
  if (!actor) return json({ error: 'Superadmin access required.' }, { status: 403 });

  const { data, error } = await createSupabaseAdminClient()
    .from('kingshot_users')
    .select('player_id, nickname, avatar_url, kingdom_id, alliance_abbr, alliance_name, access_role, personal_code_hash, last_login_at')
    .order('nickname', { ascending: true });
  if (error) return json({ error: 'User access could not be loaded.' }, { status: 500 });
  const users = (data || []).map(({ personal_code_hash: personalCodeHash, ...user }) => ({
    ...user,
    personal_code_configured: /^\$2[aby]\$\d{2}\$/.test(String(personalCodeHash || '')),
  }));
  return json({ users, actorPlayerId: actor.playerId });
}

export async function PATCH(request) {
  const actor = await requireSuperadmin(request);
  if (!actor) return json({ error: 'Superadmin access required.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, { status: 400 });
  }

  const targetPlayerId = String(body?.playerId || '').trim();
  const accessRole = String(body?.role || '').trim();
  if (!/^\d{4,20}$/.test(targetPlayerId) || !ROLES.has(accessRole)) {
    return json({ error: 'Choose a valid user and role.' }, { status: 400 });
  }
  if (targetPlayerId === actor.playerId && accessRole !== 'superadmin') {
    return json({ error: 'You cannot remove your own superadmin access.' }, { status: 400 });
  }

  const { data, error } = await createSupabaseAdminClient().rpc('set_kingshot_user_role', {
    p_actor_player_id: actor.playerId,
    p_target_player_id: targetPlayerId,
    p_access_role: accessRole,
  });
  if (error) {
    const message = String(error.message || '');
    if (message.includes('cannot_remove_own_superadmin')) {
      return json({ error: 'You cannot remove your own superadmin access.' }, { status: 400 });
    }
    if (message.includes('user_not_found')) {
      return json({ error: 'That user no longer exists.' }, { status: 404 });
    }
    return json({ error: 'The role could not be updated.' }, { status: 500 });
  }

  return json({ ok: true, user: Array.isArray(data) ? data[0] : data });
}


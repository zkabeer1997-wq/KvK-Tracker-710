import crypto from 'node:crypto';
import { createAdminSupabaseClient } from './adminSupabase.js';
import { getMemberSessionSecret } from './memberSessionSecret.js';

export const MEMBER_COOKIE_NAME = 'k710_member_session';
export const MEMBER_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MEMBER_TOKEN_TTL_MS = MEMBER_TOKEN_TTL_SECONDS * 1000;

function getSecret() {
  return getMemberSessionSecret();
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function requestHeader(request, name) {
  if (typeof request?.headers?.get === 'function') return request.headers.get(name) || '';
  return request?.headers?.[name] || '';
}

function privateFingerprint(value, purpose) {
  const secret = getSecret();
  if (!value || !secret) return null;
  return crypto
    .createHash('sha256')
    .update(`${purpose}:${secret}:${value}`)
    .digest('hex');
}

export function memberSessionCookieOptions(maxAge = MEMBER_TOKEN_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

export function memberSessionExpiresAt(now = Date.now()) {
  return new Date(now + MEMBER_TOKEN_TTL_MS).toISOString();
}

export async function createMemberSession(playerId, request) {
  const clean = String(playerId || '').trim();
  if (!/^\d{4,20}$/.test(clean) || !getSecret()) {
    throw new Error('Member sessions are not configured.');
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = memberSessionExpiresAt();
  const forwarded = requestHeader(request, 'x-forwarded-for').split(',')[0].trim();
  const ip = forwarded || requestHeader(request, 'x-real-ip');
  const userAgent = requestHeader(request, 'user-agent');
  const { error } = await createAdminSupabaseClient().from('kingshot_sessions').insert({
    token_hash: tokenHash(token),
    player_id: clean,
    expires_at: expiresAt,
    source_fingerprint: privateFingerprint(ip, 'source'),
    user_agent_fingerprint: privateFingerprint(userAgent, 'user-agent'),
  });
  if (error) throw error;
  return { token, expiresAt };
}

export async function readMemberSession(request) {
  const raw = request?.cookies?.get(MEMBER_COOKIE_NAME)?.value || '';
  if (!raw || !getSecret()) return null;

  // Synthetic route tests can explicitly opt into the retired signed-token
  // format. Production never accepts those tokens.
  if (process.env.K710_ENABLE_LEGACY_MEMBER_SESSION === 'true') {
    const legacy = await readLegacyMemberToken(raw);
    if (legacy) return legacy;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: storedSession, error: sessionError } = await supabase
      .from('kingshot_sessions')
      .select('player_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash(raw))
      .maybeSingle();
    if (sessionError || !storedSession || storedSession.revoked_at) return null;
    if (new Date(storedSession.expires_at).getTime() <= Date.now()) return null;

    const { data: user, error: userError } = await supabase
      .from('kingshot_users')
      .select('player_id, nickname, avatar_url, kingdom_id, access_role, alliance_id, alliance_abbr, alliance_name, alliance_rank, power, kills, mystic_trial, coordinate_x, coordinate_y')
      .eq('player_id', storedSession.player_id)
      .maybeSingle();
    if (userError || !user || Number(user.kingdom_id) !== 710) return null;

    return {
      memberId: String(user.player_id),
      playerId: String(user.player_id),
      nickname: String(user.nickname || ''),
      avatarUrl: String(user.avatar_url || ''),
      kingdomId: Number(user.kingdom_id),
      role: String(user.access_role || 'member'),
      allianceId: user.alliance_id == null ? null : Number(user.alliance_id),
      allianceAbbr: String(user.alliance_abbr || ''),
      allianceName: String(user.alliance_name || ''),
      allianceRank: user.alliance_rank == null ? null : Number(user.alliance_rank),
      power: user.power == null ? null : Number(user.power),
      kills: user.kills == null ? null : Number(user.kills),
      mysticTrial: user.mystic_trial == null ? null : Number(user.mystic_trial),
      x: user.coordinate_x == null ? null : Number(user.coordinate_x),
      y: user.coordinate_y == null ? null : Number(user.coordinate_y),
    };
  } catch {
    return null;
  }
}

export async function revokeMemberSession(request) {
  const raw = request?.cookies?.get(MEMBER_COOKIE_NAME)?.value || '';
  if (!raw || !getSecret()) return;
  const { error } = await createAdminSupabaseClient()
    .from('kingshot_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash(raw));
  if (error) throw error;
}

// Compatibility helpers retained only for the repository's synthetic route
// tests. The live application creates opaque database sessions above.
async function legacySignature(payload) {
  return tokenHash(`k710-member-v2:${payload}:${getSecret()}`);
}

export async function createMemberToken(memberId) {
  const clean = String(memberId || '').trim();
  if (!clean || !getSecret()) throw new Error('Member sessions are not configured.');
  const payload = Buffer.from(JSON.stringify({
    memberId: clean,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 12 * 60 * 60 * 1000,
  }), 'utf8').toString('base64url');
  return `${payload}.${await legacySignature(payload)}`;
}

async function readLegacyMemberToken(raw) {
  const [payload, signature] = String(raw).split('.');
  if (!payload || !signature) return null;
  const expected = await legacySignature(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    const memberId = String(data.memberId || '').trim();
    return memberId ? { memberId, playerId: memberId, role: 'member' } : null;
  } catch {
    return null;
  }
}

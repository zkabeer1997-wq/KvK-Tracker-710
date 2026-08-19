import crypto from 'crypto';
import { createSupabaseAdminClient } from './supabaseAdmin';

export const MEMBER_ACCESS_COOKIE = 'k710_member_access_v2';
export const MEMBER_ACCESS_MAX_AGE = 60 * 60 * 24 * 7;

const MIN_PASSPHRASE_LENGTH = 10;
const MAX_PASSPHRASE_LENGTH = 96;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export function cleanMemberId(value) {
  return String(value || '').trim();
}

export function validatePassphrase(value) {
  const passphrase = String(value || '');
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    return `Use at least ${MIN_PASSPHRASE_LENGTH} characters.`;
  }
  if (passphrase.length > MAX_PASSPHRASE_LENGTH) {
    return `Use no more than ${MAX_PASSPHRASE_LENGTH} characters.`;
  }
  return '';
}

export function hashPassphrase(passphrase, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(passphrase), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassphrase(passphrase, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = crypto.scryptSync(String(passphrase), salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export function memberCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MEMBER_ACCESS_MAX_AGE,
  };
}

export function requestIsSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function issueMemberSession(memberId, userAgent = '') {
  const supabase = createSupabaseAdminClient();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + MEMBER_ACCESS_MAX_AGE * 1000).toISOString();

  const { error } = await supabase.from('member_access_v2_sessions').insert({
    token_hash: tokenHash,
    member_id: memberId,
    expires_at: expiresAt,
    user_agent: String(userAgent || '').slice(0, 500) || null,
  });
  if (error) throw error;
  return { token, expiresAt };
}

export async function getMemberAccessByToken(token) {
  if (!token) return null;
  const supabase = createSupabaseAdminClient();
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from('member_access_v2_sessions')
    .select('token_hash, member_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (sessionError || !session || session.revoked_at || session.expires_at <= now) return null;

  const { data: account, error: accountError } = await supabase
    .from('member_access_v2_accounts')
    .select('member_id, display_name, role, status, claimed_at')
    .eq('member_id', session.member_id)
    .maybeSingle();
  if (accountError || !account || account.status !== 'active' || !account.claimed_at) return null;

  return account;
}

export async function getRequestMemberAccess(request) {
  const token = request.cookies.get(MEMBER_ACCESS_COOKIE)?.value || '';
  return getMemberAccessByToken(token);
}

export async function revokeRequestSession(request) {
  const token = request.cookies.get(MEMBER_ACCESS_COOKIE)?.value || '';
  if (!token) return;
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('member_access_v2_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', hashSessionToken(token))
    .is('revoked_at', null);
}

export function lockUpdateForFailure(account) {
  const attempts = Number(account?.failed_attempts || 0) + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      failed_attempts: 0,
      locked_until: new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return {
    failed_attempts: attempts,
    locked_until: null,
    updated_at: new Date().toISOString(),
  };
}

export function isCurrentlyLocked(account) {
  return Boolean(account?.locked_until && new Date(account.locked_until).getTime() > Date.now());
}

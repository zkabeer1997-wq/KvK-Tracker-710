export const MEMBER_COOKIE_NAME = 'k710_member_session';

function getSecret() {
  return process.env.MEMBER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || '';
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export async function createMemberToken(memberId) {
  const clean = String(memberId || '').trim();
  const secret = getSecret();
  if (!clean || !secret) throw new Error('Member sessions are not configured.');
  const payload = toBase64Url(clean);
  const signature = await sha256Hex(`k710-member-v1:${payload}:${secret}`);
  return `${payload}.${signature}`;
}

export async function readMemberSession(request) {
  const raw = request.cookies.get(MEMBER_COOKIE_NAME)?.value || '';
  const secret = getSecret();
  if (!raw || !secret) return null;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;
  const expected = await sha256Hex(`k710-member-v1:${payload}:${secret}`);
  if (signature !== expected) return null;

  try {
    const memberId = fromBase64Url(payload).trim();
    return memberId && memberId.length <= 120 ? { memberId } : null;
  } catch {
    return null;
  }
}

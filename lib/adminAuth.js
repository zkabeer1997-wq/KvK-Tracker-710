const ADMIN_COOKIE_NAME = 'tff_admin_session';
const SESSION_TTL_SECONDS = 60 * 60;

function encoder() {
  return new TextEncoder();
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

async function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  const key = await crypto.subtle.importKey('raw', encoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder().encode(payload));
  return base64Url(new Uint8Array(signature));
}

export async function createAdminSession() {
  const payload = base64Url(encoder().encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, nonce: crypto.randomUUID() })));
  return `${payload}.${await sign(payload)}`;
}

export async function isValidAdminToken(token) {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expectedSignature = await sign(payload);
  if (!timingSafeEqual(signature, expectedSignature)) return false;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0))));
    return Number.isInteger(decoded.exp) && decoded.exp > Math.floor(Date.now() / 1000) && typeof decoded.nonce === 'string' && decoded.nonce.length >= 16;
  } catch {
    return false;
  }
}

export async function isAdminRequest(request) {
  return isValidAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function isSameOriginRequest(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return true;
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  return Boolean(origin && host && new URL(origin).host === host);
}

export { ADMIN_COOKIE_NAME, SESSION_TTL_SECONDS };

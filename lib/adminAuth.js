const ADMIN_COOKIE_NAME = 'tff_admin_session';

async function sha256Hex(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
}

export async function computeAdminToken() {
  const secret = process.env.ADMIN_PASSWORD || '';
  return sha256Hex('tff-admin-session-v1:' + secret);
}

export { ADMIN_COOKIE_NAME };

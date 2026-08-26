const ADMIN_COOKIE_NAME = 'tff_admin_session';

async function sha256Hex(input) {
 const enc = new TextEncoder();
 const data = enc.encode(input);
 const hashBuffer = await crypto.subtle.digest('SHA-256', data);
 return Array.from(new Uint8Array(hashBuffer))
 .map((b) => b.toString(16).padStart(2, '0'))
 .join('');
}

// Length-independent equality. node:crypto's timingSafeEqual is unavailable on
// the edge runtime, where middleware.js calls into this module, so compare by
// XOR-accumulating char codes instead of short-circuiting on first mismatch.
function safeEqual(a, b) {
 const left = String(a || '');
 const right = String(b || '');
 if (left.length !== right.length) return false;
 let diff = 0;
 for (let i = 0; i < left.length; i += 1) {
 diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
 }
 return diff === 0;
}

export async function computeAdminToken() {
 const secret = process.env.ADMIN_PASSWORD || '';
 return sha256Hex('tff-admin-session-v1:' + secret);
}

export async function isValidAdminToken(token) {
 if (!process.env.ADMIN_PASSWORD) return false;
 if (!token) return false;
 const expected = await computeAdminToken();
 if (!expected) return false;
 return safeEqual(token, expected);
}

export async function isAdminRequest(request) {
 const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
 return isValidAdminToken(cookie && cookie.value);
}

export { ADMIN_COOKIE_NAME };

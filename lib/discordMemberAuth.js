const DISCORD_API = 'https://discord.com/api/v10';
export const DISCORD_PENDING_COOKIE = 'k710_discord_pending';
export const DISCORD_STATE_COOKIE = 'k710_discord_state';

function secret() {
  return process.env.MEMBER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_PASSWORD || '';
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}
function unb64(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signDiscordPayload(data, ttlMs = 10 * 60 * 1000) {
  const key = secret();
  if (!key) throw new Error('Member auth signing is not configured.');
  const payload = b64(JSON.stringify({ ...data, exp: Date.now() + ttlMs, nonce: crypto.randomUUID() }));
  const sig = await sha256Hex(`k710-discord:${payload}:${key}`);
  return `${payload}.${sig}`;
}

export async function readDiscordPayload(raw) {
  const key = secret();
  if (!raw || !key) return null;
  const [payload, sig] = String(raw).split('.');
  if (!payload || !sig) return null;
  const expected = await sha256Hex(`k710-discord:${payload}:${key}`);
  if (!safeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(unb64(payload));
    if (!Number.isFinite(parsed.exp) || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function discordConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
  const guildId = process.env.DISCORD_GUILD_ID || '';
  const redirectUri = process.env.DISCORD_REDIRECT_URI || '';
  if (!clientId || !clientSecret || !guildId || !redirectUri) {
    throw new Error('Discord member login is not configured.');
  }
  return { clientId, clientSecret, guildId, redirectUri };
}

export function discordAuthorizeUrl(state) {
  const { clientId, redirectUri } = discordConfig();
  const qs = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${qs.toString()}`;
}

export async function exchangeDiscordCode(code) {
  const { clientId, clientSecret, redirectUri } = discordConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Discord token exchange failed.');
  return res.json();
}

export async function fetchDiscordIdentity(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [userRes, guildsRes] = await Promise.all([
    fetch(`${DISCORD_API}/users/@me`, { headers, cache: 'no-store' }),
    fetch(`${DISCORD_API}/users/@me/guilds`, { headers, cache: 'no-store' }),
  ]);
  if (!userRes.ok || !guildsRes.ok) throw new Error('Discord identity lookup failed.');
  const user = await userRes.json();
  const guilds = await guildsRes.json();
  return { user, guilds: Array.isArray(guilds) ? guilds : [] };
}

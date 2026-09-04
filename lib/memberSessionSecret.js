import crypto from 'node:crypto';

const DEVELOPMENT_SECRET_SLOT = Symbol.for('k710.member-session-development-secret');

export class MemberSessionConfigurationError extends Error {
  constructor() {
    super('Member login is not configured. Set MEMBER_SESSION_SECRET on the server.');
    this.name = 'MemberSessionConfigurationError';
  }
}

export function getMemberSessionSecret() {
  const configured = (
    process.env.MEMBER_SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || ''
  ).trim();
  if (configured) return configured;

  // Local development can exercise the Kingshot flow before Supabase is
  // configured. Keep one random value across Next.js hot reloads, but never
  // use this fallback in a production process.
  if (process.env.NODE_ENV === 'development') {
    if (!globalThis[DEVELOPMENT_SECRET_SLOT]) {
      globalThis[DEVELOPMENT_SECRET_SLOT] = crypto.randomBytes(32).toString('base64url');
    }
    return globalThis[DEVELOPMENT_SECRET_SLOT];
  }

  return '';
}

export function requireMemberSessionSecret() {
  const secret = getMemberSessionSecret();
  if (!secret) throw new MemberSessionConfigurationError();
  return secret;
}

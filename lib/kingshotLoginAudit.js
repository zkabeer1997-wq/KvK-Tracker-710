import crypto from 'node:crypto';
import { createSupabaseAdminClient } from './supabaseAdmin';
import { getMemberSessionSecret } from './memberSessionSecret.js';

function secret() {
  return getMemberSessionSecret();
}

function fingerprint(value, purpose) {
  if (!value || !secret()) return null;
  return crypto
    .createHash('sha256')
    .update(`${purpose}:${secret()}:${value}`)
    .digest('hex');
}

function sourceIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || ''
  );
}

export async function recordLoginEvent(request, eventType, playerId, metadata = {}) {
  try {
    await createSupabaseAdminClient().from('kingshot_login_events').insert({
      player_id_fingerprint: fingerprint(String(playerId || ''), 'player'),
      source_fingerprint: fingerprint(sourceIp(request), 'source'),
      event_type: eventType,
      metadata,
    });
  } catch {
    // Audit storage must never leak credentials or replace the primary error.
  }
}

export async function isCodeRequestRateLimited(request, playerId) {
  try {
    const db = createSupabaseAdminClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const playerFingerprint = fingerprint(String(playerId || ''), 'player');
    const sourceFingerprint = fingerprint(sourceIp(request), 'source');
    const [playerResult, sourceResult] = await Promise.all([
      db
        .from('kingshot_login_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'code_requested')
        .eq('player_id_fingerprint', playerFingerprint)
        .gte('occurred_at', since),
      sourceFingerprint
        ? db
          .from('kingshot_login_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'code_requested')
          .eq('source_fingerprint', sourceFingerprint)
          .gte('occurred_at', since)
        : Promise.resolve({ count: 0 }),
    ]);
    return (playerResult.count || 0) >= 4 || (sourceResult.count || 0) >= 10;
  } catch {
    return false;
  }
}

export async function isPersonalCodeRateLimited(request, playerId) {
  try {
    const db = createSupabaseAdminClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const playerFingerprint = fingerprint(String(playerId || ''), 'player');
    const sourceFingerprint = fingerprint(sourceIp(request), 'source');
    const [playerResult, sourceResult] = await Promise.all([
      db
        .from('kingshot_login_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'verification_failed')
        .eq('player_id_fingerprint', playerFingerprint)
        .gte('occurred_at', since),
      sourceFingerprint
        ? db
          .from('kingshot_login_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'verification_failed')
          .eq('source_fingerprint', sourceFingerprint)
          .gte('occurred_at', since)
        : Promise.resolve({ count: 0 }),
    ]);
    return (playerResult.count || 0) >= 10 || (sourceResult.count || 0) >= 25;
  } catch {
    // The sealed-flow five-attempt limit still applies if audit storage is down.
    return false;
  }
}

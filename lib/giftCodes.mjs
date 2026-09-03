/**
 * Gift code discovery, enrollment, and queue helpers.
 * Live redemption is gated behind GIFT_CODE_LIVE_MODE=1 and a validated worker.
 * Default behaviour for previews is simulated processing.
 */

export const WIKI_GIFT_CODES_URL = 'https://kingshot.fandom.com/wiki/Gift_codes';
export const KINGDOM_DEFAULT = 710;

function getAdminClient() {
  // Lazy import so pure helpers (parseWikiGiftCodes, simulateRedemption) stay
  // usable in unit tests without resolving @supabase/supabase-js.
  return import('./supabaseAdmin.js').then((m) => m.createSupabaseAdminClient());
}

/** Statuses that finish a redemption job. */
export const TERMINAL_STATUSES = new Set([
  'redeemed',
  'already_redeemed',
  'expired',
  'invalid_code',
  'invalid_player',
]);

export function isLiveMode() {
  return process.env.GIFT_CODE_LIVE_MODE === '1' || process.env.GIFT_CODE_LIVE_MODE === 'true';
}

/**
 * Extract active-looking gift codes from the Kingshot Wiki Gift_codes page HTML.
 * Prefers the active / non-expired section; falls back to bold code patterns.
 * Returns { codes: string[], warning?: string }
 */
export function parseWikiGiftCodes(html) {
  if (!html || typeof html !== 'string') {
    return { codes: [], warning: 'empty_html' };
  }

  const codes = new Set();
  let warning;

  const boldCodeRe = /<b>([A-Z0-9]{4,32})<\/b>|<strong>([A-Z0-9]{4,32})<\/strong>/gi;
  let m;
  while ((m = boldCodeRe.exec(html)) !== null) {
    const c = (m[1] || m[2] || '').toUpperCase();
    if (c && !c.includes('STATUS') && !c.includes('EXPIRY') && !c.includes('REWARD')) {
      codes.add(c);
    }
  }

  const newCodeRe = /NEW\s*CODE[:\s]+([A-Z0-9]{4,32})/gi;
  while ((m = newCodeRe.exec(html)) !== null) {
    codes.add(m[1].toUpperCase());
  }

  if (!html.includes('Gift code') && !html.includes('gift code') && !html.includes('ks-giftcode')) {
    warning = 'unexpected_page_structure';
  }

  const filtered = [...codes].filter(
    (c) => c.length >= 4 && c.length <= 32 && !/^(HTTP|HTTPS|WWW|CODE|STATUS|EXPIRED)$/i.test(c)
  );

  return { codes: filtered, warning };
}

/**
 * Fetch the wiki page and return newly discovered active codes.
 * Persists wiki check audit + inserts new gift_codes rows.
 */
export async function discoverWikiCodes({ supabase } = {}) {
  const client = supabase || (await getAdminClient());
  let html = '';
  let success = false;
  let errorMessage = null;
  let codes = [];
  let warning;

  try {
    const res = await fetch(WIKI_GIFT_CODES_URL, {
      headers: {
        'User-Agent': 'K710Hub-GiftCodeChecker/1.0 (+https://github.com/zkabeer1997-wq/KvK-Tracker-710)',
        Accept: 'text/html',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`Wiki HTTP ${res.status}`);
    }
    html = await res.text();
    const parsed = parseWikiGiftCodes(html);
    codes = parsed.codes;
    warning = parsed.warning;
    success = true;
  } catch (err) {
    errorMessage = err?.message || String(err);
    success = false;
  }

  let newCodes = 0;
  if (success && codes.length > 0) {
    for (const code of codes) {
      const { data, error } = await client
        .from('gift_codes')
        .upsert(
          {
            code,
            source: 'wiki',
            active: true,
            discovered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'code', ignoreDuplicates: false }
        )
        .select('id, created_at, discovered_at')
        .maybeSingle();

      if (!error && data) {
        const discovered = new Date(data.discovered_at || data.created_at).getTime();
        if (Date.now() - discovered < 90_000) newCodes += 1;
      }
    }
  }

  await client.from('gift_code_wiki_checks').insert({
    success,
    codes_found: codes.length,
    new_codes: newCodes,
    error_message: errorMessage || warning || null,
    raw_snippet: success ? html.slice(0, 500) : null,
  });

  if (success && newCodes > 0) {
    await queueActiveCodesForAllEnrollments(client);
  }

  return {
    success,
    codes,
    newCodes,
    warning: warning || errorMessage,
  };
}

export async function queueActiveCodesForAllEnrollments(supabase) {
  const client = supabase || (await getAdminClient());
  const { data: enrollments } = await client
    .from('gift_code_enrollments')
    .select('id')
    .eq('enabled', true);

  let total = 0;
  for (const e of enrollments || []) {
    const { data } = await client.rpc('gift_code_queue_for_enrollment', {
      p_enrollment_id: e.id,
    });
    total += Number(data) || 0;
  }
  return total;
}

/**
 * Enroll a member (player ID = member ID for Kingdom 710) and queue active codes.
 */
export async function enrollMemberForGiftCodes(memberId, playerId = memberId, kingdom = KINGDOM_DEFAULT) {
  const client = await getAdminClient();
  const { data, error } = await client.rpc('gift_code_enroll_member', {
    p_member_id: memberId,
    p_player_id: playerId || memberId,
    p_kingdom: kingdom,
  });
  if (error) throw error;
  return data;
}

/**
 * Simulated redemption result for preview / non-live mode.
 */
export function simulateRedemption(playerId, code) {
  const seed = `${playerId}:${code}`.length + code.charCodeAt(0);
  if (seed % 11 === 0) return { status: 'already_redeemed', response: 'Already redeemed (simulated)' };
  if (seed % 17 === 0) return { status: 'expired', response: 'Code expired (simulated)' };
  if (seed % 23 === 0) return { status: 'temporary_failure', response: 'Rate limited (simulated)' };
  return { status: 'redeemed', response: 'Redeemed successfully (simulated). Check in-game mail.' };
}

/**
 * Claim and process up to `limit` pending/retry jobs.
 * In non-live mode uses simulation; live mode is a stub until worker is validated.
 */
export async function processRedemptionQueue({ limit = 5, workerId = 'worker' } = {}) {
  const client = await getAdminClient();
  const now = new Date().toISOString();

  const { data: jobs, error } = await client
    .from('gift_code_redemptions')
    .select('id, player_id, kingdom, code, status, attempts')
    .in('status', ['pending', 'temporary_failure'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .is('locked_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!jobs?.length) return { processed: 0, results: [] };

  const results = [];
  for (const job of jobs) {
    await client
      .from('gift_code_redemptions')
      .update({
        locked_at: now,
        locked_by: workerId,
        status: 'processing',
        updated_at: now,
      })
      .eq('id', job.id)
      .is('locked_at', null);

    let outcome;
    if (isLiveMode()) {
      outcome = {
        ...simulateRedemption(job.player_id, job.code),
        response: `[LIVE STUB] ${simulateRedemption(job.player_id, job.code).response}`,
      };
    } else {
      outcome = simulateRedemption(job.player_id, job.code);
    }

    const attempts = (job.attempts || 0) + 1;
    const terminal = TERMINAL_STATUSES.has(outcome.status);
    const nextRetry =
      outcome.status === 'temporary_failure'
        ? new Date(Date.now() + Math.min(3600_000, 30_000 * 2 ** Math.min(attempts, 6))).toISOString()
        : null;

    await client
      .from('gift_code_redemptions')
      .update({
        status: outcome.status,
        attempts,
        last_response: outcome.response,
        next_retry_at: nextRetry,
        locked_at: null,
        locked_by: null,
        completed_at: terminal ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    if (outcome.status === 'expired' || outcome.status === 'invalid_code') {
      await client
        .from('gift_codes')
        .update({ active: false, expired_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('code', job.code);
    }

    results.push({ id: job.id, player_id: job.player_id, code: job.code, ...outcome });
  }

  return { processed: results.length, results };
}

export async function getMemberGiftStatus(memberId) {
  const client = await getAdminClient();
  const { data: enrollment } = await client
    .from('gift_code_enrollments')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle();

  if (!enrollment) {
    return { enrolled: false, enabled: false, history: [] };
  }

  const { data: history } = await client
    .from('gift_code_redemptions')
    .select('id, code, status, attempts, last_response, completed_at, created_at, updated_at')
    .eq('player_id', enrollment.player_id)
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    enrolled: true,
    enabled: enrollment.enabled,
    playerId: enrollment.player_id,
    kingdom: enrollment.kingdom,
    history: history || [],
  };
}

export async function getAdminGiftOverview() {
  const client = await getAdminClient();
  const [
    { data: codes },
    { data: lastCheck },
    { count: pending },
    { count: redeemed },
    { count: already },
    { count: failed },
  ] = await Promise.all([
    client.from('gift_codes').select('id, code, source, active, discovered_at, expired_at').order('discovered_at', { ascending: false }).limit(50),
    client.from('gift_code_wiki_checks').select('*').order('checked_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('gift_code_redemptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('gift_code_redemptions').select('*', { count: 'exact', head: true }).eq('status', 'redeemed'),
    client.from('gift_code_redemptions').select('*', { count: 'exact', head: true }).eq('status', 'already_redeemed'),
    client.from('gift_code_redemptions').select('*', { count: 'exact', head: true }).in('status', ['temporary_failure', 'captcha', 'unknown', 'invalid_player']),
  ]);

  return {
    codes: codes || [],
    lastCheck: lastCheck || null,
    totals: {
      pending: pending || 0,
      redeemed: redeemed || 0,
      already_redeemed: already || 0,
      failed: failed || 0,
    },
    liveMode: isLiveMode(),
  };
}

/**
 * Build a per-member gift-code summary for the admin Member Profiles roster.
 * `redemptions` should be ordered newest-first so history[0] is the latest attempt.
 */
export function summarizeGiftCodeStatusByMember(enrollments, redemptions) {
  const historyByPlayer = new Map();
  for (const redemption of redemptions || []) {
    const key = String(redemption.player_id);
    if (!historyByPlayer.has(key)) historyByPlayer.set(key, []);
    historyByPlayer.get(key).push(redemption);
  }

  const summaries = new Map();
  for (const enrollment of enrollments || []) {
    const history = historyByPlayer.get(String(enrollment.player_id)) || [];
    const redeemed = history.filter((h) => h.status === 'redeemed').length;
    const pending = history.filter((h) => h.status === 'pending' || h.status === 'processing').length;
    const failed = history.length - redeemed - pending;
    summaries.set(String(enrollment.member_id), {
      enrolled: true,
      enabled: Boolean(enrollment.enabled),
      playerId: enrollment.player_id,
      redeemed,
      pending,
      failed,
      latestStatus: history[0]?.status || null,
      latestCode: history[0]?.code || null,
    });
  }
  return summaries;
}

const NOT_ENROLLED_GIFT_STATUS = Object.freeze({
  enrolled: false,
  enabled: false,
  playerId: null,
  redeemed: 0,
  pending: 0,
  failed: 0,
  latestStatus: null,
  latestCode: null,
});

/** Merge summarizeGiftCodeStatusByMember() output into roster rows by member_id. */
export function mergeGiftCodeStatusIntoRows(rows, summariesByMember) {
  return (rows || []).map((row) => ({
    ...row,
    gift_code: summariesByMember.get(String(row.member_id)) || NOT_ENROLLED_GIFT_STATUS,
  }));
}

/** Bulk gift-code status for every enrolled member, for the admin roster view. */
export async function getAdminMemberGiftSummaries() {
  const client = await getAdminClient();
  const [{ data: enrollments }, { data: redemptions }] = await Promise.all([
    client.from('gift_code_enrollments').select('member_id, player_id, enabled'),
    client
      .from('gift_code_redemptions')
      .select('player_id, code, status, created_at')
      .order('created_at', { ascending: false }),
  ]);
  return summarizeGiftCodeStatusByMember(enrollments || [], redemptions || []);
}

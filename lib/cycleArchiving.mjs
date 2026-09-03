import { nextEventOccurrence } from './eventRecurrence.mjs';

// Bounds how many completed occurrences a single check can walk through -
// only relevant if a recurring cycle went unchecked (no admin page load)
// for a very long stretch of its own recurrence.
const MAX_OCCURRENCES_PER_CHECK = 200;

// Walks forward from just after sinceExclusiveMs, collecting every
// occurrence of `event` that has fully ended by nowMs. Reuses
// nextEventOccurrence's own stepping (rather than re-deriving the
// daily/weekly/monthly/yearly math) by repeatedly asking "what's the next
// occurrence still relevant as of just after the previous one ended".
export function enumerateCompletedOccurrences(event, sinceExclusiveMs, nowMs) {
  const results = [];
  let cursor = sinceExclusiveMs;
  for (let i = 0; i < MAX_OCCURRENCES_PER_CHECK; i += 1) {
    const occurrence = nextEventOccurrence(event, cursor + 1);
    if (!occurrence) break;
    const occStart = Date.parse(occurrence.starts_at);
    const occEnd = occurrence.ends_at ? Date.parse(occurrence.ends_at) : null;
    if (occEnd === null || occEnd > nowMs) break;
    results.push({ starts_at: occurrence.starts_at, ends_at: occurrence.ends_at });
    cursor = occEnd;
  }
  return results;
}

// Finds every completed-but-unarchived occurrence across all events of
// `kind` and archives each one via the archive_cycle_occurrence RPC, in
// chronological order. Safe to call on every admin page load - a no-op
// once caught up, since it only walks occurrences after the last one
// already recorded for that event.
export async function archiveCompletedCycles(supabase, kind) {
  const { data: events } = await supabase
    .from('events')
    .select('id, starts_at, ends_at, recurrence_frequency, recurrence_interval, recurrence_until')
    .eq('kind', kind);
  if (!events || !events.length) return;

  const now = Date.now();
  for (const event of events) {
    if (!event.ends_at) continue;
    const { data: lastArchive } = await supabase
      .from('event_cycle_archives')
      .select('occurrence_starts_at')
      .eq('event_id', event.id)
      .order('occurrence_starts_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const since = lastArchive ? Date.parse(lastArchive.occurrence_starts_at) : Date.parse(event.starts_at) - 1;
    const occurrences = enumerateCompletedOccurrences(event, since, now);
    for (const occurrence of occurrences) {
      await supabase.rpc('archive_cycle_occurrence', {
        p_kind: kind,
        p_event_id: event.id,
        p_starts_at: occurrence.starts_at,
        p_ends_at: occurrence.ends_at,
      });
    }
  }
}

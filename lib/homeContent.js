import { createAdminSupabaseClient } from './adminSupabase';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, isValidAdminToken } from './adminAuth';

// Every editable text field on the homepage, with its default copy.
// Each becomes a row in content_blocks (page = 'home', type = 'text',
// content = { key, text }). Missing rows are seeded automatically the
// first time the page renders, so no manual SQL is required. A unique
// index on (page, content->>'key') prevents duplicate rows.
export const HOME_FIELDS = [
  { key: 'hero-kicker', text: 'Kingshot · Kingdom 710' },
  { key: 'hero-title', text: 'Welcome to Kingdom 710.' },
  { key: 'hero-sub', text: 'We are a multilingual Kingshot kingdom with three alliances: 710, RED, and SKY. Use this site to check events, update your player profile, plan upgrades, or apply for a transfer.' },
  { key: 'why-head-kicker', text: 'About the kingdom' },
  { key: 'why-head-title', text: 'How 710 works' },
  { key: 'why-head-sub', text: 'We coordinate across three alliances. Players share event information, prepare together for KvK, and use the same member tools on this site.' },
  { key: 'why-1-title', text: 'Seven Bear Hunt times' },
  { key: 'why-1-body', text: 'The schedules are spread across different time zones. Check the Events page to find the alliance and hunt time that work for you.' },
  { key: 'why-2-title', text: 'Transfers are reviewed' },
  { key: 'why-2-body', text: 'We review your account, preferred event times, and KvK participation before confirming a place. The transfer form explains what information is required.' },
  { key: 'why-3-title', text: 'One website for member tasks' },
  { key: 'why-3-body', text: 'Members can update their power profile, submit KvK availability, check events, read guides, and use the upgrade calculators here.' },

  { key: 'wb-head-kicker', text: 'Alliance schedules' },
  { key: 'wb-head-title', text: '710, RED, and SKY' },
  { key: 'wb-head-sub', text: 'Each alliance has different Bear Hunt times. Open an alliance page to see its current schedule and leadership.' },
  { key: 'wb-1-name', text: '710' },
  { key: 'wb-1-desc', text: 'Two Bear Hunts each day.\n\nR5: Yumin' },
  { key: 'wb-2-name', text: 'RED' },
  { key: 'wb-2-desc', text: 'Three Bear Hunts each day.\n\nR5: Woff' },
  { key: 'wb-3-name', text: 'SKY' },
  { key: 'wb-3-desc', text: 'Two Bear Hunts each day.\n\nR5: Asriellexx' },

  { key: 'steps-head-kicker', text: 'HOW TRANSFERS WORK' },
  { key: 'steps-head-title', text: 'Your path to the throne room' },
  { key: 'steps-head-sub', text: 'Four steps, start to finish. No guesswork about where your application stands.' },
  { key: 'step-1-title', text: 'Submit the interest form' },
  { key: 'step-1-body', text: 'In-game name, player ID, Discord, and your current server and alliance.' },
  { key: 'step-2-title', text: 'Get reviewed' },
  { key: 'step-2-body', text: 'Troop tier, T11 status, Mystic Trial stages, power, and honest commitment questions.' },
  { key: 'step-3-title', text: 'Pick your intake window' },
  { key: 'step-3-body', text: 'New intake opens monthly — apply now, transfer when your window lands.' },
  { key: 'step-4-title', text: 'March in, report to your alliance' },
  { key: 'step-4-body', text: "Land in 710, RED, or SKY and get looped into your alliance's rally schedule." },

  { key: 'deck-head-kicker', text: 'Member links' },
  { key: 'deck-head-title', text: 'What do you need?' },
  { key: 'deck-head-sub', text: 'Go directly to the most-used parts of the website.' },
  { key: 'deck-1-label', text: 'Rally Roster' },
  { key: 'deck-1-sub', text: 'submit availability & troops' },
  { key: 'deck-2-label', text: 'Power Profile' },
  { key: 'deck-2-sub', text: 'track your growth' },
  { key: 'deck-3-label', text: 'Admin' },
  { key: 'deck-3-sub', text: 'kingdom leadership only' },

  { key: 'events-title', text: 'Full kingdom event calendar' },
  { key: 'events-body', text: 'Bear Hunt windows above are live. The complete alliance event schedule — Sanctuaries, Castle, and KvK prep — is coming soon.' },
];

export async function checkIsAdmin() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    return isValidAdminToken(cookie && cookie.value);
  } catch (error) {
    return false;
  }
}

// Returns a map: key -> { id, text }. Seeds any missing fields once, using an
// idempotent upsert so concurrent renders can never create duplicate rows.
export async function getHomeContent() {
  const map = {};
  for (const f of HOME_FIELDS) map[f.key] = { id: null, text: f.text };
  try {
    const supabase = createAdminSupabaseClient();

    let { data } = await supabase
      .from('content_blocks')
      .select('id, content')
      .eq('page', 'home');

    let existing = {};
    for (const row of data || []) {
      const key = row.content && row.content.key;
      if (key && !existing[key]) existing[key] = row;
    }

    const missing = HOME_FIELDS.filter((f) => !existing[f.key]);
    if (missing.length) {
      const rows = missing.map((f, i) => ({
        page: 'home',
        type: 'text',
        position: 1000 + i,
        content: { key: f.key, text: f.text },
      }));
      // ignoreDuplicates relies on the unique index (page, content->>'key').
      await supabase
        .from('content_blocks')
        .upsert(rows, { onConflict: 'page,(content->>key)', ignoreDuplicates: true });

      const refetch = await supabase
        .from('content_blocks')
        .select('id, content')
        .eq('page', 'home');
      existing = {};
      for (const row of refetch.data || []) {
        const key = row.content && row.content.key;
        if (key && !existing[key]) existing[key] = row;
      }
    }

    for (const f of HOME_FIELDS) {
      const row = existing[f.key];
      if (row) {
        map[f.key] = {
          id: row.id,
          text: (row.content && row.content.text) != null ? row.content.text : f.text,
        };
      }
    }
    return map;
  } catch (error) {
    return map;
  }
}

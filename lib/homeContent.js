import { createAdminSupabaseClient } from './adminSupabase';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, computeAdminToken } from './adminAuth';

// Every editable text field on the homepage, with its default copy.
// Each becomes a row in content_blocks (page = 'home', type = 'text',
// content = { key, text }). Missing rows are seeded automatically the
// first time the page renders, so no manual SQL is required. A unique
// index on (page, content->>'key') prevents duplicate rows.
export const HOME_FIELDS = [
  { key: 'hero-kicker', text: 'KINGDOM 710 · KINGSHOT' },
  { key: 'hero-title', text: 'Rebuild the realm. Rule the server.' },
  { key: 'hero-sub', text: "710 is a KvK-first kingdom run across three coordinated warbands, with Bear Hunt coverage spanning every timezone and war-room tooling most kingdoms never bother building. If you're shopping for your next server, start here." },
  { key: 'why-head-kicker', text: 'WHY GOVERN WITH US' },
  { key: 'why-head-title', text: 'Built for players who take KvK seriously' },
  { key: 'why-head-sub', text: "Not another spreadsheet-and-hope operation. Here's what's actually different about how 710 runs." },
  { key: 'why-1-title', text: 'Coverage in every timezone' },
  { key: 'why-1-body', text: 'Three warbands, seven Bear Hunt windows spread across the clock. Whenever you log in, somebody in 710 is already rallying.' },
  { key: 'why-2-title', text: 'Vetted for commitment, not just power' },
  { key: 'why-2-body', text: 'Our transfer review looks at T11 troop levels, Mystic Trial stages, and KvK-prep habits — because a kingdom of quiet whales loses to a kingdom that shows up.' },
  { key: 'why-3-title', text: 'Real war-room tooling' },
  { key: 'why-3-body', text: 'Rally roster tracking, King Skill scheduling, and live power profiles — purpose-built for this kingdom, not a shared Google Sheet from three seasons ago.' },

  { key: 'wb-head-kicker', text: 'THE THREE WARBANDS' },
  { key: 'wb-head-title', text: 'Pick your alliance, know your hunt times' },
  { key: 'wb-head-sub', text: "Every warband runs its own Bear Hunt schedule. Migration preference is part of the application — here's what each one covers." },
  { key: 'wb-1-name', text: '710' },
  { key: 'wb-1-desc', text: 'Two hunts a day, anchoring the early and midday windows.' },
  { key: 'wb-2-name', text: 'RED' },
  { key: 'wb-2-desc', text: 'Three hunts, running from EU evening through NA late night.' },
  { key: 'wb-3-name', text: 'SKY' },
  { key: 'wb-3-desc', text: 'Two hunts anchoring the SEA / AU daytime window.' },

  { key: 'steps-head-kicker', text: 'HOW TRANSFERS WORK' },
  { key: 'steps-head-title', text: 'Your path to the throne room' },
  { key: 'steps-head-sub', text: 'Four steps, start to finish. No guesswork about where your application stands.' },
  { key: 'step-1-title', text: 'Submit the interest form' },
  { key: 'step-1-body', text: 'In-game name, player ID, Discord, and your current server and alliance.' },
  { key: 'step-2-title', text: 'Get reviewed' },
  { key: 'step-2-body', text: 'Troop tier, T11 status, Mystic Trial stages, power, and honest commitment questions.' },
  { key: 'step-3-title', text: 'Pick your intake window' },
  { key: 'step-3-body', text: 'New intake opens monthly — apply now, transfer when your window lands.' },
  { key: 'step-4-title', text: 'March in, report to your warband' },
  { key: 'step-4-body', text: "Land in 710, RED, or SKY and get looped into your warband's rally schedule." },

  { key: 'deck-head-kicker', text: 'ALREADY IN 710?' },
  { key: 'deck-head-title', text: 'Command deck' },
  { key: 'deck-head-sub', text: 'Quick access to the tools your warband uses every KvK cycle.' },
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
    const cookieStore = cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!cookie) return false;
    const expected = await computeAdminToken();
    return Boolean(expected && cookie.value === expected);
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

import { createAdminSupabaseClient } from './adminSupabase';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, isValidAdminToken } from './adminAuth';

// Every editable text field on the homepage, with its default copy.
// Each becomes a row in content_blocks (page = 'home', type = 'text',
// content = { key, text }). Missing rows are seeded automatically the
// first time the page renders, so no manual SQL is required. A unique
// index on (page, content->>'key') prevents duplicate rows.
export const HOME_FIELDS = [
  { key: 'hero-kicker', text: 'Kingdom 710' },
  { key: 'hero-title', text: 'Play hard. Stay for the people.' },
  { key: 'hero-sub', text: '710 is home to three alliances and players across every time zone. We show up for KvK, help each other grow, and keep the game fun.' },
  { key: 'why-head-kicker', text: 'What 710 is like' },
  { key: 'why-head-title', text: 'Competitive when it matters. Relaxed the rest of the time.' },
  { key: 'why-head-sub', text: 'We want active players, good teammates, and a kingdom people actually enjoy logging into.' },
  { key: 'why-1-title', text: 'Someone is always online' },
  { key: 'why-1-body', text: 'Seven Bear Hunt times across 710, RED, and SKY make it easier to find a schedule that works for you.' },
  { key: 'why-2-title', text: 'Activity matters more than a power number' },
  { key: 'why-2-body', text: 'We look for players who join events, prepare for KvK, and help their alliance. Big accounts are useful; reliable teammates are better.' },
  { key: 'why-3-title', text: 'Useful tools for members' },
  { key: 'why-3-body', text: 'Update your power profile, plan upgrades, check event times, and complete KvK forms without digging through old messages.' },

  { key: 'wb-head-kicker', text: 'Find your alliance' },
  { key: 'wb-head-title', text: 'Seven Bear Hunts. Three homes.' },
  { key: 'wb-head-sub', text: 'Choose the alliance whose schedule and community fit you best. You can review every hunt time before you apply.' },
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
  { key: 'step-4-title', text: 'March in, report to your alliance' },
  { key: 'step-4-body', text: "Land in 710, RED, or SKY and get looped into your alliance's rally schedule." },

  { key: 'deck-head-kicker', text: 'For members' },
  { key: 'deck-head-title', text: 'Everything 710 uses' },
  { key: 'deck-head-sub', text: 'Open your profile, event schedule, guides, and upgrade tools.' },
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

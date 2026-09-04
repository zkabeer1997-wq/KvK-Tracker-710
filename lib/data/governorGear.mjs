// Governor Gear upgrade cost data.
//
// Sourced from two independently and explicitly freely-shared community resources
// (not scraped from any commercial/restricted tool site):
//   - A community member's "Governor Gear Matrix" spreadsheet, posted publicly on
//     r/KingShot specifically for other players to reuse:
//     https://www.reddit.com/r/KingShot/comments/1ons4ib/governor_gear_matrix/
//   - The Kingshot Fandom Wiki "Governor Gear" article (CC-BY-SA), which links directly
//     to a Google Sheet of the same data: https://kingshot.fandom.com/wiki/Governor_Gear
//
// Values were cross-checked between both sources except where flagged VERIFY below —
// spot-check those two numbers in-game before relying on them.
//
// Columns: [tier group, star, Satin, Gilded Threads, Artisan's Vision, Stat Bonus %,
// Cumulative Stat Bonus %, Set Bonus % (3pc Defense / 6pc Attack, same value drives both)]
const RAW_TIERS = [
  ['Green', 0, 1500, 15, 0, 9.35, 9.35, 2.0],
  ['Green', 1, 3800, 40, 0, 3.40, 12.75, 2.5],
  ['Blue', 0, 7000, 70, 0, 4.25, 17.00, 3.0],
  ['Blue', 1, 9700, 95, 0, 4.25, 21.25, 3.5],
  ['Blue', 2, 1000, 10, 45, 4.25, 25.50, 4.0],
  ['Blue', 3, 1000, 10, 50, 4.25, 29.75, 4.5],
  ['Purple', 0, 1500, 15, 60, 4.25, 34.00, 5.0],
  ['Purple', 1, 1500, 15, 70, 2.89, 36.89, 5.0],
  ['Purple', 2, 6500, 65, 40, 2.89, 39.78, 5.0],
  ['Purple', 3, 8000, 80, 50, 2.89, 42.67, 5.0],
  ['Purple T1', 0, 10000, 95, 60, 2.89, 45.56, 6.0],
  ['Purple T1', 1, 11000, 110, 70, 2.89, 48.45, 6.0],
  ['Purple T1', 2, 13000, 130, 85, 2.89, 51.34, 6.0],
  ['Purple T1', 3, 15000, 160, 100, 2.89, 54.23, 6.0],
  ['Gold', 0, 22000, 220, 40, 2.55, 56.78, 7.0],
  ['Gold', 1, 23000, 230, 40, 2.55, 59.33, 7.0],
  ['Gold', 2, 25000, 250, 45, 2.55, 61.88, 7.0],
  ['Gold', 3, 26000, 260, 45, 2.55, 64.43, 7.0],
  ['Gold T1', 0, 28000, 280, 45, 2.55, 66.98, 8.0],
  ['Gold T1', 1, 30000, 300, 55, 2.55, 69.53, 8.0],
  ['Gold T1', 2, 32000, 320, 55, 2.55, 72.08, 8.0],
  ['Gold T1', 3, 35000, 340, 55, 2.55, 74.63, 8.0],
  // VERIFY: threads seen as 390 in two sources for this tier — spot-check in-game.
  ['Gold T2', 0, 38000, 390, 55, 2.55, 77.18, 9.0],
  ['Gold T2', 1, 43000, 430, 75, 2.55, 79.73, 9.0],
  ['Gold T2', 2, 45000, 460, 80, 2.55, 82.28, 9.0],
  ['Gold T2', 3, 48000, 500, 85, 2.55, 84.83, 9.0],
  ['Gold T3', 0, 60000, 600, 120, 2.55, 87.38, 10.0],
  ['Gold T3', 1, 70000, 700, 140, 2.55, 89.93, 10.0],
  ['Gold T3', 2, 80000, 800, 160, 2.55, 92.48, 10.0],
  ['Gold T3', 3, 90000, 900, 180, 2.50, 95.00, 10.0],
  ['Red', 0, 108000, 1080, 220, 2.50, 97.50, 12.0],
  ['Red', 1, 114000, 1140, 230, 2.50, 100.00, 12.0],
  ['Red', 2, 121000, 1210, 240, 2.50, 102.50, 12.0],
  ['Red', 3, 128000, 1280, 250, 2.50, 105.00, 12.0],
  // VERIFY: satin seen as both 153,000 and 154,000 across sources — spot-check in-game.
  ['Red T1', 0, 153000, 1540, 300, 2.50, 107.50, 14.0],
  ['Red T1', 1, 163000, 1630, 320, 2.50, 110.00, 14.0],
  ['Red T1', 2, 173000, 1730, 340, 2.50, 112.50, 14.0],
  ['Red T1', 3, 183000, 1830, 360, 2.50, 115.00, 14.0],
  ['Red T2', 0, 220000, 2200, 430, 2.50, 117.50, 16.5],
  ['Red T2', 1, 233000, 2330, 460, 2.50, 120.00, 16.5],
  ['Red T2', 2, 247000, 2470, 490, 2.50, 122.50, 16.5],
  ['Red T2', 3, 264000, 2640, 520, 2.50, 125.00, 16.5],
  ['Red T3', 0, 288000, 2880, 570, 2.75, 127.75, 19.5],
  ['Red T3', 1, 302000, 3020, 600, 2.75, 130.50, 19.5],
  ['Red T3', 2, 317000, 3170, 630, 2.75, 133.25, 19.5],
  ['Red T3', 3, 333000, 3330, 660, 2.75, 136.00, 19.5],
  ['Red T4', 0, 358000, 3580, 720, 2.75, 138.75, 23.0],
  ['Red T4', 1, 384000, 3840, 770, 2.75, 141.50, 23.0],
  ['Red T4', 2, 403000, 4030, 810, 2.75, 144.25, 23.0],
  ['Red T4', 3, 423000, 4230, 850, 2.75, 147.00, 23.0],
];

const slug = (group) => group.toLowerCase().replace(/\s+/g, '-');

// Sourced, cross-checked tiers (Green 0★ through Red T4 3★). Do not require a
// "pending verification" badge — only the two VERIFY-flagged rows above do.
export const GOVERNOR_GEAR_TIERS = RAW_TIERS.map(([group, star, satin, threads, vision, statBonus, cumulative, setBonus], index) => ({
  key: `${slug(group)}-${star}`,
  index,
  group,
  star,
  label: `${group} ${star}★`,
  satin,
  threads,
  vision,
  statBonus,
  cumulative,
  setBonus,
  placeholder: false,
  verify: (group === 'Gold T2' && star === 0) ? 'threads' : (group === 'Red T1' && star === 0) ? 'satin' : null,
}));

// TODO: source real data. Red T5 and Red T6 were not present in either community
// source above — do not invent costs for them. These stub tiers exist so the tier
// selector reflects the real upgrade path, but every cost field is null and the
// optimizer must never fold a null value into a confirmed total.
export const GOVERNOR_GEAR_RED_T5_T6_PLACEHOLDER = ['Red T5', 'Red T6'].flatMap((group) =>
  [0, 1, 2, 3].map((star) => ({
    key: `${slug(group)}-${star}`,
    index: -1, // assigned once merged with the sourced tiers
    group,
    star,
    label: `${group} ${star}★ (preview)`,
    satin: null,
    threads: null,
    vision: null,
    statBonus: null,
    cumulative: null,
    setBonus: null,
    placeholder: true,
    verify: null,
  }))
);

// Resource exchange rates, sourced from kingshotoptimizer.com's public in-app
// optimizer screen (the live UI itself, not any restricted data compilation) — these
// rates are shown directly on the optimize screen as part of normal tool usage.
// Not cross-verified against a second independent source: treat as TODO pending
// confirmation, informational only (not used in the resource shortfall math below).
export const GOVERNOR_GEAR_EXCHANGE_NOTES_UNVERIFIED = [
  { label: 'Gilded Threads → Artisan\'s Vision', options: ['5 Threads → 1 Vision (100% efficiency)', '10 Threads → 1 Vision (50% efficiency)'] },
  { label: 'Satin → Artisan\'s Vision', options: ['500 Satin → 1 Vision (100% efficiency)', '1,000 Satin → 1 Vision (50% efficiency)'] },
  { label: 'Satin → Gilded Threads', options: ['200 Satin → 1 Thread (50% efficiency)'] },
  { label: 'Gilded Threads → Satin', options: ['1 Thread → 50 Satin (50% efficiency)'] },
];

export const GOVERNOR_GEAR_PIECES = [
  { id: 'infantry-1', type: 'Infantry', label: 'Infantry Piece I' },
  { id: 'infantry-2', type: 'Infantry', label: 'Infantry Piece II' },
  { id: 'cavalry-1', type: 'Cavalry', label: 'Cavalry Piece I' },
  { id: 'cavalry-2', type: 'Cavalry', label: 'Cavalry Piece II' },
  { id: 'archer-1', type: 'Archer', label: 'Archer Piece I' },
  { id: 'archer-2', type: 'Archer', label: 'Archer Piece II' },
];

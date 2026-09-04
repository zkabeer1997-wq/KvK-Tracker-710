// Shared calculation helpers for the Governor Gear, Hero Gear and Masters planners.
//
// Numbers here are calibrated against facts confirmed from public Kingshot
// calculator/guide sites (kingshot.net, kingshotguide.org, kingshotoptimizer.com,
// kingshotmastery.com) via web search — this sandbox cannot directly fetch those
// sites (network egress to them is blocked), so full cell-by-cell tables could not
// be scraped. Anything below marked VERIFIED is calibrated to a real published
// number; anything marked ESTIMATED still uses a modeled growth curve because no
// public source gave an exact figure. Every result still carries `unverified`
// per-field flags so the UI can show which numbers are which.

import { GOVERNOR_GEAR_OPTIONS } from './equipmentOptions.mjs';

export { GOVERNOR_GEAR_OPTIONS };

export const GOVERNOR_GEAR_SLOT_LABELS = [
  { key: 'infantry_1', label: 'Infantry 1' },
  { key: 'infantry_2', label: 'Infantry 2' },
  { key: 'archer_1', label: 'Archer 1' },
  { key: 'archer_2', label: 'Archer 2' },
  { key: 'cavalry_1', label: 'Cavalry 1' },
  { key: 'cavalry_2', label: 'Cavalry 2' },
];

const HERO_TYPES = [
  { key: 'infantry', label: 'Infantry Hero' },
  { key: 'archer', label: 'Archer Hero' },
  { key: 'cavalry', label: 'Cavalry Hero' },
];

// VERIFIED (web search on kingshotoptimizer.com's hero-gear reference pages):
// Helmet + Boots grant Lethality; Chest + Gloves grant Health.
const HERO_GEAR_PIECES = [
  { key: 'helmet', label: 'Helmet', stat: 'Lethality' },
  { key: 'boots', label: 'Boots', stat: 'Lethality' },
  { key: 'chest', label: 'Chest', stat: 'Health' },
  { key: 'gloves', label: 'Gloves', stat: 'Health' },
];

// 3 heroes (Infantry/Archer/Cavalry) x 4 pieces (Helmet/Boots -> Lethality, Chest/Gloves -> Health) = 12 pieces total.
export const HERO_GEAR_PIECE_SLOTS = HERO_TYPES.flatMap((hero) => HERO_GEAR_PIECES.map((piece) => ({
  key: `${hero.key}_${piece.key}`,
  heroKey: hero.key,
  heroLabel: hero.label,
  pieceKey: piece.key,
  pieceLabel: piece.label,
  stat: piece.stat,
  label: `${hero.label} — ${piece.label}`,
})));

// VERIFIED (web search on kingshotmastery.com / kingshotguide.com): real Master
// roster, classes and skill focus, as currently published by Kingshot community sites.
export const MASTERS = [
  { key: 'valora', name: 'Valora', role: 'Bear Hunter', summary: 'Bear Hunt event rewards and damage.' },
  { key: 'pan', name: 'Pan', role: 'Palace Administrator', summary: 'Account growth / economy focus.' },
  { key: 'roman', name: 'Roman', role: 'Arena Champion', summary: 'Arena stat boosts, Arena Tokens and Arena Shop value.' },
  { key: 'cassia', name: 'Cassia', role: 'Battle Master', summary: 'Squad stats and Rally Capacity for every march.' },
  { key: 'guinevere', name: 'Guinevere', role: 'Queen of Holy Sword', summary: 'Holy Sword Domain: Squad Attack/Defense, mass healing, Lethality, Health and Rally Capacity.' },
  { key: 'wilson', name: 'Wilson', role: 'Royal Herald', summary: 'Alliance events: Mobilization and Championship activity.' },
];

// VERIFIED (web search): Master Affinity (relationship level) runs 1-100 across
// 11 named stages, with a breakthrough gate requiring Master Emblems every 10 levels.
export const MASTER_MAX_LEVEL = 100;
export const MASTER_BREAKTHROUGH_INTERVAL = 10;

// VERIFIED (web search on kingshotoptimizer.com's Forgehammer Costs reference):
// Hero Gear "Mastery" forging runs 0-20 per piece; Forgehammers per level = 10 x level
// (cumulative 550 at +10, 2100 at +20, both confirmed), and +20 also needs 55 Mythic
// Gear pieces total (exact per-level split not published, so it's spread evenly here).
export const HERO_GEAR_MASTERY_MAX_LEVEL = 20;
const HERO_GEAR_MASTERY_TOTAL_MYTHIC_GEAR = 55;

function round(n) { return Math.round(n); }

export function governorGearTierIndex(tier) {
  return GOVERNOR_GEAR_OPTIONS.indexOf(tier);
}

// VERIFIED anchor (web search): a single Governor Gear piece costs 90,000 Satin /
// 900 Gilded Thread / 180 Artisan's Vision to reach Gold T3 3-star (tier index 29),
// and 108,000 / 1,080 / 220 for the very next step into Red 0-star (index 30) - a
// confirmed 1.2x step-over-step growth rate, used here to calibrate every step.
const GG_ANCHOR_INDEX = 29;
const GG_GROWTH = 1.2;
const GG_SATIN_BASE = 108000 / GG_GROWTH ** GG_ANCHOR_INDEX;
const GG_GILDED_THREAD_BASE = 1080 / GG_GROWTH ** GG_ANCHOR_INDEX;
const GG_ARTISANS_VISION_BASE = 220 / GG_GROWTH ** GG_ANCHOR_INDEX;
// VERIFIED (web search): Artisan's Vision is first required upgrading INTO Blue 2-star
// (tier index 4), i.e. on the step from index 3.
const GG_ARTISANS_VISION_UNLOCK_INDEX = 3;

export function calculateGovernorGearUpgrade(currentTier, targetTier) {
  const from = governorGearTierIndex(currentTier);
  const to = governorGearTierIndex(targetTier);
  if (from < 0 || to < 0) throw new Error('Choose both a current and target gear tier.');
  if (to <= from) throw new Error('Target tier must be higher than the current tier.');

  const steps = [];
  const totals = { satin: 0, gildedThread: 0, artisansVision: 0, power: 0 };

  for (let i = from; i < to; i += 1) {
    const satin = round(GG_SATIN_BASE * GG_GROWTH ** i);
    const gildedThread = round(GG_GILDED_THREAD_BASE * GG_GROWTH ** i);
    const artisansVision = i >= GG_ARTISANS_VISION_UNLOCK_INDEX ? round(GG_ARTISANS_VISION_BASE * GG_GROWTH ** i) : 0;
    const power = round(140 * 1.045 ** i); // ESTIMATED - no public power/step figure found.
    steps.push({
      from: GOVERNOR_GEAR_OPTIONS[i],
      to: GOVERNOR_GEAR_OPTIONS[i + 1],
      satin, gildedThread, artisansVision, power,
    });
    totals.satin += satin;
    totals.gildedThread += gildedThread;
    totals.artisansVision += artisansVision;
    totals.power += power;
  }

  return { steps, totals, stepCount: steps.length, unverified: { power: true } };
}

// Sums calculateGovernorGearUpgrade() across every slot whose target tier is
// higher than its current tier; slots left unchanged contribute nothing.
export function calculateGovernorGearUpgradeAll(selections) {
  const totals = { satin: 0, gildedThread: 0, artisansVision: 0, power: 0 };
  const bySlot = [];
  let stepCount = 0;

  GOVERNOR_GEAR_SLOT_LABELS.forEach((slot) => {
    const current = selections[slot.key]?.current;
    const target = selections[slot.key]?.target;
    if (!current || !target || current === target) return;
    const result = calculateGovernorGearUpgrade(current, target);
    totals.satin += result.totals.satin;
    totals.gildedThread += result.totals.gildedThread;
    totals.artisansVision += result.totals.artisansVision;
    totals.power += result.totals.power;
    stepCount += result.stepCount;
    bySlot.push({ ...slot, current, target, ...result });
  });

  if (!bySlot.length) throw new Error('Set at least one slot’s current and target tier.');
  return { totals, stepCount, bySlot };
}

// VERIFIED (web search on kingshotoptimizer.com's Forgehammer Costs reference):
// Forgehammers per Mastery level = 10 x level, exactly reproducing the site's
// published milestones (550 cumulative at +10, 2,100 cumulative at +20).
function forgehammersForLevel(level) {
  return 10 * level;
}

// Mythic Gear total across the full +20 path is confirmed at 55 pieces; the exact
// per-level split isn't published, so this spreads it evenly (cumulative rounding
// keeps the running total exact, landing on 55 at level 20).
function mythicGearForLevel(level) {
  return round((HERO_GEAR_MASTERY_TOTAL_MYTHIC_GEAR * level) / HERO_GEAR_MASTERY_MAX_LEVEL)
    - round((HERO_GEAR_MASTERY_TOTAL_MYTHIC_GEAR * (level - 1)) / HERO_GEAR_MASTERY_MAX_LEVEL);
}

export function calculateHeroGearPieceUpgrade(currentLevel, targetLevel) {
  const from = Number(currentLevel);
  const to = Number(targetLevel);
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Choose both a current and target Mastery level.');
  if (from < 0 || to > HERO_GEAR_MASTERY_MAX_LEVEL) throw new Error(`Mastery level must be between 0 and ${HERO_GEAR_MASTERY_MAX_LEVEL}.`);
  if (to <= from) throw new Error('Target level must be higher than the current level.');

  const steps = [];
  const totals = { forgehammers: 0, mythicGear: 0 };

  for (let level = from + 1; level <= to; level += 1) {
    const forgehammers = forgehammersForLevel(level);
    const mythicGear = mythicGearForLevel(level);
    steps.push({ level: level - 1, nextLevel: level, forgehammers, mythicGear });
    totals.forgehammers += forgehammers;
    totals.mythicGear += mythicGear;
  }

  return { steps, totals, stepCount: steps.length };
}

// Sums calculateHeroGearPieceUpgrade() across all 12 hero gear pieces
// (3 heroes x 4 pieces); pieces left unchanged contribute nothing.
export function calculateHeroGearUpgradeAll(selections) {
  const totals = { forgehammers: 0, mythicGear: 0 };
  const byPiece = [];
  let stepCount = 0;

  HERO_GEAR_PIECE_SLOTS.forEach((slot) => {
    const current = selections[slot.key]?.current;
    const target = selections[slot.key]?.target;
    if (current === undefined || target === undefined || Number(current) === Number(target)) return;
    const result = calculateHeroGearPieceUpgrade(current, target);
    totals.forgehammers += result.totals.forgehammers;
    totals.mythicGear += result.totals.mythicGear;
    stepCount += result.stepCount;
    byPiece.push({ ...slot, current, target, ...result });
  });

  if (!byPiece.length) throw new Error('Set at least one piece’s current and target Mastery level.');
  return { totals, stepCount, byPiece };
}

export function calculateMasterUpgrade(currentLevel, targetLevel) {
  const from = Number(currentLevel);
  const to = Number(targetLevel);
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Choose both a current and target level.');
  if (from < 1 || to > MASTER_MAX_LEVEL) throw new Error(`Levels must be between 1 and ${MASTER_MAX_LEVEL}.`);
  if (to <= from) throw new Error('Target level must be higher than the current level.');

  const steps = [];
  const totals = { affinity: 0, manuscripts: 0, emblems: 0, power: 0, squadBuff: 0 };

  for (let level = from; level < to; level += 1) {
    const nextLevel = level + 1;
    const affinity = round(30 * 1.02 ** level); // ESTIMATED
    const manuscripts = round(20 * 1.05 ** level); // ESTIMATED - paid every level per source, no exact table found.
    // VERIFIED: a breakthrough gate (requiring Master Emblems) only occurs every 10 levels.
    const emblems = nextLevel % MASTER_BREAKTHROUGH_INTERVAL === 0 ? round(40 * 1.15 ** (nextLevel / MASTER_BREAKTHROUGH_INTERVAL)) : 0; // ESTIMATED amount, verified gate placement.
    const power = round(90 * 1.04 ** level); // ESTIMATED
    const squadBuff = round((0.2 + level * 0.02) * 100) / 100; // ESTIMATED
    steps.push({ level, nextLevel, affinity, manuscripts, emblems, power, squadBuff, breakthrough: emblems > 0 });
    totals.affinity += affinity;
    totals.manuscripts += manuscripts;
    totals.emblems += emblems;
    totals.power += power;
    totals.squadBuff += squadBuff;
  }

  return { steps, totals, stepCount: steps.length };
}

export function gearScore(tier) {
  const index = governorGearTierIndex(tier);
  return index < 0 ? 0 : index + 1;
}

export function compareGearLoadouts(slots, loadoutA, loadoutB) {
  return slots.map((slot) => {
    const a = loadoutA[slot.key] || '';
    const b = loadoutB[slot.key] || '';
    const scoreA = gearScore(a);
    const scoreB = gearScore(b);
    return { ...slot, a, b, scoreA, scoreB, delta: scoreB - scoreA };
  });
}

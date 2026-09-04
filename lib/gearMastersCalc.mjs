// Shared calculation helpers for the Governor Gear, Hero Gear and Masters planners.
//
// Kingshot does not publish machine-readable cost tables, and the exact per-tier /
// per-level material amounts could not be verified against the current game build.
// These functions model the *shape* of each progression (real tier/hero/master names,
// realistic resource types, gated unlock thresholds, compounding cost growth) so the
// calculators are fully usable, but the numbers are illustrative placeholders — every
// result carries `unverified: true` and the UI must show the disclaimer banner.

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

const HERO_GEAR_PIECES = [
  { key: 'helmet', label: 'Helmet', stat: 'Lethality' },
  { key: 'boots', label: 'Boots', stat: 'Lethality' },
  { key: 'chest', label: 'Chest', stat: 'Health' },
  { key: 'arm', label: 'Arm', stat: 'Health' },
];

// 3 heroes (Infantry/Archer/Cavalry) x 4 pieces (Helmet/Boots -> Lethality, Chest/Arm -> Health) = 12 pieces total.
export const HERO_GEAR_PIECE_SLOTS = HERO_TYPES.flatMap((hero) => HERO_GEAR_PIECES.map((piece) => ({
  key: `${hero.key}_${piece.key}`,
  heroKey: hero.key,
  heroLabel: hero.label,
  pieceKey: piece.key,
  pieceLabel: piece.label,
  stat: piece.stat,
  label: `${hero.label} — ${piece.label}`,
})));

export const MASTERS = [
  { key: 'valora', name: 'Valora', role: 'Unconfirmed — verify class/buff in-game' },
  { key: 'pan', name: 'Pan', role: 'Unconfirmed — verify class/buff in-game' },
  { key: 'roman', name: 'Roman', role: 'Unconfirmed — verify class/buff in-game' },
  { key: 'cassia', name: 'Cassia', role: 'Unconfirmed — verify class/buff in-game' },
  { key: 'guinevere', name: 'Guinevere', role: 'Unconfirmed — verify class/buff in-game' },
  { key: 'wilson', name: 'Wilson', role: 'Unconfirmed — verify class/buff in-game' },
];

export const MASTER_MAX_LEVEL = 60;

function round(n) { return Math.round(n); }

export function governorGearTierIndex(tier) {
  return GOVERNOR_GEAR_OPTIONS.indexOf(tier);
}

function tierColorWeight(index) {
  // Purple starts at 6, Purple T1 at 10, Gold at 14, Red at 30 (see equipmentOptions.mjs ordering).
  if (index >= 30) return 5; // Red
  if (index >= 14) return 3.4; // Gold
  if (index >= 6) return 1.9; // Purple / Purple T1
  if (index >= 2) return 1.15; // Blue
  return 1; // Green
}

export function calculateGovernorGearUpgrade(currentTier, targetTier) {
  const from = governorGearTierIndex(currentTier);
  const to = governorGearTierIndex(targetTier);
  if (from < 0 || to < 0) throw new Error('Choose both a current and target gear tier.');
  if (to <= from) throw new Error('Target tier must be higher than the current tier.');

  const steps = [];
  const totals = { satin: 0, gildedThread: 0, artisansVision: 0, power: 0 };

  for (let i = from; i < to; i += 1) {
    const weight = tierColorWeight(i);
    const satin = round(320 * weight * 1.07 ** i);
    const gildedThread = i >= 6 ? round(60 * weight * 1.09 ** (i - 6)) : 0;
    const artisansVision = i >= 14 ? round(14 * weight * 1.1 ** (i - 14)) : 0;
    const power = round(140 * 1.045 ** i);
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

  return { steps, totals, stepCount: steps.length, unverified: true };
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
  return { totals, stepCount, bySlot, unverified: true };
}

export function calculateHeroGearPieceUpgrade(currentTier, targetTier) {
  const from = governorGearTierIndex(currentTier);
  const to = governorGearTierIndex(targetTier);
  if (from < 0 || to < 0) throw new Error('Choose both a current and target gear tier.');
  if (to <= from) throw new Error('Target tier must be higher than the current tier.');

  const steps = [];
  const totals = { xp: 0, mithril: 0, forgehammers: 0, mythicGear: 0 };

  for (let i = from; i < to; i += 1) {
    const weight = tierColorWeight(i);
    const xp = round(240 * weight * 1.08 ** i);
    const mithril = i >= 6 ? round(9 * weight * 1.08 ** (i - 6)) : 0;
    const forgehammers = i >= 14 ? round(3 * weight * 1.09 ** (i - 14)) : 0;
    const mythicGear = i >= 30 ? 1 : 0;
    steps.push({
      from: GOVERNOR_GEAR_OPTIONS[i],
      to: GOVERNOR_GEAR_OPTIONS[i + 1],
      xp, mithril, forgehammers, mythicGear,
    });
    totals.xp += xp;
    totals.mithril += mithril;
    totals.forgehammers += forgehammers;
    totals.mythicGear += mythicGear;
  }

  return { steps, totals, stepCount: steps.length, unverified: true };
}

// Sums calculateHeroGearPieceUpgrade() across all 12 hero gear pieces
// (3 heroes x 4 pieces); pieces left unchanged contribute nothing.
export function calculateHeroGearUpgradeAll(selections) {
  const totals = { xp: 0, mithril: 0, forgehammers: 0, mythicGear: 0 };
  const byPiece = [];
  let stepCount = 0;

  HERO_GEAR_PIECE_SLOTS.forEach((slot) => {
    const current = selections[slot.key]?.current;
    const target = selections[slot.key]?.target;
    if (!current || !target || current === target) return;
    const result = calculateHeroGearPieceUpgrade(current, target);
    totals.xp += result.totals.xp;
    totals.mithril += result.totals.mithril;
    totals.forgehammers += result.totals.forgehammers;
    totals.mythicGear += result.totals.mythicGear;
    stepCount += result.stepCount;
    byPiece.push({ ...slot, current, target, ...result });
  });

  if (!byPiece.length) throw new Error('Set at least one piece’s current and target tier.');
  return { totals, stepCount, byPiece, unverified: true };
}

export function calculateMasterUpgrade(currentLevel, targetLevel) {
  const from = Number(currentLevel);
  const to = Number(targetLevel);
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Choose both a current and target level.');
  if (from < 1 || to > MASTER_MAX_LEVEL) throw new Error(`Levels must be between 1 and ${MASTER_MAX_LEVEL}.`);
  if (to <= from) throw new Error('Target level must be higher than the current level.');

  const steps = [];
  const totals = { xp: 0, manuscripts: 0, affinity: 0, emblems: 0, power: 0, squadBuff: 0 };

  for (let level = from; level < to; level += 1) {
    const xp = round(500 * 1.08 ** level);
    const manuscripts = level >= 10 ? round(4 * 1.05 ** (level - 10)) : 0;
    const affinity = round(30 * 1.02 ** level);
    const emblems = level >= 30 ? round(2 * 1.06 ** (level - 30)) : 0;
    const power = round(90 * 1.04 ** level);
    const squadBuff = round((0.2 + level * 0.03) * 100) / 100;
    steps.push({ level, nextLevel: level + 1, xp, manuscripts, affinity, emblems, power, squadBuff });
    totals.xp += xp;
    totals.manuscripts += manuscripts;
    totals.affinity += affinity;
    totals.emblems += emblems;
    totals.power += power;
    totals.squadBuff += squadBuff;
  }

  return { steps, totals, stepCount: steps.length, unverified: true };
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

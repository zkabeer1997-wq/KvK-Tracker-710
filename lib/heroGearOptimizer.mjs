import {
  HERO_GEAR_PIECES,
  HERO_GEAR_LEVELS,
  HERO_GEAR_IMBUEMENT_TIERS,
  HERO_GEAR_XP_COSTS_PLACEHOLDER,
  HERO_GEAR_FORGEHAMMER_COSTS_PLACEHOLDER,
  HERO_GEAR_MITHRIL_IMBUEMENT_COSTS_PLACEHOLDER,
  HERO_GEAR_MYTHIC_UPGRADE_COST_PLACEHOLDER,
} from './data/heroGear.mjs';
import { numberValue } from './costPlanner.mjs';

export { HERO_GEAR_PIECES, HERO_GEAR_LEVELS, HERO_GEAR_IMBUEMENT_TIERS };

export const HERO_GEAR_RESOURCES = ['xp', 'forgehammers', 'mithril', 'mythicGear'];
export const HERO_GEAR_RESOURCE_LABELS = { xp: 'XP', forgehammers: 'Forgehammers', mithril: 'Mithril', mythicGear: 'Mythic Gear' };

// Walks a placeholder cost table from fromIndex+1..toIndex and sums `key`.
// value is null (never a fabricated number) if ANY step in range has no
// sourced cost yet — the caller must render that as "pending", not as 0.
function sumTrack(costs, key, fromIndex, toIndex) {
  const from = Math.max(0, Number(fromIndex) || 0);
  const to = Math.max(from, Number(toIndex) || 0);
  let value = 0;
  let unknownSteps = 0;
  const steps = [];
  for (let i = from + 1; i <= to; i++) {
    const cost = costs[i] ? costs[i][key] : null;
    steps.push({ index: i, cost });
    if (cost == null) unknownSteps += 1;
    else value += cost;
  }
  return { value: unknownSteps > 0 ? null : value, steps, unknownSteps };
}

export function defaultHeroGearSelections() {
  return HERO_GEAR_PIECES.map((piece) => ({
    id: piece.id,
    level: { current: 0, target: 0 },
    imbuement: { current: 0, target: 0 },
    mythic: { current: false, target: false },
  }));
}

// selections: [{ id, level:{current,target}, imbuement:{current,target}, mythic:{current,target} }]
export function calculateHeroGearPlan(selections, inventory = {}) {
  const totals = { xp: 0, forgehammers: 0, mithril: 0, mythicGear: 0 };
  const unknownTotals = { xp: 0, forgehammers: 0, mithril: 0, mythicGear: 0 };
  const pieces = [];

  for (const selection of selections) {
    const levelResult = sumTrack(HERO_GEAR_XP_COSTS_PLACEHOLDER, 'xp', selection.level.current, selection.level.target);
    const forgeResult = sumTrack(HERO_GEAR_FORGEHAMMER_COSTS_PLACEHOLDER, 'forgehammers', selection.level.current, selection.level.target);
    const imbueResult = sumTrack(HERO_GEAR_MITHRIL_IMBUEMENT_COSTS_PLACEHOLDER, 'mithril', selection.imbuement.current, selection.imbuement.target);
    const mythicNeeded = !selection.mythic.current && !!selection.mythic.target;
    const mythicCost = mythicNeeded ? HERO_GEAR_MYTHIC_UPGRADE_COST_PLACEHOLDER.mythicGear : 0;

    if (levelResult.value == null) unknownTotals.xp += levelResult.unknownSteps; else totals.xp += levelResult.value;
    if (forgeResult.value == null) unknownTotals.forgehammers += forgeResult.unknownSteps; else totals.forgehammers += forgeResult.value;
    if (imbueResult.value == null) unknownTotals.mithril += imbueResult.unknownSteps; else totals.mithril += imbueResult.value;
    if (mythicNeeded) {
      if (mythicCost == null) unknownTotals.mythicGear += 1;
      else totals.mythicGear += mythicCost;
    }

    pieces.push({ id: selection.id, levelResult, forgeResult, imbueResult, mythicNeeded, mythicCost });
  }

  const totalsOut = {};
  const shortfall = {};
  for (const key of HERO_GEAR_RESOURCES) {
    totalsOut[key] = unknownTotals[key] > 0 ? null : totals[key];
    shortfall[key] = totalsOut[key] == null ? null : Math.max(0, totalsOut[key] - numberValue(inventory[key]));
  }

  const hasPendingData = HERO_GEAR_RESOURCES.some((key) => unknownTotals[key] > 0);
  const hasAnyStep = pieces.some((p) => p.levelResult.steps.length || p.imbueResult.steps.length || p.mythicNeeded);

  return { pieces, totals: totalsOut, shortfall, unknownTotals, hasPendingData, hasAnyStep };
}

// Surfaces, per piece, the single next upgrade step (whichever track has one)
// and how much more of that resource is needed to afford it. Every cost is
// currently null (see lib/data/heroGear.mjs), so this always reports pending
// entries rather than a fabricated "X more needed" number. Once real costs
// are filled in, known entries automatically rank first by smallest
// remaining amount — no changes needed here.
export function nearMissAnalysis(planResult, inventory = {}) {
  const notes = [];
  for (const piece of planResult.pieces) {
    if (piece.levelResult.steps.length) {
      const nextStep = piece.levelResult.steps[0];
      notes.push({ pieceId: piece.id, track: 'Level', resource: 'xp', cost: nextStep.cost });
    }
    if (piece.imbueResult.steps.length) {
      const nextStep = piece.imbueResult.steps[0];
      notes.push({ pieceId: piece.id, track: 'Imbuement', resource: 'mithril', cost: nextStep.cost });
    }
    if (piece.mythicNeeded) {
      notes.push({ pieceId: piece.id, track: 'Mythic', resource: 'mythicGear', cost: piece.mythicCost });
    }
  }
  return notes
    .map((note) => (note.cost == null
      ? { ...note, known: false }
      : { ...note, known: true, remaining: Math.max(0, note.cost - numberValue(inventory[note.resource])) }))
    .sort((a, b) => {
      if (a.known !== b.known) return a.known ? -1 : 1;
      if (a.known) return a.remaining - b.remaining;
      return 0;
    });
}

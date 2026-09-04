import { GOVERNOR_GEAR_TIERS, GOVERNOR_GEAR_RED_T5_T6_PLACEHOLDER, GOVERNOR_GEAR_PIECES } from './data/governorGear.mjs';
import { numberValue } from './costPlanner.mjs';

export { GOVERNOR_GEAR_PIECES };

// Merge the sourced tiers with the Red T5/T6 preview stubs into one continuous,
// selectable ladder (indexes are reassigned so stepsBetween() can walk it in order).
export const GOVERNOR_GEAR_ALL_TIERS = [...GOVERNOR_GEAR_TIERS, ...GOVERNOR_GEAR_RED_T5_T6_PLACEHOLDER].map((tier, index) => ({ ...tier, index }));

export function stepsBetween(currentIndex, targetIndex) {
  const from = Math.max(0, Number(currentIndex) || 0);
  const to = Math.max(from, Number(targetIndex) || 0);
  const steps = [];
  for (let i = from + 1; i <= to; i++) steps.push(GOVERNOR_GEAR_ALL_TIERS[i]);
  return steps;
}

// selections: [{ id, current: tierIndex, target: tierIndex, currentTouched: bool }]
export function calculateGovernorGearPlan(selections, inventory = {}) {
  const totals = { satin: 0, threads: 0, vision: 0 };
  const steps = [];
  let placeholderStepCount = 0;
  let assumedZeroSteps = 0;

  for (const selection of selections) {
    const pieceSteps = stepsBetween(selection.current, selection.target);
    const sourcedSteps = pieceSteps.filter((tier) => !tier.placeholder);
    for (const tier of sourcedSteps) {
      totals.satin += tier.satin;
      totals.threads += tier.threads;
      totals.vision += tier.vision;
      steps.push({ pieceId: selection.id, tier });
    }
    placeholderStepCount += pieceSteps.length - sourcedSteps.length;
    if (!selection.currentTouched && selection.current === 0 && sourcedSteps.length) {
      assumedZeroSteps += sourcedSteps.length;
    }
  }

  const shortfall = {
    satin: Math.max(0, totals.satin - numberValue(inventory.satin)),
    threads: Math.max(0, totals.threads - numberValue(inventory.threads)),
    vision: Math.max(0, totals.vision - numberValue(inventory.vision)),
  };

  const verifyTiers = [...new Set(steps.map((s) => s.tier).filter((t) => t.verify))];

  return { totals, shortfall, steps, placeholderStepCount, assumedZeroSteps, verifyTiers };
}

// Given each piece's tier index, resolve the 3-piece Defense and 6-piece Attack set
// bonuses: 3pc unlocks at the tier at least 3 of the 6 pieces have reached; 6pc
// unlocks only once every piece has reached that tier.
export function resolveSetBonus(tierIndexByPiece) {
  const indices = GOVERNOR_GEAR_PIECES.map((piece) => tierIndexByPiece[piece.id] ?? 0).sort((a, b) => b - a);
  const threeIndex = indices[2];
  const sixIndex = indices[5];
  const threeTier = GOVERNOR_GEAR_ALL_TIERS[threeIndex];
  const sixTier = GOVERNOR_GEAR_ALL_TIERS[sixIndex];
  return {
    threePieceDefense: threeTier && !threeTier.placeholder ? threeTier.setBonus : threeTier?.placeholder ? null : 0,
    threePieceTierLabel: threeTier?.label,
    threePieceTierIndex: threeIndex,
    sixPieceAttack: sixTier && !sixTier.placeholder ? sixTier.setBonus : sixTier?.placeholder ? null : 0,
    sixPieceTierLabel: sixTier?.label,
    sixPieceTierIndex: sixIndex,
  };
}

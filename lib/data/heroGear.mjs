// Hero Gear cost data — ALL PLACEHOLDER.
//
// No freely-reusable source was found matching this game's specific Hero Gear
// resource model (XP, Forgehammers, Mithril, Mythic Gear currency). Every cost
// value below is `null` and flagged `// TODO: source real data`. Do not treat
// any number that appears in the Hero Gear Optimizer UI as confirmed — the
// component labels every screen that relies on this file "Preview / data
// pending" per the explicit decision to ship structure now and fill in real
// numbers later without touching calculation logic.
//
// The shape is deliberately a flat array of { level/tier, <resource>: null }
// rows so a real value can be dropped in (replacing `null` with a number) for
// any single row without changing lib/heroGearOptimizer.mjs.

export const HERO_GEAR_PIECES = Array.from({ length: 12 }, (_, i) => ({
  id: `piece-${i + 1}`,
  label: `Hero Gear Piece ${i + 1}`,
}));

// 20 XP levels per piece (0 = not upgraded). Level count is a placeholder guess
// at ladder shape, not sourced — adjust once real data is available.
export const HERO_GEAR_LEVELS = Array.from({ length: 21 }, (_, level) => ({
  level,
  label: level === 0 ? 'Not upgraded' : `Level ${level}`,
}));

// TODO: source real data. XP required to reach each level from the level before it.
export const HERO_GEAR_XP_COSTS_PLACEHOLDER = HERO_GEAR_LEVELS.map((entry) => ({
  level: entry.level,
  xp: entry.level === 0 ? 0 : null,
}));

// TODO: source real data. Forgehammers required to reach each level (gear forging/refinement).
export const HERO_GEAR_FORGEHAMMER_COSTS_PLACEHOLDER = HERO_GEAR_LEVELS.map((entry) => ({
  level: entry.level,
  forgehammers: entry.level === 0 ? 0 : null,
}));

// Imbuement is modeled as a separate track from level (a common pattern for this
// kind of gear system) — 5 tiers per piece, Mithril-gated. Tier count is a
// placeholder guess, not sourced.
export const HERO_GEAR_IMBUEMENT_TIERS = Array.from({ length: 6 }, (_, tier) => ({
  tier,
  label: tier === 0 ? 'Not imbued' : `Imbuement ${tier}`,
}));

// TODO: source real data. Mithril required to reach each Imbuement tier from the tier before it.
export const HERO_GEAR_MITHRIL_IMBUEMENT_COSTS_PLACEHOLDER = HERO_GEAR_IMBUEMENT_TIERS.map((entry) => ({
  tier: entry.tier,
  mithril: entry.tier === 0 ? 0 : null,
}));

// TODO: source real data. Mythic Gear currency required to promote one piece to
// Mythic quality — modeled as a single current/target boolean per piece rather
// than a ladder, since promotion is commonly a one-time threshold in this genre.
export const HERO_GEAR_MYTHIC_UPGRADE_COST_PLACEHOLDER = { mythicGear: null };

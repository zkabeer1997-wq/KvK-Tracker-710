/**
 * Charm reference data from Kingshot Optimizer
 * https://kingshotoptimizer.com/charms/references/
 * Card art: /images/charms-cards/{infantry|cavalry|archery}_lvl{1-22}.webp
 * 18 charms total (3 per gear piece × 6 pieces). Levels 1–22.
 */

export const CHARM_MAX_LEVEL = 22;

/** Per-level upgrade costs and cumulative stat bonus (same for all troop types). */
export const CHARM_LEVEL_TABLE = [
  { level: 1, guides: 5, designs: 5, statBonus: 9.0, cumulative: 9.0 },
  { level: 2, guides: 40, designs: 15, statBonus: 3.0, cumulative: 12.0 },
  { level: 3, guides: 60, designs: 40, statBonus: 4.0, cumulative: 16.0 },
  { level: 4, guides: 80, designs: 100, statBonus: 3.0, cumulative: 19.0 },
  { level: 5, guides: 100, designs: 200, statBonus: 6.0, cumulative: 25.0 },
  { level: 6, guides: 120, designs: 300, statBonus: 5.0, cumulative: 30.0 },
  { level: 7, guides: 140, designs: 400, statBonus: 5.0, cumulative: 35.0 },
  { level: 8, guides: 200, designs: 400, statBonus: 5.0, cumulative: 40.0 },
  { level: 9, guides: 300, designs: 400, statBonus: 5.0, cumulative: 45.0 },
  { level: 10, guides: 420, designs: 420, statBonus: 5.0, cumulative: 50.0 },
  { level: 11, guides: 560, designs: 420, statBonus: 5.0, cumulative: 55.0 },
  { level: 12, guides: 580, designs: 600, statBonus: 4.0, cumulative: 59.0 },
  { level: 13, guides: 610, designs: 780, statBonus: 4.0, cumulative: 63.0 },
  { level: 14, guides: 645, designs: 960, statBonus: 4.0, cumulative: 67.0 },
  { level: 15, guides: 685, designs: 1140, statBonus: 4.0, cumulative: 71.0 },
  { level: 16, guides: 730, designs: 1320, statBonus: 4.0, cumulative: 75.0 },
  { level: 17, guides: 780, designs: 1500, statBonus: 4.0, cumulative: 79.0 },
  { level: 18, guides: 835, designs: 1680, statBonus: 4.0, cumulative: 83.0 },
  { level: 19, guides: 895, designs: 1860, statBonus: 4.0, cumulative: 87.0 },
  { level: 20, guides: 960, designs: 2040, statBonus: 4.0, cumulative: 91.0 },
  { level: 21, guides: 1030, designs: 2220, statBonus: 4.0, cumulative: 95.0 },
  { level: 22, guides: 1105, designs: 2400, statBonus: 4.0, cumulative: 99.0 },
];

/** Optimizer card art paths (troop key → URL prefix). */
export const CHARM_CARD_TROOPS = {
  infantry: 'infantry',
  cavalry: 'cavalry',
  archer: 'archery',
};

export function charmCardUrl(troop, level) {
  const key = CHARM_CARD_TROOPS[troop] || troop;
  return `https://kingshotoptimizer.com/images/charms-cards/${key}_lvl${level}.webp`;
}

export function isValidCharmLevel(level) {
  const n = Number(level);
  return Number.isInteger(n) && n >= 1 && n <= CHARM_MAX_LEVEL;
}

export function toCharmLevelOption(level) {
  return isValidCharmLevel(level) ? `Level ${Number(level)}` : '';
}

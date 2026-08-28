import { GOVERNOR_GEAR_OPTIONS } from './equipmentOptions.mjs';

export const GOVERNOR_GEAR_OCR_SLOTS = {
  hat: 'cavalry_1',
  pendant: 'cavalry_2',
  shirt: 'infantry_1',
  pants: 'infantry_2',
  ring: 'archer_1',
  baton: 'archer_2',
};

const COLOR_ALIASES = {
  orange: 'Gold',
  gold: 'Gold',
  yellow: 'Gold',
  red: 'Red',
  purple: 'Purple',
  violet: 'Purple',
  blue: 'Blue',
  green: 'Green',
};

function clampStars(value) {
  const stars = Number.parseInt(value, 10);
  return Number.isFinite(stars) ? Math.max(0, Math.min(3, stars)) : 0;
}

function tierNumber(value) {
  const match = String(value || '').match(/t(?:ier)?\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function gearReadingToOption(reading) {
  const color = COLOR_ALIASES[String(reading?.rarity || reading?.color || '').toLowerCase().trim()];
  if (!color) return '';

  const tier = tierNumber(reading?.tier);
  const stars = clampStars(reading?.stars);
  let option = color;
  if (tier > 0) option += ` T${tier}`;

  if (color === 'Green') {
    if (stars > 0) option = 'Green 1 star';
  } else if (stars === 1) {
    option += GOVERNOR_GEAR_OPTIONS.includes(`${option} ★`) ? ' ★' : ' 1 star';
  } else if (stars === 2) {
    option += GOVERNOR_GEAR_OPTIONS.includes(`${option} ★★`) ? ' ★★' : ' 2 stars';
  } else if (stars === 3) {
    option += GOVERNOR_GEAR_OPTIONS.includes(`${option} ★★★`) ? ' ★★★' : ' 3 stars';
  }

  return GOVERNOR_GEAR_OPTIONS.includes(option) ? option : '';
}

export function normalizeGovernorGearReadings(readings) {
  const selections = {};
  const review = [];

  for (const reading of Array.isArray(readings) ? readings : []) {
    const slot = GOVERNOR_GEAR_OCR_SLOTS[String(reading?.piece || '').toLowerCase().trim()];
    if (!slot || selections[slot]) continue;
    const value = gearReadingToOption(reading);
    if (!value) continue;
    const confidence = Number(reading?.confidence);
    selections[slot] = value;
    review.push({
      slot,
      value,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    });
  }

  return { selections, review };
}

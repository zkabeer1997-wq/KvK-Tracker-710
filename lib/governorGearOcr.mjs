import { CHARM_LEVEL_OPTIONS, GOVERNOR_GEAR_OPTIONS } from './equipmentOptions.mjs';

/** Governor Gear piece labels from the Kingshot Optimizer OCR service → our form slot keys. */
export const GOVERNOR_GEAR_OCR_SLOTS = {
  hat: 'cavalry_1',
  pendant: 'cavalry_2',
  shirt: 'infantry_1',
  pants: 'infantry_2',
  ring: 'archer_1',
  baton: 'archer_2',
};

/**
 * Charms sit on the same six gear pieces (3 charms each = 18).
 * Maps piece + charm index (1–3) onto our CHARM_SLOTS keys.
 * Reference levels: https://kingshotoptimizer.com/charms/references/ (Level 1–22)
 */
export const CHARM_OCR_PIECE_BASE = {
  hat: { troop: 'cavalry', offset: 0 },
  pendant: { troop: 'cavalry', offset: 3 },
  shirt: { troop: 'infantry', offset: 0 },
  pants: { troop: 'infantry', offset: 3 },
  ring: { troop: 'archer', offset: 0 },
  baton: { troop: 'archer', offset: 3 },
};

/** Valid charm levels from Kingshot Optimizer reference (Lv 1 → 22). */
export const CHARM_OCR_MAX_LEVEL = 22;

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

function confidenceOf(reading) {
  const confidenceValues = reading?.confidence && typeof reading.confidence === 'object'
    ? Object.values(reading.confidence).map(Number).filter(Number.isFinite)
    : [Number(reading?.confidence)].filter(Number.isFinite);
  if (!confidenceValues.length) return null;
  return Math.max(0, Math.min(1, Math.min(...confidenceValues)));
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

/** Map OCR level (number or "Level 12" / "Lv12" / "12") → form option "Level N". */
export function charmReadingToOption(reading) {
  const raw = reading?.level ?? reading?.charm_level ?? reading?.value ?? reading?.tier;
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const match = text.match(/(?:level|lv|lvl)?\s*(\d{1,2})/i);
  if (!match) return '';
  const level = Number(match[1]);
  if (!Number.isFinite(level) || level < 1 || level > CHARM_OCR_MAX_LEVEL) return '';
  const option = `Level ${level}`;
  return CHARM_LEVEL_OPTIONS.includes(option) ? option : '';
}

function charmSlotKeyFromReading(reading) {
  const direct = String(reading?.slot || reading?.key || '').toLowerCase().trim();
  if (/^(infantry|cavalry|archer)_[1-6]$/.test(direct)) return direct;

  const piece = String(reading?.piece || reading?.gear || reading?.gear_piece || '').toLowerCase().trim();
  const base = CHARM_OCR_PIECE_BASE[piece];
  if (!base) return '';
  const index = Number(reading?.index ?? reading?.slot_index ?? reading?.charm_index ?? reading?.position ?? 1);
  if (!Number.isFinite(index) || index < 1 || index > 3) return '';
  return `${base.troop}_${base.offset + index}`;
}

export function normalizeGovernorGearReadings(readings) {
  const selections = {};
  const review = [];

  for (const reading of Array.isArray(readings) ? readings : []) {
    const slot = GOVERNOR_GEAR_OCR_SLOTS[String(reading?.piece || reading?.slot || '').toLowerCase().trim()];
    if (!slot || selections[slot]) continue;
    const value = gearReadingToOption(reading);
    if (!value) continue;
    const confidence = confidenceOf(reading);
    selections[slot] = value;
    review.push({ kind: 'gear', slot, value, confidence });
  }

  return { selections, review };
}

export function normalizeCharmReadings(readings) {
  const selections = {};
  const review = [];

  for (const reading of Array.isArray(readings) ? readings : []) {
    const slot = charmSlotKeyFromReading(reading);
    if (!slot || selections[slot]) continue;
    const value = charmReadingToOption(reading);
    if (!value) continue;
    const confidence = confidenceOf(reading);
    selections[slot] = value;
    review.push({ kind: 'charm', slot, value, confidence });
  }

  return { selections, review };
}

/**
 * Accept flexible OCR payloads:
 * - { slots: [...] } gear only (legacy)
 * - { gear / governor_gear / slots, charms / charm_slots }
 * - { pieces: [{ piece, rarity, tier, stars, charms: [{ index, level }] }] }
 */
export function normalizePowerProfileOcrPayload(payload) {
  const gearSource = payload?.slots
    || payload?.gear
    || payload?.governor_gear
    || payload?.gear_slots
    || [];
  const charmSource = payload?.charms
    || payload?.charm_slots
    || payload?.charmLevels
    || [];

  const nestedCharms = [];
  for (const piece of Array.isArray(gearSource) ? gearSource : []) {
    const pieceName = piece?.piece || piece?.slot;
    const charmsOnPiece = piece?.charms || piece?.charm_slots || piece?.charmLevels;
    if (!Array.isArray(charmsOnPiece)) continue;
    charmsOnPiece.forEach((charm, i) => {
      nestedCharms.push({
        ...charm,
        piece: pieceName,
        index: charm?.index ?? charm?.slot_index ?? (i + 1),
      });
    });
  }

  const gear = normalizeGovernorGearReadings(gearSource);
  const charms = normalizeCharmReadings([
    ...(Array.isArray(charmSource) ? charmSource : []),
    ...nestedCharms,
  ]);

  return {
    gear: gear.selections,
    charms: charms.selections,
    review: [...gear.review, ...charms.review],
    gearCount: Object.keys(gear.selections).length,
    charmCount: Object.keys(charms.selections).length,
  };
}

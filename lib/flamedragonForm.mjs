// Shared constants and helpers for the Flamedragon Tyrant Form.

export const HEROES = [
  'Chenko', 'Yeonwoo', 'Amane', 'Amadeus', 'Vivian', 'Margot', 'Thrud', 'Saul', 'Hilde', 'Gordon',
  'Eric', 'Fahd', 'Alcar', 'Long Fei', 'Triton', 'Sophia', 'Zoe', 'Jaeger', 'Petra', 'Rosa',
];

export const TIERS = ['T11', 'T10'];
export const TGS = ['TG8', 'TG7', 'TG6', 'TG5', 'Below TG5'];
export const ALLIANCES = ['710', 'RED', 'SKY'];

export const UNIT_FIELDS = [
  { key: 'infantry', label: 'Infantry', tier: 'infantry_tier', tg: 'infantry_tg' },
  { key: 'cavalry', label: 'Cavalry', tier: 'cavalry_tier', tg: 'cavalry_tg' },
  { key: 'archer', label: 'Archer', tier: 'archer_tier', tg: 'archer_tg' },
];

export const AVAILABILITY_OPTIONS = [
  '12-18 UTC (Full Battle)',
  'Unavailable',
  '12-15 UTC (First Half)',
  '15-18 UTC (Second Half)',
  'Intermittent',
];

export const VOICE_CHAT_OPTIONS = [
  'Yes',
  'Will be in the call without speaking',
  'No',
];

export const AUTO_HELP_OPTIONS = [
  'Yes',
  'No',
  'Can Purchase if needed',
];

function charmSlotsForType(type) {
  const labelPrefix = type[0].toUpperCase() + type.slice(1);
  return Array.from({ length: 6 }, (_, index) => ({
    key: `${type}_${index + 1}`,
    label: `${labelPrefix} Charm ${index + 1}`,
  }));
}

export const CHARM_SLOTS = [
  ...charmSlotsForType('infantry'),
  ...charmSlotsForType('cavalry'),
  ...charmSlotsForType('archer'),
];

// Level 1 to Level 22 (22 options).
export const CHARM_LEVEL_OPTIONS = Array.from({ length: 22 }, (_, index) => `Level ${index + 1}`);

export const GOVERNOR_GEAR_SLOTS = [
  { key: 'infantry_1', label: 'Infantry 1' },
  { key: 'infantry_2', label: 'Infantry 2' },
  { key: 'cavalry_1', label: 'Cavalry 1' },
  { key: 'cavalry_2', label: 'Cavalry 2' },
  { key: 'archer_1', label: 'Archer 1' },
  { key: 'archer_2', label: 'Archer 2' },
];

function gearTierOptions(color, maxTier) {
  const options = [];
  for (let tier = 0; tier < maxTier; tier += 1) {
    const base = tier === 0 ? color : `${color} T${tier}`;
    options.push(base, `${base} ★`, `${base} ★★`, `${base} ★★★`);
  }
  return options;
}

export const GOVERNOR_GEAR_OPTIONS = [
  'Green',
  'Green 1 star',
  'Blue',
  'Blue 1 star',
  'Blue 2 stars',
  'Blue 3 stars',
  'Purple',
  'Purple 1 star',
  'Purple 2 stars',
  'Purple 3 stars',
  'Purple T1',
  'Purple T1 1 star',
  'Purple T1 2 stars',
  'Purple T1 3 stars',
  ...gearTierOptions('Gold', 4),
  ...gearTierOptions('Red', 6),
  'Red T6',
  'Red T6 1 star',
  'Red T6 2 stars',
  'Red T6 3 stars',
];

export const POWER_PROFILE_FIELDS = [
  { key: 'pet_power', label: 'Pet Power' },
  { key: 'masters_power', label: 'Masters Power' },
];

function clean(value) {
  return String(value || '').trim();
}

export function blankGovernorGearSelections() {
  return Object.fromEntries(GOVERNOR_GEAR_SLOTS.map((slot) => [slot.key, '']));
}

export function serializeGovernorGearSelections(selections) {
  return GOVERNOR_GEAR_SLOTS
    .map((slot) => {
      const value = clean(selections && selections[slot.key]);
      return value ? `${slot.label}: ${value}` : '';
    })
    .filter(Boolean)
    .join(' | ');
}

export function parseGovernorGearSelections(value) {
  const selections = blankGovernorGearSelections();
  const labelsByKey = new Map(GOVERNOR_GEAR_SLOTS.map((slot) => [slot.label, slot.key]));
  String(value || '').split('|').forEach((part) => {
    const [rawLabel, ...rawValue] = part.split(':');
    const key = labelsByKey.get(clean(rawLabel));
    if (key) selections[key] = clean(rawValue.join(':'));
  });
  return selections;
}

export function blankCharmSelections() {
  return Object.fromEntries(CHARM_SLOTS.map((slot) => [slot.key, '']));
}

export function serializeCharmSelections(selections) {
  return CHARM_SLOTS
    .map((slot) => {
      const value = clean(selections && selections[slot.key]);
      return value ? `${slot.label}: ${value}` : '';
    })
    .filter(Boolean)
    .join(' | ');
}

export function parseCharmSelections(value) {
  const selections = blankCharmSelections();
  const labelsByKey = new Map(CHARM_SLOTS.map((slot) => [slot.label, slot.key]));
  String(value || '').split('|').forEach((part) => {
    const [rawLabel, ...rawValue] = part.split(':');
    const key = labelsByKey.get(clean(rawLabel));
    if (key) selections[key] = clean(rawValue.join(':'));
  });
  return selections;
}

export function sanitizeFlamedragonInput(input) {
  const record = {
    name: clean(input.name),
    member_id: clean(input.member_id),
    current_alliance: clean(input.current_alliance),
    infantry_tier: clean(input.infantry_tier),
    infantry_tg: clean(input.infantry_tg),
    cavalry_tier: clean(input.cavalry_tier),
    cavalry_tg: clean(input.cavalry_tg),
    archer_tier: clean(input.archer_tier),
    archer_tg: clean(input.archer_tg),
    heroes: Array.isArray(input.heroes) ? input.heroes.map(clean).filter(Boolean) : [],
    charms: clean(input.charms),
    governor_gear: clean(input.governor_gear),
    pet_power: clean(input.pet_power),
    masters_power: clean(input.masters_power),
    mystic_trial_score: clean(input.mystic_trial_score),
    availability: clean(input.availability),
    voice_chat: clean(input.voice_chat),
    auto_help: clean(input.auto_help),
    pin: clean(input.pin),
  };
  if (!record.name) throw new Error('Name is required.');
  if (!record.member_id) throw new Error('Member ID is required.');
  if (!record.pin) throw new Error('PIN is required.');
  return record;
}

export function publicFlamedragonRecord(record) {
  if (!record) return null;
  const { pin_hash, ...rest } = record;
  return rest;
}

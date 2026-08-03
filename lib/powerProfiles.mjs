export const POWER_PROFILE_FIELDS = [
 { key: 'pet_power', label: 'Pet Power' },
 { key: 'masters_power', label: 'Masters Power' },
];

export const GOVERNOR_GEAR_SLOTS = [
 { key: 'infantry_1', label: 'Infantry 1' },
 { key: 'infantry_2', label: 'Infantry 2' },
 { key: 'archer_1', label: 'Archer 1' },
 { key: 'archer_2', label: 'Archer 2' },
 { key: 'cavalry_1', label: 'Cavalry 1' },
 { key: 'cavalry_2', label: 'Cavalry 2' },
];

function gearTierOptions(color, maxTier) {
 const options = [];
 for (let tier = 0; tier <= maxTier; tier += 1) {
 const base = tier === 0 ? color : `${color} T${tier}`;
 options.push(base, `${base} ★`, `${base} ★★`, `${base} ★★★`);
 }
 return options;
}

export const GOVERNOR_GEAR_OPTIONS = [
 ...gearTierOptions('Gold', 3),
 ...gearTierOptions('Red', 6),
];

function charmSlotsForType(type) {
 const labelPrefix = type[0].toUpperCase() + type.slice(1);
 return Array.from({ length: 6 }, (_, index) => ({
 key: `${type}_${index + 1}`,
 label: `${labelPrefix} Charm ${index + 1}`,
 }));
}

export const CHARM_SLOTS = [
 ...charmSlotsForType('archer'),
 ...charmSlotsForType('infantry'),
 ...charmSlotsForType('cavalry'),
];

export const CHARM_LEVEL_OPTIONS = Array.from({ length: 16 }, (_, index) => `Level ${index + 8}`);

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

export function sanitizePowerProfileInput(input) {
 const profile = {
 name: clean(input.name),
 member_id: clean(input.member_id),
 governor_gear: clean(input.governor_gear),
 charms: clean(input.charms),
 hero_gear: clean(input.hero_gear),
 pet_power: clean(input.pet_power),
 masters_power: clean(input.masters_power),
 pin: clean(input.pin),
 };

 if (!profile.name) throw new Error('Name is required.');
 if (!profile.member_id) throw new Error('Member ID is required.');
 if (!profile.pin) throw new Error('PIN is required.');

 return profile;
}

export function publicPowerProfile(profile) {
 if (!profile) return null;

 return {
 member_id: String(profile.member_id),
 name: profile.name || '',
 governor_gear: profile.governor_gear || '',
 charms: profile.charms || '',
 hero_gear: profile.hero_gear || '',
 pet_power: profile.pet_power || '',
 masters_power: profile.masters_power || '',
 updated_at: profile.updated_at || null,
 };
}

export function mergePowerProfilesIntoRows(rows, powerProfiles) {
 const profilesByMemberId = new Map(
 (powerProfiles || []).map((profile) => [String(profile.member_id), publicPowerProfile(profile)]),
 );

 return rows.map((row) => ({
 ...row,
 power_profile: profilesByMemberId.get(String(row.member_id)) || null,
 }));
}

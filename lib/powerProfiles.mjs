export const POWER_PROFILE_FIELDS = [
 { key: 'pet_power', label: 'Pet Power' },
 { key: 'masters_power', label: 'Masters Power' },
];

export { CHARM_LEVEL_OPTIONS, GOVERNOR_GEAR_OPTIONS } from './equipmentOptions.mjs';
export { HEROES, PROFILE_UNIT_FIELDS, TROOP_TGS, TROOP_TIERS } from './playerCombatOptions.mjs';

export const GOVERNOR_GEAR_SLOTS = [
 { key: 'infantry_1', label: 'Infantry 1' },
 { key: 'infantry_2', label: 'Infantry 2' },
 { key: 'archer_1', label: 'Archer 1' },
 { key: 'archer_2', label: 'Archer 2' },
 { key: 'cavalry_1', label: 'Cavalry 1' },
 { key: 'cavalry_2', label: 'Cavalry 2' },
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
 infantry_tier: clean(input.infantry_tier),
 infantry_tg: clean(input.infantry_tg),
 cavalry_tier: clean(input.cavalry_tier),
 cavalry_tg: clean(input.cavalry_tg),
 archer_tier: clean(input.archer_tier),
 archer_tg: clean(input.archer_tg),
 heroes: Array.isArray(input.heroes) ? input.heroes.map(clean).filter(Boolean) : [],
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
 infantry_tier: profile.infantry_tier || '',
 infantry_tg: profile.infantry_tg || '',
 cavalry_tier: profile.cavalry_tier || '',
 cavalry_tg: profile.cavalry_tg || '',
 archer_tier: profile.archer_tier || '',
 archer_tg: profile.archer_tg || '',
 heroes: Array.isArray(profile.heroes) ? profile.heroes.map(String) : [],
 updated_at: profile.updated_at || null,
 };
}

export function mergePowerProfilesIntoRows(rows, powerProfiles) {
 const profilesByMemberId = new Map(
 (powerProfiles || []).map((profile) => [String(profile.member_id), publicPowerProfile(profile)]),
 );

 return rows.map((row) => {
 const powerProfile = profilesByMemberId.get(String(row.member_id)) || null;
 const eventUpdatedAt = Date.parse(row.updated_at || '');
 const profileUpdatedAt = Date.parse(powerProfile?.updated_at || '');
 const latestUpdatedAt = Number.isFinite(profileUpdatedAt)
 && (!Number.isFinite(eventUpdatedAt) || profileUpdatedAt > eventUpdatedAt)
 ? powerProfile.updated_at
 : row.updated_at;
 return {
 ...row,
 name: powerProfile ? powerProfile.name : row.name,
 infantry_tier: powerProfile ? powerProfile.infantry_tier : row.infantry_tier,
 infantry_tg: powerProfile ? powerProfile.infantry_tg : row.infantry_tg,
 cavalry_tier: powerProfile ? powerProfile.cavalry_tier : row.cavalry_tier,
 cavalry_tg: powerProfile ? powerProfile.cavalry_tg : row.cavalry_tg,
 archer_tier: powerProfile ? powerProfile.archer_tier : row.archer_tier,
 archer_tg: powerProfile ? powerProfile.archer_tg : row.archer_tg,
 heroes: powerProfile ? powerProfile.heroes : row.heroes,
 governor_gear: powerProfile ? powerProfile.governor_gear : row.governor_gear,
 charms: powerProfile ? powerProfile.charms : row.charms,
 hero_gear: powerProfile ? powerProfile.hero_gear : row.hero_gear,
 pet_power: powerProfile ? powerProfile.pet_power : row.pet_power,
 masters_power: powerProfile ? powerProfile.masters_power : row.masters_power,
 updated_at: latestUpdatedAt,
 event_updated_at: row.updated_at || null,
 player_profile_updated_at: powerProfile?.updated_at || null,
 power_profile: powerProfile,
 };
 });
}

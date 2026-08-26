import assert from 'node:assert/strict';
import {
  DEFAULT_TROOP_WEIGHTS,
  MAX_LEAD_HEROES,
  assignMemberToRally,
  autoAssignRallyMembers,
  createNextRally,
  formatRallyRows,
  getMatchingLeadHeroes,
  getTroopLevelSummary,
  normalizeRalliesForRows,
  parseStoredRallies,
  removeMemberFromRallies,
  removeRallyById,
  removeRowsAndAssignments,
  renameRally,
  serializeRalliesForSave,
  setRallyLead,
  setRallyTroopWeight,
  toggleRallyLeadHero,
} from '../app/admin/dashboard/rallyState.mjs';

function rally(id, overrides = {}) {
  return {
    id,
    name: id,
    memberIds: [],
    leadMemberId: '',
    troopWeights: { ...DEFAULT_TROOP_WEIGHTS },
    leadHeroes: [],
    ...overrides,
  };
}

// --- createNextRally -------------------------------------------------------

const created = createNextRally([], 'rally-1');
assert.equal(created.length, 1);
assert.deepEqual(created[0], {
  id: 'rally-1',
  name: 'Rally 1',
  memberIds: [],
  leadMemberId: '',
  troopWeights: { infantry: 0, cavalry: 0, archer: 0 },
  leadHeroes: [],
});
assert.equal(createNextRally(created, 'rally-2')[1].name, 'Rally 2', 'names follow list length');

// --- renameRally -----------------------------------------------------------

const renamed = renameRally([rally('a'), rally('b')], 'a', 'Bear Squad');
assert.equal(renamed[0].name, 'Bear Squad');
assert.equal(renamed[1].name, 'b', 'other rallies untouched');

// --- assignMemberToRally ---------------------------------------------------

// A member belongs to exactly one rally: assigning moves rather than copies.
const twoRallies = [rally('a', { memberIds: ['101'] }), rally('b')];
const moved = assignMemberToRally(twoRallies, 'b', '101');
assert.deepEqual(moved[0].memberIds, [], 'removed from previous rally');
assert.deepEqual(moved[1].memberIds, ['101'], 'added to target rally');

const reassigned = assignMemberToRally(moved, 'b', '101');
assert.deepEqual(reassigned[1].memberIds, ['101'], 'assigning twice does not duplicate');

assert.deepEqual(
  assignMemberToRally([rally('a')], 'a', 202)[0].memberIds,
  ['202'],
  'numeric ids are coerced to strings',
);

// --- removeMemberFromRallies / removeRallyById ------------------------------

const populated = [rally('a', { memberIds: ['101', '202'] }), rally('b', { memberIds: ['101'] })];
const pruned = removeMemberFromRallies(populated, '101');
assert.deepEqual(pruned[0].memberIds, ['202']);
assert.deepEqual(pruned[1].memberIds, []);

assert.deepEqual(removeRallyById(populated, 'a').map((r) => r.id), ['b']);

// --- setRallyLead ----------------------------------------------------------

assert.equal(setRallyLead([rally('a')], 'a', '303')[0].leadMemberId, '303');
assert.equal(setRallyLead([rally('a')], 'a', null)[0].leadMemberId, '', 'clearing yields empty string');

// --- setRallyTroopWeight ---------------------------------------------------

assert.deepEqual(
  setRallyTroopWeight([rally('a')], 'a', 'infantry', 60)[0].troopWeights,
  { infantry: 60, cavalry: 0, archer: 0 },
);
assert.equal(
  setRallyTroopWeight([rally('a')], 'a', 'infantry', 150)[0].troopWeights.infantry,
  100,
  'weights clamp to 100',
);
assert.equal(
  setRallyTroopWeight([rally('a')], 'a', 'cavalry', -20)[0].troopWeights.cavalry,
  0,
  'weights clamp to 0',
);
assert.equal(
  setRallyTroopWeight([rally('a')], 'a', 'archer', 'nonsense')[0].troopWeights.archer,
  0,
  'non-numeric input falls back to 0',
);

// --- toggleRallyLeadHero ---------------------------------------------------

let heroes = [rally('a')];
for (const hero of ['Chenko', 'Yeonwoo', 'Amane', 'Amadeus']) {
  heroes = toggleRallyLeadHero(heroes, 'a', hero);
}
assert.deepEqual(heroes[0].leadHeroes, ['Chenko', 'Yeonwoo', 'Amane', 'Amadeus']);

// A march carries at most MAX_LEAD_HEROES; the fifth is refused.
const overCap = toggleRallyLeadHero(heroes, 'a', 'Vivian');
assert.equal(overCap[0].leadHeroes.length, MAX_LEAD_HEROES);
assert.ok(!overCap[0].leadHeroes.includes('Vivian'), 'hero beyond the cap is not added');

// Toggling an existing hero removes it, which frees a slot.
const toggledOff = toggleRallyLeadHero(heroes, 'a', 'Amane');
assert.deepEqual(toggledOff[0].leadHeroes, ['Chenko', 'Yeonwoo', 'Amadeus']);
assert.ok(
  toggleRallyLeadHero(toggledOff, 'a', 'Vivian')[0].leadHeroes.includes('Vivian'),
  'a freed slot accepts a new hero',
);

// --- getMatchingLeadHeroes -------------------------------------------------

assert.deepEqual(
  getMatchingLeadHeroes({ heroes: ['Chenko', 'Zoe'] }, { leadHeroes: ['Chenko', 'Amane'] }),
  ['Chenko'],
);
assert.deepEqual(getMatchingLeadHeroes({}, { leadHeroes: ['Chenko'] }), [], 'member with no heroes');
assert.deepEqual(getMatchingLeadHeroes({ heroes: ['Chenko'] }, {}), [], 'rally with no lead heroes');

// --- getTroopLevelSummary --------------------------------------------------

assert.deepEqual(
  getTroopLevelSummary({
    infantry_tier: 'T11', infantry_tg: 'TG8',
    cavalry_tier: 'T10', cavalry_tg: 'TG7',
    archer_tier: 'T8', archer_tg: 'TG4',
  }),
  ['Inf T11/TG8', 'Cav T10/TG7', 'Arch T8/TG4'],
);
assert.deepEqual(
  getTroopLevelSummary({ infantry_tier: 'T11' }),
  ['Inf T11'],
  'troop types with no data are omitted entirely',
);

// --- autoAssignRallyMembers ------------------------------------------------

const roster = [
  { member_id: 'inf-high', heroes: [], infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'inf-low', heroes: [], infantry_tier: 'T10', infantry_tg: 'TG7', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'cav-high', heroes: [], infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'benched', heroes: [], availability: 'Not available', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T11', archer_tg: 'TG8' },
];

// An infantry-weighted rally should rank infantry specialists above cavalry ones.
const infantryRally = [rally('a', { troopWeights: { infantry: 100, cavalry: 0, archer: 0 } })];
const autoInfantry = autoAssignRallyMembers(infantryRally, 'a', roster, 2);
assert.deepEqual(autoInfantry[0].memberIds, ['inf-high', 'inf-low'], 'sorted by weighted troop score');

const cavalryRally = [rally('a', { troopWeights: { infantry: 0, cavalry: 100, archer: 0 } })];
assert.equal(
  autoAssignRallyMembers(cavalryRally, 'a', roster, 1)[0].memberIds[0],
  'cav-high',
  'weights steer selection',
);

assert.ok(
  !autoAssignRallyMembers(infantryRally, 'a', roster, 4)[0].memberIds.includes('benched'),
  'members marked not available are skipped despite the best stats',
);

assert.equal(
  autoAssignRallyMembers(infantryRally, 'a', roster, 1)[0].memberIds.length,
  1,
  'limit is respected',
);

// Members already committed to another rally are not poached.
const contested = [rally('a'), rally('b', { memberIds: ['inf-high'] })];
assert.ok(
  !autoAssignRallyMembers(contested, 'a', roster, 4)[0].memberIds.includes('inf-high'),
  'members assigned elsewhere are excluded',
);

// Matching a rally's lead heroes is worth a bonus over raw troop levels.
const heroRally = [rally('a', { troopWeights: { ...DEFAULT_TROOP_WEIGHTS }, leadHeroes: ['Chenko'] })];
const heroRoster = [
  { member_id: 'plain', heroes: [], infantry_tier: 'T11', infantry_tg: 'TG8' },
  { member_id: 'has-hero', heroes: ['Chenko'], infantry_tier: 'T1', infantry_tg: 'TG1' },
];
assert.equal(
  autoAssignRallyMembers(heroRally, 'a', heroRoster, 1)[0].memberIds[0],
  'has-hero',
  'lead-hero match outranks troop levels when weights are zero',
);

assert.deepEqual(
  autoAssignRallyMembers([rally('a')], 'missing', roster, 4),
  [rally('a')],
  'unknown rally id is a no-op',
);

// --- normalizeRalliesForRows / removeRowsAndAssignments ---------------------

assert.deepEqual(
  normalizeRalliesForRows([rally('a', { memberIds: ['101', 'ghost'] })], [{ member_id: '101' }])[0].memberIds,
  ['101'],
  'members with no matching roster row are dropped',
);

const removal = removeRowsAndAssignments(
  [{ member_id: '101' }, { member_id: '202' }],
  [rally('a', { memberIds: ['101', '202'] })],
  ['101'],
);
assert.deepEqual(removal.rows.map((r) => r.member_id), ['202']);
assert.deepEqual(removal.rallies[0].memberIds, ['202']);

// --- parseStoredRallies ----------------------------------------------------

assert.deepEqual(parseStoredRallies(''), [], 'empty input');
assert.deepEqual(parseStoredRallies('not json'), [], 'malformed JSON does not throw');
assert.deepEqual(parseStoredRallies('{"a":1}'), [], 'non-array payload');
assert.deepEqual(parseStoredRallies('[{"id":"a"}]'), [], 'entries missing a name are dropped');

const stored = parseStoredRallies(JSON.stringify([
  { id: 'a', name: 'Rally 1', memberIds: [101], leadHeroes: ['H1', 'H2', 'H3', 'H4', 'H5'] },
]));
assert.deepEqual(stored[0].memberIds, ['101'], 'ids normalised to strings');
assert.equal(
  stored[0].leadHeroes.length,
  MAX_LEAD_HEROES,
  'persisted state cannot smuggle in more lead heroes than the cap',
);
assert.deepEqual(stored[0].troopWeights, DEFAULT_TROOP_WEIGHTS, 'missing weights get defaults');

// --- serializeRalliesForSave / formatRallyRows round trip -------------------

const inMemory = [
  rally('a', {
    name: 'Bear Squad',
    memberIds: ['101', '202'],
    leadMemberId: '101',
    troopWeights: { infantry: 70, cavalry: 20, archer: 10 },
    leadHeroes: ['Chenko'],
  }),
];

const saved = serializeRalliesForSave(inMemory);
assert.deepEqual(saved, [{
  id: 'a',
  name: 'Bear Squad',
  position: 0,
  member_ids: ['101', '202'],
  lead_member_id: '101',
  // The DB stores weights and lead heroes together in one `formation` column.
  formation: { infantry: 70, cavalry: 20, archer: 10, leadHeroes: ['Chenko'] },
}]);

assert.deepEqual(formatRallyRows(saved), inMemory, 'save/load round trips losslessly');

assert.equal(
  serializeRalliesForSave([rally('a', { name: 123 })])[0].name,
  'Rally 1',
  'non-string names fall back to a positional default',
);
assert.equal(
  serializeRalliesForSave([rally('a', { leadMemberId: '' })])[0].lead_member_id,
  null,
  'empty lead is stored as null',
);
assert.deepEqual(serializeRalliesForSave('nonsense'), [], 'non-array input');
assert.deepEqual(formatRallyRows(undefined), [], 'non-array rows');
assert.deepEqual(
  formatRallyRows([{ id: 'a', name: 'A' }])[0].troopWeights,
  DEFAULT_TROOP_WEIGHTS,
  'rows with no formation column get default weights',
);

console.log('rallyState tests passed');

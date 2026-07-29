import assert from 'node:assert/strict';
import {
  assignMemberToRally,
  autoAssignRallyMembers,
  createNextRally,
  formatRallyRows,
  normalizeRalliesForRows,
  removeMemberFromRallies,
  serializeRalliesForSave,
  updateRallyFormation,
  updateRallyLeadHeroes,
  updateRallyLead,
} from '../app/admin/dashboard/rallyState.mjs';

const rallies = [
  { id: 'rally-1', name: 'Rally 1', memberIds: ['101', '202'], leadMemberId: '303' },
  { id: 'rally-2', name: 'Rally 2', memberIds: [] },
];

const created = createNextRally(rallies, 'rally-3');
assert.equal(created.length, 3);
assert.deepEqual(created[2], {
  id: 'rally-3',
  name: 'Rally 3',
  memberIds: [],
  leadMemberId: '',
  formation: { infantry: 0, cavalry: 0, archer: 0 },
  leadHeroNames: [],
  memberHeroAssignments: {},
  memberSetAssignments: {},
});

const assigned = assignMemberToRally(rallies, 'rally-2', '101');
assert.deepEqual(assigned[0].memberIds, ['202']);
assert.deepEqual(assigned[1].memberIds, ['101']);

const removed = removeMemberFromRallies(assigned, '101');
assert.deepEqual(removed[1].memberIds, []);

const normalized = normalizeRalliesForRows(
  [{ id: 'rally-1', name: 'Rally 1', memberIds: ['101', '404'], leadMemberId: '404' }],
  [{ member_id: 101 }, { member_id: '202' }],
);
assert.deepEqual(normalized[0].memberIds, ['101']);
assert.equal(normalized[0].leadMemberId, '');

const formatted = formatRallyRows([
  {
    id: 'rally-2',
    name: 'Rally 2',
    position: 2,
    member_ids: ['202'],
    lead_member_id: '303',
    formation: {
      infantry: 60,
      cavalry: 40,
      archer: 0,
      leadHeroNames: ['Chenko', 'Yeonwoo'],
      memberHeroAssignments: { 202: 'Chenko' },
      memberSetAssignments: { 202: 'firstHalf' },
    },
  },
  { id: 'rally-1', name: 'Rally 1', position: 1, member_ids: ['101'] },
]);
assert.deepEqual(formatted, [
  {
    id: 'rally-1',
    name: 'Rally 1',
    memberIds: ['101'],
    leadMemberId: '',
    formation: { infantry: 0, cavalry: 0, archer: 0 },
    leadHeroNames: [],
    memberHeroAssignments: {},
    memberSetAssignments: {},
  },
  {
    id: 'rally-2',
    name: 'Rally 2',
    memberIds: ['202'],
    leadMemberId: '303',
    formation: { infantry: 60, cavalry: 40, archer: 0 },
    leadHeroNames: ['Chenko', 'Yeonwoo'],
    memberHeroAssignments: { 202: 'Chenko' },
    memberSetAssignments: { 202: 'firstHalf' },
  },
]);

const serialized = serializeRalliesForSave(formatted);
assert.deepEqual(serialized, [
  {
    id: 'rally-1',
    name: 'Rally 1',
    position: 1,
    member_ids: ['101'],
    lead_member_id: null,
    formation: {
      infantry: 0,
      cavalry: 0,
      archer: 0,
      leadHeroNames: [],
      memberHeroAssignments: {},
      memberSetAssignments: {},
    },
  },
  {
    id: 'rally-2',
    name: 'Rally 2',
    position: 2,
    member_ids: ['202'],
    lead_member_id: '303',
    formation: {
      infantry: 60,
      cavalry: 40,
      archer: 0,
      leadHeroNames: ['Chenko', 'Yeonwoo'],
      memberHeroAssignments: { 202: 'Chenko' },
      memberSetAssignments: { 202: 'firstHalf' },
    },
  },
]);

const leadUpdated = updateRallyLead(formatted, 'rally-1', '202');
assert.equal(leadUpdated[0].leadMemberId, '202');
assert.deepEqual(leadUpdated[1].memberIds, []);

const formationUpdated = updateRallyFormation(formatted, 'rally-1', 'infantry', 150);
assert.deepEqual(formationUpdated[0].formation, { infantry: 100, cavalry: 0, archer: 0 });

let heroesUpdated = updateRallyLeadHeroes(formatted, 'rally-1', 'Chenko', true);
heroesUpdated = updateRallyLeadHeroes(heroesUpdated, 'rally-1', 'Yeonwoo', true);
heroesUpdated = updateRallyLeadHeroes(heroesUpdated, 'rally-1', 'Amane', true);
heroesUpdated = updateRallyLeadHeroes(heroesUpdated, 'rally-1', 'Amadeus', true);
heroesUpdated = updateRallyLeadHeroes(heroesUpdated, 'rally-1', 'Vivian', true);
assert.deepEqual(heroesUpdated[0].leadHeroNames, ['Chenko', 'Yeonwoo', 'Amane', 'Amadeus']);

const roster = [
  { member_id: 'i1', name: 'Inf 1', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'i2', name: 'Inf 2', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'i3', name: 'Inf 3', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'i4', name: 'Inf 4', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'i5', name: 'Inf 5', infantry_tier: 'T10', infantry_tg: 'TG7', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'c1', name: 'Cav 1', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'c2', name: 'Cav 2', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'c3', name: 'Cav 3', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T10', cavalry_tg: 'TG7', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'a1', name: 'Arc 1', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'a2', name: 'Arc 2', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'a3', name: 'Arc 3', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'used', name: 'Used', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T11', archer_tg: 'TG8' },
];

const autoAssigned = autoAssignRallyMembers(
  [
    { id: 'rally-1', name: 'Rally 1', leadMemberId: 'lead', memberIds: [], formation: { infantry: 50, cavalry: 10, archer: 40 } },
    { id: 'rally-2', name: 'Rally 2', leadMemberId: '', memberIds: ['used'], formation: { infantry: 0, cavalry: 0, archer: 0 } },
  ],
  'rally-1',
  roster,
);
assert.deepEqual(autoAssigned[0].memberIds, ['i1', 'i2', 'i3', 'i4', 'c1', 'a1', 'a2', 'a3']);
assert.equal(autoAssigned[0].memberIds.includes('lead'), false);
assert.equal(autoAssigned[0].memberIds.includes('used'), false);

const heroRoster = [
  { member_id: 'chenko-1', name: 'Chenko 1', heroes: ['Chenko'], availability: 'First half (12-14:30 UTC)', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'chenko-2', name: 'Chenko 2', heroes: ['Chenko'], availability: 'Second half (14:30-17 UTC)', infantry_tier: 'T10', infantry_tg: 'TG7', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'yeonwoo-1', name: 'Yeonwoo 1', heroes: ['Yeonwoo'], availability: 'First half (12-14:30 UTC)', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'yeonwoo-2', name: 'Yeonwoo 2', heroes: ['Yeonwoo'], availability: 'Second half (14:30-17 UTC)', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T10', cavalry_tg: 'TG7', archer_tier: 'T8', archer_tg: 'TG4' },
  { member_id: 'amane-1', name: 'Amane 1', heroes: ['Amane'], availability: 'First half (12-14:30 UTC)', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'amane-2', name: 'Amane 2', heroes: ['Amane'], availability: 'Second half (14:30-17 UTC)', infantry_tier: 'T8', infantry_tg: 'TG4', cavalry_tier: 'T8', cavalry_tg: 'TG4', archer_tier: 'T10', archer_tg: 'TG7' },
  { member_id: 'amadeus-1', name: 'Amadeus 1', heroes: ['Amadeus'], availability: 'First half (12-14:30 UTC)', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'amadeus-2', name: 'Amadeus 2', heroes: ['Amadeus'], availability: 'Second half (14:30-17 UTC)', infantry_tier: 'T10', infantry_tg: 'TG7', cavalry_tier: 'T10', cavalry_tg: 'TG7', archer_tier: 'T10', archer_tg: 'TG7' },
  { member_id: 'wrong-hero', name: 'Wrong Hero', heroes: ['Vivian'], availability: 'Full battle (12-17 UTC)', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T11', archer_tg: 'TG8' },
  { member_id: 'wrong-half', name: 'Wrong Half', heroes: ['Chenko'], availability: 'Unavailable', infantry_tier: 'T12', infantry_tg: 'TG9', cavalry_tier: 'T12', cavalry_tg: 'TG9', archer_tier: 'T12', archer_tg: 'TG9' },
  { member_id: 'other-rally', name: 'Other Rally', heroes: ['Chenko'], availability: 'First half (12-14:30 UTC)', infantry_tier: 'T11', infantry_tg: 'TG8', cavalry_tier: 'T11', cavalry_tg: 'TG8', archer_tier: 'T11', archer_tg: 'TG8' },
];

const heroAssigned = autoAssignRallyMembers(
  [
    {
      id: 'rally-1',
      name: 'Rally 1',
      leadMemberId: 'lead',
      memberIds: [],
      formation: { infantry: 50, cavalry: 25, archer: 25 },
      leadHeroNames: ['Chenko', 'Yeonwoo', 'Amane', 'Amadeus'],
    },
    { id: 'rally-2', name: 'Rally 2', leadMemberId: '', memberIds: ['other-rally'] },
  ],
  'rally-1',
  heroRoster,
);
assert.equal(heroAssigned[0].memberIds.length, 8);
assert.equal(heroAssigned[0].memberIds.includes('wrong-hero'), false);
assert.equal(heroAssigned[0].memberIds.includes('wrong-half'), false);
assert.equal(heroAssigned[0].memberIds.includes('other-rally'), false);
assert.deepEqual(Object.values(heroAssigned[0].memberHeroAssignments), [
  'Chenko',
  'Yeonwoo',
  'Amane',
  'Amadeus',
  'Chenko',
  'Yeonwoo',
  'Amane',
  'Amadeus',
]);
assert.deepEqual(Object.values(heroAssigned[0].memberSetAssignments), [
  'firstHalf',
  'firstHalf',
  'firstHalf',
  'firstHalf',
  'secondHalf',
  'secondHalf',
  'secondHalf',
  'secondHalf',
]);

console.log('rallyState tests passed');

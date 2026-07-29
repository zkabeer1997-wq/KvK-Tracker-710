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
    formation: { infantry: 60, cavalry: 40, archer: 0 },
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
  },
  {
    id: 'rally-2',
    name: 'Rally 2',
    memberIds: ['202'],
    leadMemberId: '303',
    formation: { infantry: 60, cavalry: 40, archer: 0 },
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
    formation: { infantry: 0, cavalry: 0, archer: 0 },
  },
  {
    id: 'rally-2',
    name: 'Rally 2',
    position: 2,
    member_ids: ['202'],
    lead_member_id: '303',
    formation: { infantry: 60, cavalry: 40, archer: 0 },
  },
]);

const leadUpdated = updateRallyLead(formatted, 'rally-1', '202');
assert.equal(leadUpdated[0].leadMemberId, '202');
assert.deepEqual(leadUpdated[1].memberIds, []);

const formationUpdated = updateRallyFormation(formatted, 'rally-1', 'infantry', 150);
assert.deepEqual(formationUpdated[0].formation, { infantry: 100, cavalry: 0, archer: 0 });

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

console.log('rallyState tests passed');

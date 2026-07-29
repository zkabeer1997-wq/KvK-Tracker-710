import assert from 'node:assert/strict';
import {
  assignMemberToRally,
  createNextRally,
  normalizeRalliesForRows,
  removeMemberFromRallies,
} from '../app/admin/dashboard/rallyState.mjs';

const rallies = [
  { id: 'rally-1', name: 'Rally 1', memberIds: ['101', '202'] },
  { id: 'rally-2', name: 'Rally 2', memberIds: [] },
];

const created = createNextRally(rallies, 'rally-3');
assert.equal(created.length, 3);
assert.deepEqual(created[2], { id: 'rally-3', name: 'Rally 3', memberIds: [] });

const assigned = assignMemberToRally(rallies, 'rally-2', '101');
assert.deepEqual(assigned[0].memberIds, ['202']);
assert.deepEqual(assigned[1].memberIds, ['101']);

const removed = removeMemberFromRallies(assigned, '101');
assert.deepEqual(removed[1].memberIds, []);

const normalized = normalizeRalliesForRows(
  [{ id: 'rally-1', name: 'Rally 1', memberIds: ['101', '404'] }],
  [{ member_id: 101 }, { member_id: '202' }],
);
assert.deepEqual(normalized[0].memberIds, ['101']);

console.log('rallyState tests passed');

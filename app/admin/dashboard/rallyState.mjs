export const RALLY_STORAGE_KEY = 'kvk-admin-rallies-v1';

export function createNextRally(rallies, id = `rally-${Date.now()}`) {
  return [
    ...rallies,
    {
      id,
      name: `Rally ${rallies.length + 1}`,
      memberIds: [],
    },
  ];
}

export function assignMemberToRally(rallies, rallyId, memberId) {
  const normalizedMemberId = String(memberId);

  return rallies.map((rally) => {
    const memberIds = rally.memberIds.filter((id) => id !== normalizedMemberId);

    if (rally.id !== rallyId) {
      return { ...rally, memberIds };
    }

    return {
      ...rally,
      memberIds: [...memberIds, normalizedMemberId],
    };
  });
}

export function removeMemberFromRallies(rallies, memberId) {
  const normalizedMemberId = String(memberId);

  return rallies.map((rally) => ({
    ...rally,
    memberIds: rally.memberIds.filter((id) => id !== normalizedMemberId),
  }));
}

export function normalizeRalliesForRows(rallies, rows) {
  const rowIds = new Set(rows.map((row) => String(row.member_id)));

  return rallies.map((rally) => ({
    ...rally,
    memberIds: rally.memberIds.filter((memberId) => rowIds.has(String(memberId))),
  }));
}

export function parseStoredRallies(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((rally) => rally && typeof rally.id === 'string' && typeof rally.name === 'string')
      .map((rally) => ({
        id: rally.id,
        name: rally.name,
        memberIds: Array.isArray(rally.memberIds) ? rally.memberIds.map(String) : [],
      }));
  } catch {
    return [];
  }
}

export const RALLY_STORAGE_KEY = 'kvk-admin-rallies-v1';
export const DEFAULT_FORMATION = { infantry: 0, cavalry: 0, archer: 0 };
export const TROOP_TYPES = ['infantry', 'cavalry', 'archer'];
export const RALLY_MEMBER_LIMIT = 8;

function normalizeFormation(formation = {}) {
  return TROOP_TYPES.reduce((next, troopType) => {
    const value = Number(formation[troopType] ?? 0);
    next[troopType] = Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0));
    return next;
  }, {});
}

function normalizeRally(rally) {
  return {
    id: String(rally.id),
    name: rally.name,
    memberIds: Array.isArray(rally.memberIds) ? rally.memberIds.map(String) : [],
    leadMemberId: rally.leadMemberId ? String(rally.leadMemberId) : '',
    formation: normalizeFormation(rally.formation),
  };
}

function numberFromLabel(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function troopScore(member, troopType) {
  return (
    numberFromLabel(member[`${troopType}_tier`]) * 100 +
    numberFromLabel(member[`${troopType}_tg`])
  );
}

export function createNextRally(rallies, id = `rally-${Date.now()}`) {
  return [
    ...rallies,
    {
      id,
      name: `Rally ${rallies.length + 1}`,
      memberIds: [],
      leadMemberId: '',
      formation: { ...DEFAULT_FORMATION },
    },
  ];
}

export function assignMemberToRally(rallies, rallyId, memberId) {
  const normalizedMemberId = String(memberId);

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
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

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    return {
    ...rally,
    memberIds: rally.memberIds.filter((id) => id !== normalizedMemberId),
    leadMemberId: rally.leadMemberId === normalizedMemberId ? '' : rally.leadMemberId,
    };
  });
}

export function normalizeRalliesForRows(rallies, rows) {
  const rowIds = new Set(rows.map((row) => String(row.member_id)));

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    return {
      ...rally,
      memberIds: rally.memberIds.filter((memberId) => rowIds.has(String(memberId))),
      leadMemberId: rowIds.has(rally.leadMemberId) ? rally.leadMemberId : '',
    };
  });
}

export function formatRallyRows(rows) {
  return [...(rows || [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((row) => ({
      id: String(row.id),
      name: row.name,
      memberIds: Array.isArray(row.member_ids) ? row.member_ids.map(String) : [],
      leadMemberId: row.lead_member_id ? String(row.lead_member_id) : '',
      formation: normalizeFormation(row.formation),
    }));
}

export function serializeRalliesForSave(rallies) {
  return rallies.map((rawRally, index) => {
    const rally = normalizeRally(rawRally);
    return {
    id: rally.id,
    name: rally.name,
    position: index + 1,
    member_ids: rally.memberIds.map(String),
    lead_member_id: rally.leadMemberId || null,
    formation: rally.formation,
    };
  });
}

export function updateRallyLead(rallies, rallyId, memberId) {
  const normalizedMemberId = String(memberId || '');

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    return {
      ...rally,
      leadMemberId: rally.id === rallyId ? normalizedMemberId : rally.leadMemberId,
      memberIds: rally.memberIds.filter((id) => id !== normalizedMemberId),
    };
  });
}

export function updateRallyFormation(rallies, rallyId, troopType, value) {
  if (!TROOP_TYPES.includes(troopType)) return rallies.map(normalizeRally);

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    if (rally.id !== rallyId) return rally;

    return {
      ...rally,
      formation: normalizeFormation({
        ...rally.formation,
        [troopType]: value,
      }),
    };
  });
}

function usedMemberIdsOutsideRally(rallies, rallyId) {
  const used = new Set();

  rallies.forEach((rawRally) => {
    const rally = normalizeRally(rawRally);
    if (rally.id === rallyId) return;
    if (rally.leadMemberId) used.add(rally.leadMemberId);
    rally.memberIds.forEach((memberId) => used.add(memberId));
  });

  return used;
}

function memberPoolForRally(rallies, rallyId, rows) {
  const targetRally = normalizeRally(rallies.find((rally) => rally.id === rallyId) || {});
  const usedIds = usedMemberIdsOutsideRally(rallies, rallyId);
  if (targetRally.leadMemberId) usedIds.add(targetRally.leadMemberId);

  return rows.filter((row) => !usedIds.has(String(row.member_id)));
}

function slotPlanForFormation(formation) {
  const normalized = normalizeFormation(formation);
  const total = TROOP_TYPES.reduce((sum, troopType) => sum + normalized[troopType], 0);
  if (total <= 0) return [];

  const rawSlots = TROOP_TYPES.map((troopType) => {
    const exact = (normalized[troopType] / total) * RALLY_MEMBER_LIMIT;
    return {
      troopType,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let remaining = RALLY_MEMBER_LIMIT - rawSlots.reduce((sum, item) => sum + item.count, 0);
  [...rawSlots]
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((item) => {
      if (remaining <= 0) return;
      item.count += 1;
      remaining -= 1;
    });

  return rawSlots.flatMap((item) => Array.from({ length: item.count }, () => item.troopType));
}

function bestAvailableForTroop(pool, selectedIds, troopType) {
  return pool
    .filter((member) => !selectedIds.has(String(member.member_id)))
    .sort((a, b) => troopScore(b, troopType) - troopScore(a, troopType))
    [0];
}

function bestAvailableOverall(pool, selectedIds, formation) {
  const priority = [...TROOP_TYPES].sort((a, b) => formation[b] - formation[a]);

  return pool
    .filter((member) => !selectedIds.has(String(member.member_id)))
    .sort((a, b) => {
      const bestA = Math.max(...priority.map((troopType) => troopScore(a, troopType)));
      const bestB = Math.max(...priority.map((troopType) => troopScore(b, troopType)));
      return bestB - bestA;
    })
    [0];
}

export function autoAssignRallyMembers(rallies, rallyId, rows) {
  const targetRally = normalizeRally(rallies.find((rally) => rally.id === rallyId) || {});
  const pool = memberPoolForRally(rallies, rallyId, rows);
  const selectedIds = new Set();
  const selected = [];

  slotPlanForFormation(targetRally.formation).forEach((troopType) => {
    const member = bestAvailableForTroop(pool, selectedIds, troopType);
    if (!member) return;
    selectedIds.add(String(member.member_id));
    selected.push(String(member.member_id));
  });

  while (selected.length < RALLY_MEMBER_LIMIT) {
    const member = bestAvailableOverall(pool, selectedIds, targetRally.formation);
    if (!member) break;
    selectedIds.add(String(member.member_id));
    selected.push(String(member.member_id));
  }

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    return rally.id === rallyId ? { ...rally, memberIds: selected } : rally;
  });
}

export function parseStoredRallies(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((rally) => rally && typeof rally.id === 'string' && typeof rally.name === 'string')
      .map(normalizeRally);
  } catch {
    return [];
  }
}

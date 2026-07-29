export const RALLY_STORAGE_KEY = 'kvk-admin-rallies-v1';
export const DEFAULT_FORMATION = { infantry: 0, cavalry: 0, archer: 0 };
export const TROOP_TYPES = ['infantry', 'cavalry', 'archer'];
export const RALLY_MEMBER_LIMIT = 16;
export const RALLY_SET_SIZE = 8;
export const HERO_SELECTION_LIMIT = 4;
export const RALLY_SETS = [
  { key: 'firstHalf', label: 'Set 1', availabilityLabel: 'First half' },
  { key: 'secondHalf', label: 'Set 2', availabilityLabel: 'Second half' },
];

function normalizeFormation(formation = {}) {
  return TROOP_TYPES.reduce((next, troopType) => {
    const value = Number(formation[troopType] ?? 0);
    next[troopType] = Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0));
    return next;
  }, {});
}

function normalizeRally(rally) {
  const memberIds = Array.isArray(rally.memberIds) ? rally.memberIds.map(String) : [];
  const memberIdSet = new Set(memberIds);
  const rawHeroAssignments =
    rally.memberHeroAssignments && typeof rally.memberHeroAssignments === 'object'
      ? rally.memberHeroAssignments
      : {};
  const rawSetAssignments =
    rally.memberSetAssignments && typeof rally.memberSetAssignments === 'object'
      ? rally.memberSetAssignments
      : {};

  return {
    id: String(rally.id),
    name: rally.name,
    memberIds,
    leadMemberId: rally.leadMemberId ? String(rally.leadMemberId) : '',
    formation: normalizeFormation(rally.formation),
    leadHeroNames: normalizeHeroNames(rally.leadHeroNames),
    memberHeroAssignments: Object.fromEntries(
      Object.entries(rawHeroAssignments)
        .map(([memberId, heroName]) => [String(memberId), String(heroName || '')])
        .filter(([memberId, heroName]) => memberIdSet.has(memberId) && heroName),
    ),
    memberSetAssignments: Object.fromEntries(
      Object.entries(rawSetAssignments)
        .map(([memberId, setKey]) => [String(memberId), String(setKey || '')])
        .filter(([memberId, setKey]) => memberIdSet.has(memberId) && RALLY_SETS.some((set) => set.key === setKey)),
    ),
  };
}

function normalizeHeroNames(heroNames = []) {
  if (!Array.isArray(heroNames)) return [];

  return [...new Set(heroNames.map((heroName) => String(heroName || '').trim()).filter(Boolean))]
    .slice(0, HERO_SELECTION_LIMIT);
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
      leadHeroNames: [],
      memberHeroAssignments: {},
      memberSetAssignments: {},
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
      memberHeroAssignments: {
        ...rally.memberHeroAssignments,
        [normalizedMemberId]: '',
      },
      memberSetAssignments: {
        ...rally.memberSetAssignments,
        [normalizedMemberId]: '',
      },
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
    memberHeroAssignments: Object.fromEntries(
      Object.entries(rally.memberHeroAssignments).filter(([id]) => id !== normalizedMemberId),
    ),
    memberSetAssignments: Object.fromEntries(
      Object.entries(rally.memberSetAssignments).filter(([id]) => id !== normalizedMemberId),
    ),
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
      memberHeroAssignments: Object.fromEntries(
        Object.entries(rally.memberHeroAssignments).filter(([memberId]) => rowIds.has(memberId)),
      ),
      memberSetAssignments: Object.fromEntries(
        Object.entries(rally.memberSetAssignments).filter(([memberId]) => rowIds.has(memberId)),
      ),
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
      leadHeroNames: normalizeHeroNames(row.lead_hero_names || row.formation?.leadHeroNames),
      memberHeroAssignments: row.member_hero_assignments || row.formation?.memberHeroAssignments || {},
      memberSetAssignments: row.formation?.memberSetAssignments || {},
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
    formation: {
      ...rally.formation,
      leadHeroNames: rally.leadHeroNames,
      memberHeroAssignments: rally.memberHeroAssignments,
      memberSetAssignments: rally.memberSetAssignments,
    },
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
      memberHeroAssignments: Object.fromEntries(
        Object.entries(rally.memberHeroAssignments).filter(([id]) => id !== normalizedMemberId),
      ),
      memberSetAssignments: Object.fromEntries(
        Object.entries(rally.memberSetAssignments).filter(([id]) => id !== normalizedMemberId),
      ),
    };
  });
}

export function updateRallyLeadHeroes(rallies, rallyId, heroName, selected) {
  const normalizedHeroName = String(heroName || '').trim();
  if (!normalizedHeroName) return rallies.map(normalizeRally);

  return rallies.map((rawRally) => {
    const rally = normalizeRally(rawRally);
    if (rally.id !== rallyId) return rally;

    const heroSet = new Set(rally.leadHeroNames);
    if (selected) {
      if (heroSet.size >= HERO_SELECTION_LIMIT && !heroSet.has(normalizedHeroName)) return rally;
      heroSet.add(normalizedHeroName);
    } else {
      heroSet.delete(normalizedHeroName);
    }

    const leadHeroNames = normalizeHeroNames([...heroSet]);
    const allowedHeroes = new Set(leadHeroNames);
    return {
      ...rally,
      leadHeroNames,
      memberHeroAssignments: Object.fromEntries(
        Object.entries(rally.memberHeroAssignments).filter(([, assignedHero]) => allowedHeroes.has(assignedHero)),
      ),
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

function slotPlanForFormation(formation, slotLimit = RALLY_MEMBER_LIMIT) {
  const normalized = normalizeFormation(formation);
  const total = TROOP_TYPES.reduce((sum, troopType) => sum + normalized[troopType], 0);
  if (total <= 0) return [];

  const rawSlots = TROOP_TYPES.map((troopType) => {
    const exact = (normalized[troopType] / total) * slotLimit;
    return {
      troopType,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let remaining = slotLimit - rawSlots.reduce((sum, item) => sum + item.count, 0);
  [...rawSlots]
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((item) => {
      if (remaining <= 0) return;
      item.count += 1;
      remaining -= 1;
    });

  return rawSlots
    .sort((a, b) => normalized[b.troopType] - normalized[a.troopType] || b.count - a.count)
    .flatMap((item) => Array.from({ length: item.count }, () => item.troopType));
}

function bestAvailableForTroop(pool, selectedIds, troopType) {
  return pool
    .filter((member) => !selectedIds.has(String(member.member_id)))
    .sort((a, b) => troopScore(b, troopType) - troopScore(a, troopType))
    [0];
}

function bestAvailableForTroopAndHero(pool, selectedIds, troopType, heroName) {
  return pool
    .filter((member) => !selectedIds.has(String(member.member_id)) && memberHasHero(member, heroName))
    .sort((a, b) => troopScore(b, troopType) - troopScore(a, troopType))
    [0];
}

function bestAvailableForTroopHeroAndSet(pool, selectedIds, troopType, heroName, setKey) {
  return pool
    .filter((member) => (
      !selectedIds.has(String(member.member_id)) &&
      memberHasHero(member, heroName) &&
      availabilityScore(member, setKey) > 0
    ))
    .sort((a, b) => (
      availabilityScore(b, setKey) - availabilityScore(a, setKey) ||
      troopScore(b, troopType) - troopScore(a, troopType)
    ))
    [0];
}

function bestAvailableOverall(pool, selectedIds, formation, heroName = '') {
  const priority = [...TROOP_TYPES].sort((a, b) => formation[b] - formation[a]);

  return pool
    .filter((member) => {
      if (selectedIds.has(String(member.member_id))) return false;
      return heroName ? memberHasHero(member, heroName) : true;
    })
    .sort((a, b) => {
      const bestA = Math.max(...priority.map((troopType) => troopScore(a, troopType)));
      const bestB = Math.max(...priority.map((troopType) => troopScore(b, troopType)));
      return bestB - bestA;
    })
    [0];
}

function bestAvailableOverallForHeroAndSet(pool, selectedIds, formation, heroName, setKey) {
  const priority = [...TROOP_TYPES].sort((a, b) => formation[b] - formation[a]);

  return pool
    .filter((member) => (
      !selectedIds.has(String(member.member_id)) &&
      memberHasHero(member, heroName) &&
      availabilityScore(member, setKey) > 0
    ))
    .sort((a, b) => {
      const availabilityDelta = availabilityScore(b, setKey) - availabilityScore(a, setKey);
      if (availabilityDelta !== 0) return availabilityDelta;

      const bestA = Math.max(...priority.map((troopType) => troopScore(a, troopType)));
      const bestB = Math.max(...priority.map((troopType) => troopScore(b, troopType)));
      return bestB - bestA;
    })
    [0];
}

function memberHasHero(member, heroName) {
  return Array.isArray(member.heroes) && member.heroes.some((hero) => String(hero) === heroName);
}

function slotPlanForHeroes(heroNames) {
  const normalizedHeroNames = normalizeHeroNames(heroNames);
  if (normalizedHeroNames.length === 0) return [];

  const slots = [];
  while (slots.length < RALLY_MEMBER_LIMIT) {
    normalizedHeroNames.forEach((heroName) => {
      if (slots.length < RALLY_MEMBER_LIMIT) slots.push(heroName);
    });
  }

  return slots;
}

function slotPlanForSets() {
  return RALLY_SETS.flatMap((set) => Array.from({ length: RALLY_SET_SIZE }, () => set.key));
}

function slotPlanForSetFormations(formation) {
  const setFormationSlots = slotPlanForFormation(formation, RALLY_SET_SIZE);
  return RALLY_SETS.flatMap(() => setFormationSlots);
}

function availabilityScore(member, setKey) {
  const availability = String(member.availability || '').toLowerCase();
  if (availability.includes('full')) return 1;
  if (setKey === 'firstHalf' && availability.includes('first')) return 2;
  if (setKey === 'secondHalf' && availability.includes('second')) return 2;
  return 0;
}

export function autoAssignRallyMembers(rallies, rallyId, rows) {
  const targetRally = normalizeRally(rallies.find((rally) => rally.id === rallyId) || {});
  const pool = memberPoolForRally(rallies, rallyId, rows);
  const selectedIds = new Set();
  const selected = [];
  const memberHeroAssignments = {};
  const memberSetAssignments = {};
  const troopSlots = slotPlanForSetFormations(targetRally.formation);
  const heroSlots = slotPlanForHeroes(targetRally.leadHeroNames);
  const setSlots = slotPlanForSets();

  if (heroSlots.length > 0) {
    heroSlots.forEach((heroName, index) => {
      const troopType = troopSlots[index] || TROOP_TYPES[0];
      const setKey = setSlots[index] || RALLY_SETS[0].key;
      const member =
        bestAvailableForTroopHeroAndSet(pool, selectedIds, troopType, heroName, setKey) ||
        bestAvailableOverallForHeroAndSet(pool, selectedIds, targetRally.formation, heroName, setKey);
      if (!member) return;
      const memberId = String(member.member_id);
      selectedIds.add(memberId);
      selected.push(memberId);
      memberHeroAssignments[memberId] = heroName;
      memberSetAssignments[memberId] = setKey;
    });

    return rallies.map((rawRally) => {
      const rally = normalizeRally(rawRally);
      return rally.id === rallyId ? { ...rally, memberIds: selected, memberHeroAssignments, memberSetAssignments } : rally;
    });
  }

  troopSlots.forEach((troopType) => {
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
    return rally.id === rallyId ? { ...rally, memberIds: selected, memberHeroAssignments: {}, memberSetAssignments: {} } : rally;
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

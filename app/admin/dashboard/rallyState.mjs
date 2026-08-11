export const RALLY_STORAGE_KEY = 'kvk-admin-rallies-v1';
export const DEFAULT_TROOP_WEIGHTS = { infantry: 0, cavalry: 0, archer: 0 };

export function createNextRally(rallies, id = `rally-${Date.now()}`) {
return [
...rallies,
{
id,
name: `Rally ${rallies.length + 1}`,
memberIds: [],
leadMemberId: '',
troopWeights: { ...DEFAULT_TROOP_WEIGHTS },
leadHeroes: [],
},
];
}

               export function renameRally(rallies, rallyId, name) {
                 return rallies.map((rally) => (
                   rally.id === rallyId ? { ...rally, name } : rally
                   ));
               }

function normalizeRally(rally) {
return {
id: rally.id,
name: rally.name,
memberIds: Array.isArray(rally.memberIds) ? rally.memberIds.map(String) : [],
leadMemberId: rally.leadMemberId ? String(rally.leadMemberId) : '',
troopWeights: {
...DEFAULT_TROOP_WEIGHTS,
...(rally.troopWeights || {}),
},
leadHeroes: Array.isArray(rally.leadHeroes) ? rally.leadHeroes.map(String) : [],
};
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

export function removeRallyById(rallies, rallyId) {
return rallies.filter((rally) => rally.id !== rallyId);
}

export function setRallyLead(rallies, rallyId, memberId) {
return rallies.map((rally) => (
rally.id === rallyId ? { ...rally, leadMemberId: String(memberId || '') } : rally
));
}

export function setRallyTroopWeight(rallies, rallyId, troopType, value) {
const numberValue = Math.max(0, Math.min(100, Number(value) || 0));
return rallies.map((rally) => (
rally.id === rallyId
? {
...rally,
troopWeights: {
...DEFAULT_TROOP_WEIGHTS,
...(rally.troopWeights || {}),
[troopType]: numberValue,
},
}
: rally
));
}

export function toggleRallyLeadHero(rallies, rallyId, hero) {
return rallies.map((rally) => {
if (rally.id !== rallyId) return rally;
const leadHeroes = rally.leadHeroes || [];
return {
...rally,
leadHeroes: leadHeroes.includes(hero)
? leadHeroes.filter((currentHero) => currentHero !== hero)
: [...leadHeroes, hero],
};
});
}

export function getMatchingLeadHeroes(member, rally) {
const memberHeroes = new Set((member.heroes || []).map(String));
return (rally.leadHeroes || []).filter((hero) => memberHeroes.has(String(hero)));
}

export function getTroopLevelSummary(member) {
return [
['Inf', member.infantry_tier, member.infantry_tg],
['Cav', member.cavalry_tier, member.cavalry_tg],
['Arch', member.archer_tier, member.archer_tg],
]
.map(([label, tier, tg]) => {
const parts = [tier, tg].filter(Boolean);
return parts.length ? `${label} ${parts.join('/')}` : '';
})
.filter(Boolean);
}

export function autoAssignRallyMembers(rallies, rallyId, rows, limit = 16) {
const targetRally = rallies.find((rally) => rally.id === rallyId);
if (!targetRally) return rallies;
const assignedElsewhere = new Set();
rallies.forEach((rally) => {
if (rally.id === rallyId) return;
rally.memberIds.forEach((memberId) => assignedElsewhere.add(String(memberId)));
});
const currentMemberIds = new Set(targetRally.memberIds.map(String));
const nextMemberIds = [...targetRally.memberIds.map(String)];
const sortedCandidates = rows
.filter((row) => !assignedElsewhere.has(String(row.member_id)))
.filter((row) => !currentMemberIds.has(String(row.member_id)))
.filter((row) => !String(row.availability || '').toLowerCase().includes('not available'))
.map((row) => ({ row, score: scoreMemberForRally(row, targetRally) }))
.sort((a, b) => b.score - a.score);
for (const candidate of sortedCandidates) {
if (nextMemberIds.length >= limit) break;
nextMemberIds.push(String(candidate.row.member_id));
}
return rallies.map((rally) => (
rally.id === rallyId ? { ...rally, memberIds: nextMemberIds } : rally
));
}

function scoreMemberForRally(row, rally) {
const weights = { ...DEFAULT_TROOP_WEIGHTS, ...(rally.troopWeights || {}) };
const heroScore = (rally.leadHeroes || []).reduce((score, hero) => (
(row.heroes || []).includes(hero) ? score + 25 : score
), 0);
return (
heroScore +
scoreTroop(row.infantry_tg, row.infantry_tier) * weights.infantry +
scoreTroop(row.cavalry_tg, row.cavalry_tier) * weights.cavalry +
scoreTroop(row.archer_tg, row.archer_tier) * weights.archer
);
}

function scoreTroop(tg, tier) {
return scoreText(tg) * 10 + scoreText(tier);
}

function scoreText(value) {
const text = String(value || '').toUpperCase();
const match = text.match(/(?:TG|T)(\d+)/);
return match ? Number(match[1]) : 0;
}

export function normalizeRalliesForRows(rallies, rows) {
const rowIds = new Set(rows.map((row) => String(row.member_id)));
return rallies.map((rally) => ({
...rally,
memberIds: rally.memberIds.filter((memberId) => rowIds.has(String(memberId))),
}));
}

export function removeRowsAndAssignments(rows, rallies, memberIds) {
const deletedIds = new Set(memberIds.map(String));
return {
rows: rows.filter((row) => !deletedIds.has(String(row.member_id))),
rallies: rallies.map((rally) => ({
...rally,
memberIds: rally.memberIds.filter((memberId) => !deletedIds.has(String(memberId))),
})),
};
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

const RALLY_DB_DEFAULT_FORMATION = { infantry: 0, cavalry: 0, archer: 0 };

export function serializeRalliesForSave(rallies) {
  if (!Array.isArray(rallies)) return [];
  return rallies.map((rally, index) => {
    const troopWeights = {
      ...RALLY_DB_DEFAULT_FORMATION,
      ...(rally.troopWeights || {}),
    };
    const leadHeroes = Array.isArray(rally.leadHeroes)
      ? rally.leadHeroes.map(String)
      : [];
    return {
      id: String(rally.id),
      name: typeof rally.name === 'string' ? rally.name : `Rally ${index + 1}`,
      position: index,
      member_ids: Array.isArray(rally.memberIds) ? rally.memberIds.map(String) : [],
      lead_member_id: rally.leadMemberId ? String(rally.leadMemberId) : null,
      formation: { ...troopWeights, leadHeroes },
    };
  });
}

export function formatRallyRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const formation = row.formation && typeof row.formation === 'object' ? row.formation : {};
    const { leadHeroes, ...troopWeights } = formation;
    return normalizeRally({
      id: row.id,
      name: row.name,
      memberIds: row.member_ids,
      leadMemberId: row.lead_member_id,
      troopWeights,
      leadHeroes,
    });
  });
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
RALLY_STORAGE_KEY,
formatRallyRows,
serializeRalliesForSave,
assignMemberToRally,
autoAssignRallyMembers,
createNextRally,
getMatchingLeadHeroes,
getTroopLevelSummary,
normalizeRalliesForRows,
parseStoredRallies,
removeRowsAndAssignments,
removeRallyById,
    renameRally,
removeMemberFromRallies,
setRallyLead,
setRallyTroopWeight,
toggleRallyLeadHero,
} from './rallyState.mjs';

const EMPTY_MEMBER = {
  name: '',
  member_id: '',
  infantry_tier: '',
  infantry_tg: '',
  cavalry_tier: '',
  cavalry_tg: '',
  archer_tier: '',
  archer_tg: '',
  heroes: '',
  availability: '',
  current_alliance: '',
};


const HEROES = [
'Chenko', 'Yeonwoo', 'Amane', 'Amadeus', 'Vivian', 'Margot', 'Thrud', 'Saul', 'Hilde', 'Gordon',
'Eric', 'Fahd', 'Alcar', 'Long Fei', 'Triton', 'Sophia', 'Zoe', 'Jaeger', 'Petra', 'Rosa'
];

const COLUMNS = [
{ key: 'name', label: 'Name' },
{ key: 'member_id', label: 'Member ID' },
{ key: 'infantry_tg', label: 'Infantry' },
{ key: 'cavalry_tg', label: 'Cavalry' },
{ key: 'archer_tg', label: 'Archer' },
{ key: 'heroes', label: 'Heroes' },
{ key: 'power_profile', label: 'Power' },
{ key: 'availability', label: 'Availability' },
  { key: 'current_alliance', label: 'Alliance' },
{ key: 'updated_at', label: 'Updated' },
];

function formatUnitLevel(tier, tg) {
return [tier, tg].filter(Boolean).join(' / ') || '-';
}

function availabilityTone(availability) {
const text = String(availability || '').toLowerCase();
if (text.includes('not available')) return 'unavailable';
if (text.includes('full')) return 'full';
if (text.includes('second')) return 'late';
if (text.includes('first')) return 'early';
return 'partial';
}

function powerValue(profile, key) {
return profile && profile[key] ? profile[key] : '-';
}

export default function AdminDashboardPage() {
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [actionStatus, setActionStatus] = useState('');
const [actionError, setActionError] = useState('');
const [deletingIds, setDeletingIds] = useState([]);
const [search, setSearch] = useState('');
const [sortKey, setSortKey] = useState('name');
const [sortDir, setSortDir] = useState('asc');
const [rallies, setRallies] = useState([]);
const [ralliesHydrated, setRalliesHydrated] = useState(false);
  const [newMember, setNewMember] = useState({ ...EMPTY_MEMBER });
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberStatus, setAddMemberStatus] = useState('');
const router = useRouter();

useEffect(() => {
async function load() {
setLoading(true);
const response = await fetch('/api/admin-submissions');
const result = await response.json();
if (!response.ok) {
setError(result.error || 'Unable to load entries.');
} else {
setRows(result.rows || []);
}
setLoading(false);
}
load();
}, []);

useEffect(() => {
let cancelled = false;
async function loadRallies() {
try {
const response = await fetch('/api/admin-rallies');
if (response.ok) {
const result = await response.json();
if (!cancelled) setRallies(formatRallyRows(result.rallies || []));
} else if (!cancelled) {
setRallies(parseStoredRallies(window.localStorage.getItem(RALLY_STORAGE_KEY)));
}
} catch {
if (!cancelled) setRallies(parseStoredRallies(window.localStorage.getItem(RALLY_STORAGE_KEY)));
}
if (!cancelled) setRalliesHydrated(true);
}
loadRallies();
return () => { cancelled = true; };
}, []);

useEffect(() => {
if (!ralliesHydrated) return;
try {
window.localStorage.setItem(RALLY_STORAGE_KEY, JSON.stringify(rallies));
} catch {}
const timer = setTimeout(() => {
fetch('/api/admin-rallies', {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ rallies: serializeRalliesForSave(rallies) }),
}).catch(() => {});
}, 800);
return () => clearTimeout(timer);
}, [rallies, ralliesHydrated]);

useEffect(() => {
if (!rows.length) return;
setRallies((current) => {
const normalized = normalizeRalliesForRows(current, rows);
return JSON.stringify(normalized) === JSON.stringify(current) ? current : normalized;
});
}, [rows]);

async function handleLogout() {
await fetch('/api/admin-logout', { method: 'POST' });
router.push('/admin/login');
router.refresh();
}

function handleSort(key) {
if (sortKey === key) {
setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
} else {
setSortKey(key);
setSortDir('asc');
}
}

function applyDeletedMemberIds(memberIds) {
setRows((currentRows) => {
const { rows: nextRows, rallies: nextRallies } = removeRowsAndAssignments(
currentRows,
rallies,
memberIds,
);
setRallies(nextRallies);
return nextRows;
});
}

async function deleteMember(row) {
const label = `${row.name || 'this entry'} (${row.member_id})`;
if (!window.confirm(`Remove ${label}? This cannot be undone.`)) return;
setActionStatus('');
setActionError('');
setDeletingIds((current) => [...current, String(row.member_id)]);
const response = await fetch(`/api/admin-submissions/${encodeURIComponent(row.member_id)}`, {
method: 'DELETE',
});
const result = await response.json();
setDeletingIds((current) => current.filter((id) => id !== String(row.member_id)));
if (!response.ok) {
setActionError(result.error || `Could not remove ${label}.`);
return;
}
applyDeletedMemberIds(result.deletedMemberIds || [row.member_id]);
setActionStatus(`Removed ${label}.`);
}

async function clearTestData() {
if (!window.confirm('Remove all Test Seed / TEST710 entries? This cannot be undone.')) return;
setActionStatus('');
setActionError('');
setDeletingIds(['__test_data__']);
const response = await fetch('/api/admin-submissions?scope=test', { method: 'DELETE' });
const result = await response.json();
setDeletingIds([]);
if (!response.ok) {
setActionError(result.error || 'Could not clear test data.');
return;
}
const deletedMemberIds = result.deletedMemberIds || [];
applyDeletedMemberIds(deletedMemberIds);
setActionStatus(`Cleared ${deletedMemberIds.length} test entries.`);
}

function handleCreateRally() {
setRallies((current) => createNextRally(current, `rally-${current.length + 1}-${Date.now()}`));
}

function handleDragStart(event, memberId) {
event.dataTransfer.effectAllowed = 'move';
event.dataTransfer.setData('text/plain', String(memberId));
}

function handleDropOnRally(event, rallyId) {
event.preventDefault();
const memberId = event.dataTransfer.getData('text/plain');
if (!memberId) return;
setRallies((current) => assignMemberToRally(current, rallyId, memberId));
}

function handleRemoveFromRally(memberId) {
setRallies((current) => removeMemberFromRallies(current, memberId));
}

function handleDeleteRally(rally) {
if (!window.confirm(`Delete ${rally.name}? Members will stay in the table.`)) return;
setRallies((current) => removeRallyById(current, rally.id));
}

function handleRallyLeadChange(rallyId, memberId) {
setRallies((current) => setRallyLead(current, rallyId, memberId));
}

function handleTroopWeightChange(rallyId, troopType, value) {
setRallies((current) => setRallyTroopWeight(current, rallyId, troopType, value));
}

function handleToggleLeadHero(rallyId, hero) {
setRallies((current) => toggleRallyLeadHero(current, rallyId, hero));
}

function handleAutoAssign(rallyId) {
setRallies((current) => autoAssignRallyMembers(current, rallyId, rows));
}

  function handleRenameRally(rallyId, name) {
    setRallies((current) => renameRally(current, rallyId, name));
  }

  function handleExportXlsx() {
    const headers = ['Name', 'Member ID', 'Infantry', 'Infantry TG', 'Cavalry', 'Cavalry TG', 'Archer', 'Archer TG', 'Heroes', 'Availability', 'Alliance', 'Updated'];
    const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bodyRows = filteredSorted.map((row) => {
      const cells = [row.name, row.member_id, formatUnitLevel(row.infantry_tier, row.infantry_tg), row.infantry_tg, formatUnitLevel(row.cavalry_tier, row.cavalry_tg), row.cavalry_tg, formatUnitLevel(row.archer_tier, row.archer_tg), row.archer_tg, (row.heroes || []).join(', '), row.availability, row.current_alliance, row.updated_at ? new Date(row.updated_at).toLocaleString() : ''];
      return '<tr>' + cells.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>';
    }).join('');
    const headerRow = '<tr>' + headers.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>';
    const table = '<table border="1"><thead>' + headerRow + '</thead><tbody>' + bodyRows + '</tbody></table>';
    const html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>' + table + '</body></html>';
    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'k710-roster-' + new Date().toISOString().slice(0, 10) + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  
  async function handleAddMember(event) {
    event.preventDefault();
    setAddMemberError('');
    setAddMemberStatus('');
    const name = newMember.name.trim();
    const memberId = newMember.member_id.trim();
    if (!name || !memberId) {
      setAddMemberError('Name and Member ID are required.');
      return;
    }
    setAddingMember(true);
    const payload = {
      name,
      member_id: memberId,
      infantry_tier: newMember.infantry_tier.trim() || null,
      infantry_tg: newMember.infantry_tg.trim() || null,
      cavalry_tier: newMember.cavalry_tier.trim() || null,
      cavalry_tg: newMember.cavalry_tg.trim() || null,
      archer_tier: newMember.archer_tier.trim() || null,
      archer_tg: newMember.archer_tg.trim() || null,
      heroes: newMember.heroes.split(',').map((h) => h.trim()).filter(Boolean),
      availability: newMember.availability.trim() || null,
      current_alliance: newMember.current_alliance.trim() || null,
    };
    const response = await fetch('/api/admin-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setAddingMember(false);
    if (!response.ok) {
      setAddMemberError(result.error || 'Could not add member.');
      return;
    }
    if (result.row) {
      setRows((current) => [result.row, ...current]);
    }
    setAddMemberStatus(`Added ${name}.`);
    setNewMember({ ...EMPTY_MEMBER });
  }
  

const filteredSorted = useMemo(() => {
const term = search.trim().toLowerCase();
let result = rows;
if (term) {
result = rows.filter((r) => {
return (
(r.name || '').toLowerCase().includes(term) ||
(r.member_id || '').toLowerCase().includes(term) ||
(r.heroes || []).some((h) => h.toLowerCase().includes(term)) ||
Object.values(r.power_profile || {}).some((value) => String(value || '').toLowerCase().includes(term)) ||
(r.availability || '').toLowerCase().includes(term)
);
});
}
const sorted = [...result].sort((a, b) => {
let av = a[sortKey];
let bv = b[sortKey];
if (Array.isArray(av)) av = av.join(', ');
if (Array.isArray(bv)) bv = bv.join(', ');
av = (av ?? '').toString().toLowerCase();
bv = (bv ?? '').toString().toLowerCase();
if (av < bv) return sortDir === 'asc' ? -1 : 1;
if (av > bv) return sortDir === 'asc' ? 1 : -1;
return 0;
});
return sorted;
}, [rows, search, sortKey, sortDir]);

const membersById = useMemo(() => {
return new Map(rows.map((row) => [String(row.member_id), row]));
}, [rows]);

const rallyByMemberId = useMemo(() => {
const assignments = new Map();
rallies.forEach((rally) => {
rally.memberIds.forEach((memberId) => assignments.set(String(memberId), rally.name));
});
return assignments;
}, [rallies]);

const assignedCount = rallyByMemberId.size;
const availableCount = rows.filter((row) => (
!String(row.availability || '').toLowerCase().includes('not available')
)).length;
const powerProfileCount = rows.filter((row) => row.power_profile).length;
const rallyCount = rallies.length;
const lastUpdated = rows.reduce((latest, row) => {
const timestamp = row.updated_at ? Date.parse(row.updated_at) : 0;
return timestamp > latest ? timestamp : latest;
}, 0);

return (
<div className="page admin-page">
<div className="card admin-dashboard-card">
<div className="admin-tabs">
<Link href="/admin/dashboard" className="admin-tab active">Player Records</Link>
<Link href="/admin/dashboard/interest" className="admin-tab">Interest Submissions</Link>
<Link href="/admin/dashboard/prep-ministers" className="admin-tab">KvK Prep Ministers</Link>
</div>
<div className="admin-hero">
<div>
<span className="admin-kicker">K710 command board</span>
<h1>Admin Dashboard</h1>
<p>Roster intake, rally composition, and hero guidance in one live planning view.</p>
</div>
<div className="admin-hero-actions">
<button
type="button"
onClick={clearTestData}
className="clear-test-data-btn"
disabled={deletingIds.includes('__test_data__')}
>
{deletingIds.includes('__test_data__') ? 'Clearing...' : 'Clear test data'}
</button>
<button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
</div>
</div>
<div className="card-body">
<div className="dashboard-stats" aria-label="Dashboard summary">
<div>
<span>Total members</span>
<strong>{rows.length}</strong>
</div>
<div>
<span>Available</span>
<strong>{availableCount}</strong>
</div>
<div>
<span>Assigned</span>
<strong>{assignedCount}</strong>
</div>
<div>
<span>Power profiles</span>
<strong>{powerProfileCount}</strong>
</div>
<div>
<span>Rallies</span>
<strong>{rallyCount}</strong>
</div>
<div>
<span>Latest update</span>
<strong>{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}</strong>
</div>
</div>
<div className="admin-actions">
<div className="search-shell">
<span>Search</span>
<input
type="text"
placeholder="Search by name, member ID, hero, availability..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="admin-search"
/>
</div>
</div>
{actionStatus && <div className="status">{actionStatus}</div>}
{actionError && <div className="status error">{actionError}</div>}
{loading && <p>Loading...</p>}
{error && <div className="status error">{error}</div>}
{!loading && !error && (
<div className="admin-workspace">
<section className="roster-panel" aria-label="Member roster">
<div className="panel-heading">
<div>
<span>Roster</span>
<h2>Members</h2>
</div>
<p>{filteredSorted.length} shown</p>
</div>
  <div className="roster-toolbar">
  <button type="button" className="export-xlsx-btn" onClick={handleExportXlsx}>
  Export to Excel
  </button>
  </div>
  <form className="add-member-form" onSubmit={handleAddMember}>
  <h3>Add roster member</h3>
 {addMemberError && <div className="status error">{addMemberError}</div>}
  {addMemberStatus && <div className="status">{addMemberStatus}</div>}
    <div className="add-member-grid">
    <input type="text" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
    <input type="text" placeholder="Member ID" value={newMember.member_id} onChange={(e) => setNewMember({ ...newMember, member_id: e.target.value })} />
    <input type="text" placeholder="Infantry tier" value={newMember.infantry_tier} onChange={(e) => setNewMember({ ...newMember, infantry_tier: e.target.value })} />
    <input type="text" placeholder="Infantry TG" value={newMember.infantry_tg} onChange={(e) => setNewMember({ ...newMember, infantry_tg: e.target.value })} />
    <input type="text" placeholder="Cavalry tier" value={newMember.cavalry_tier} onChange={(e) => setNewMember({ ...newMember, cavalry_tier: e.target.value })} />
    <input type="text" placeholder="Cavalry TG" value={newMember.cavalry_tg} onChange={(e) => setNewMember({ ...newMember, cavalry_tg: e.target.value })} />
    <input type="text" placeholder="Archer tier" value={newMember.archer_tier} onChange={(e) => setNewMember({ ...newMember, archer_tier: e.target.value })} />
  <input type="text" placeholder="Archer TG" value={newMember.archer_tg} onChange={(e) => setNewMember({ ...newMember, archer_tg: e.target.value })} />
  <input type="text" placeholder="Heroes (comma separated)" value={newMember.heroes} onChange={(e) => setNewMember({ ...newMember, heroes: e.target.value })} />
  <input type="text" placeholder="Availability" value={newMember.availability} onChange={(e) => setNewMember({ ...newMember, availability: e.target.value })} />
  <input type="text" placeholder="Alliance" value={newMember.current_alliance} onChange={(e) => setNewMember({ ...newMember, current_alliance: e.target.value })} />
  </div>
  <button type="submit" className="add-member-submit" disabled={addingMember}>
{addingMember ? 'Adding...' : 'Add member'}
</button>
  </form>
<div className="admin-table-wrap">
<table className="admin-table">
<thead>
<tr>
{COLUMNS.map((col) => (
<th key={col.key} onClick={() => handleSort(col.key)}>
{col.label}
{sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
</th>
))}
<th>Actions</th>
</tr>
</thead>
<tbody>
{filteredSorted.map((row) => (
<tr
key={row.member_id}
draggable
onDragStart={(event) => handleDragStart(event, row.member_id)}
>
<td>
<div className="member-name-cell">
<span>{row.name}</span>
{rallyByMemberId.has(String(row.member_id)) && (
<span className="rally-badge">{rallyByMemberId.get(String(row.member_id))}</span>
)}
</div>
</td>
<td className="member-id-cell">{row.member_id}</td>
<td><span className="unit-pill">{formatUnitLevel(row.infantry_tier, row.infantry_tg)}</span></td>
<td><span className="unit-pill cavalry">{formatUnitLevel(row.cavalry_tier, row.cavalry_tg)}</span></td>
<td><span className="unit-pill archer">{formatUnitLevel(row.archer_tier, row.archer_tg)}</span></td>
<td>
<div className="heroes-cell">
<strong>{(row.heroes || []).length}</strong>
<span>{(row.heroes || []).slice(0, 3).join(', ') || '-'}</span>
</div>
</td>
<td>
{row.power_profile ? (
<div className="power-cell">
<span>Gov {powerValue(row.power_profile, 'governor_gear')}</span>
<span>Charms {powerValue(row.power_profile, 'charms')}</span>
<span>Hero {powerValue(row.power_profile, 'hero_gear')}</span>
<span>Pet {powerValue(row.power_profile, 'pet_power')}</span>
<span>Masters {powerValue(row.power_profile, 'masters_power')}</span>
</div>
) : (
<span className="missing-power-pill">No power profile</span>
)}
</td>
<td>
<span className={`availability-pill ${availabilityTone(row.availability)}`}>
{row.availability || '-'}
</span>
</td>
<td><span className="unit-pill">{row.current_alliance || '-'}</span></td>
                  <td className="updated-cell">{row.updated_at ? new Date(row.updated_at).toLocaleString() : ''}</td>
<td>
<button
type="button"
className="delete-entry-btn"
onClick={() => deleteMember(row)}
disabled={deletingIds.includes(String(row.member_id))}
>
{deletingIds.includes(String(row.member_id)) ? 'Removing...' : 'Remove'}
</button>
</td>
</tr>
))}
</tbody>
</table>
{filteredSorted.length === 0 && <p>No results found.</p>}
</div>
</section>
<aside className="rally-sidebar" aria-label="Rally planner">
<div className="rally-sidebar-header">
<div>
<span>Planner</span>
<h2>Rallies</h2>
<p>{assignedCount} members assigned</p>
</div>
<button type="button" onClick={handleCreateRally} className="create-rally-btn">
Create Rally {rallies.length + 1}
</button>
</div>
<div className="rally-list">
{rallies.length === 0 && (
<div className="rally-empty-state">Create Rally 1 to start assigning members.</div>
)}
{rallies.map((rally) => (
<section
key={rally.id}
className="rally-dropzone"
onDragOver={(event) => event.preventDefault()}
onDrop={(event) => handleDropOnRally(event, rally.id)}
>
<div className="rally-dropzone-header">
<div className="rally-title-row">
<input className="rally-name-input" type="text" value={rally.name} onChange={(event) => handleRenameRally(rally.id, event.target.value)} aria-label="Rally name" />
<span>{rally.memberIds.length}</span>
</div>
<button
type="button"
className="delete-rally-btn"
onClick={() => handleDeleteRally(rally)}
aria-label={`Delete ${rally.name}`}
>
Delete
</button>
</div>
<div className="rally-controls">
<label className="rally-control-label">
<span>Rally Lead</span>
<select
value={rally.leadMemberId || ''}
onChange={(event) => handleRallyLeadChange(rally.id, event.target.value)}
>
<option value="">Select lead</option>
{rows.map((row) => (
<option key={row.member_id} value={row.member_id}>
{row.name} ({row.member_id})
</option>
))}
</select>
</label>
<div className="troop-weight-grid" aria-label={`${rally.name} troop criteria`}>
{[
['infantry', 'Infantry %'],
['cavalry', 'Cavalry %'],
['archer', 'Archer %'],
].map(([key, label]) => (
<label key={key} className="rally-control-label">
<span>{label}</span>
<input
type="number"
min="0"
max="100"
value={(rally.troopWeights && rally.troopWeights[key]) || 0}
onChange={(event) => handleTroopWeightChange(rally.id, key, event.target.value)}
/>
</label>
))}
</div>
<div className="lead-heroes-block">
<div className="lead-heroes-header">
<span>Lead Heroes</span>
<span>{(rally.leadHeroes || []).length}/4</span>
</div>
<div className="lead-heroes-grid">
{HEROES.map((hero) => {
const selected = (rally.leadHeroes || []).includes(hero);
const disabled = !selected && (rally.leadHeroes || []).length >= 4;
return (
<button
key={hero}
type="button"
className={selected ? 'lead-hero-btn selected' : 'lead-hero-btn'}
onClick={() => handleToggleLeadHero(rally.id, hero)}
disabled={disabled}
>
{hero}
</button>
);
})}
</div>
</div>
<button
type="button"
className="auto-assign-btn"
onClick={() => handleAutoAssign(rally.id)}
>
Auto assign 16
</button>
</div>
{rally.memberIds.length === 0 ? (
<p className="rally-drop-hint">Drop members here</p>
) : (
<div className="rally-member-list">
{rally.memberIds.map((memberId) => {
const member = membersById.get(String(memberId));
if (!member) return null;
const matchingLeadHeroes = getMatchingLeadHeroes(member, rally);
const troopLevels = getTroopLevelSummary(member);
return (
<div key={memberId} className="rally-member">
<div className="rally-member-details">
<strong>{member.name}</strong>
<span className="rally-member-id">{member.member_id}</span>
{troopLevels.length > 0 && (
<div className="rally-member-troops">
{troopLevels.map((troopLevel) => (
<span key={troopLevel}>{troopLevel}</span>
))}
</div>
)}
<div className="rally-member-heroes">
<span>Use:</span>
<strong>
{matchingLeadHeroes.length > 0 ? matchingLeadHeroes.join(', ') : 'No selected lead hero match'}
</strong>
</div>
</div>
<button
type="button"
onClick={() => handleRemoveFromRally(memberId)}
aria-label={`Remove ${member.name} from ${rally.name}`}
>
x
</button>
</div>
);
})}
</div>
)}
</section>
))}
</div>
</aside>
</div>
)}
</div>
</div>
</div>
);
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
RALLY_STORAGE_KEY,
assignMemberToRally,
autoAssignRallyMembers,
createNextRally,
getMatchingLeadHeroes,
getTroopLevelSummary,
normalizeRalliesForRows,
parseStoredRallies,
removeRowsAndAssignments,
removeRallyById,
    renameRally,
removeMemberFromRallies,
setRallyLead,
setRallyTroopWeight,
toggleRallyLeadHero,
} from './rallyState.mjs';

const EMPTY_MEMBER = {
  name: '',
  member_id: '',
  infantry_tier: '',
  infantry_tg: '',
  cavalry_tier: '',
  cavalry_tg: '',
  archer_tier: '',
  archer_tg: '',
  heroes: '',
  availability: '',
  current_alliance: '',
};


const HEROES = [
'Chenko', 'Yeonwoo', 'Amane', 'Amadeus', 'Vivian', 'Margot', 'Thrud', 'Saul', 'Hilde', 'Gordon',
'Eric', 'Fahd', 'Alcar', 'Long Fei', 'Triton', 'Sophia', 'Zoe', 'Jaeger', 'Petra', 'Rosa'
];

const COLUMNS = [
{ key: 'name', label: 'Name' },
{ key: 'member_id', label: 'Member ID' },
{ key: 'infantry_tg', label: 'Infantry' },
{ key: 'cavalry_tg', label: 'Cavalry' },
{ key: 'archer_tg', label: 'Archer' },
{ key: 'heroes', label: 'Heroes' },
{ key: 'power_profile', label: 'Power' },
{ key: 'availability', label: 'Availability' },
  { key: 'current_alliance', label: 'Alliance' },
{ key: 'updated_at', label: 'Updated' },
];

function formatUnitLevel(tier, tg) {
return [tier, tg].filter(Boolean).join(' / ') || '-';
}

function availabilityTone(availability) {
const text = String(availability || '').toLowerCase();
if (text.includes('not available')) return 'unavailable';
if (text.includes('full')) return 'full';
if (text.includes('second')) return 'late';
if (text.includes('first')) return 'early';
return 'partial';
}

function powerValue(profile, key) {
return profile && profile[key] ? profile[key] : '-';
}

export default function AdminDashboardPage() {
const [rows, setRows] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [actionStatus, setActionStatus] = useState('');
const [actionError, setActionError] = useState('');
const [deletingIds, setDeletingIds] = useState([]);
const [search, setSearch] = useState('');
const [sortKey, setSortKey] = useState('name');
const [sortDir, setSortDir] = useState('asc');
const [rallies, setRallies] = useState([]);
const [ralliesHydrated, setRalliesHydrated] = useState(false);
  const [newMember, setNewMember] = useState({ ...EMPTY_MEMBER });
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberStatus, setAddMemberStatus] = useState('');
const router = useRouter();

useEffect(() => {
async function load() {
setLoading(true);
const response = await fetch('/api/admin-submissions');
const result = await response.json();
if (!response.ok) {
setError(result.error || 'Unable to load entries.');
} else {
setRows(result.rows || []);
}
setLoading(false);
}
load();
}, []);

useEffect(() => {
setRallies(parseStoredRallies(window.localStorage.getItem(RALLY_STORAGE_KEY)));
setRalliesHydrated(true);
}, []);

useEffect(() => {
if (!ralliesHydrated) return;
window.localStorage.setItem(RALLY_STORAGE_KEY, JSON.stringify(rallies));
}, [rallies, ralliesHydrated]);

useEffect(() => {
if (!rows.length) return;
setRallies((current) => {
const normalized = normalizeRalliesForRows(current, rows);
return JSON.stringify(normalized) === JSON.stringify(current) ? current : normalized;
});
}, [rows]);

async function handleLogout() {
await fetch('/api/admin-logout', { method: 'POST' });
router.push('/admin/login');
router.refresh();
}

function handleSort(key) {
if (sortKey === key) {
setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
} else {
setSortKey(key);
setSortDir('asc');
}
}

function applyDeletedMemberIds(memberIds) {
setRows((currentRows) => {
const { rows: nextRows, rallies: nextRallies } = removeRowsAndAssignments(
currentRows,
rallies,
memberIds,
);
setRallies(nextRallies);
return nextRows;
});
}

async function deleteMember(row) {
const label = `${row.name || 'this entry'} (${row.member_id})`;
if (!window.confirm(`Remove ${label}? This cannot be undone.`)) return;
setActionStatus('');
setActionError('');
setDeletingIds((current) => [...current, String(row.member_id)]);
const response = await fetch(`/api/admin-submissions/${encodeURIComponent(row.member_id)}`, {
method: 'DELETE',
});
const result = await response.json();
setDeletingIds((current) => current.filter((id) => id !== String(row.member_id)));
if (!response.ok) {
setActionError(result.error || `Could not remove ${label}.`);
return;
}
applyDeletedMemberIds(result.deletedMemberIds || [row.member_id]);
setActionStatus(`Removed ${label}.`);
}

async function clearTestData() {
if (!window.confirm('Remove all Test Seed / TEST710 entries? This cannot be undone.')) return;
setActionStatus('');
setActionError('');
setDeletingIds(['__test_data__']);
const response = await fetch('/api/admin-submissions?scope=test', { method: 'DELETE' });
const result = await response.json();
setDeletingIds([]);
if (!response.ok) {
setActionError(result.error || 'Could not clear test data.');
return;
}
const deletedMemberIds = result.deletedMemberIds || [];
applyDeletedMemberIds(deletedMemberIds);
setActionStatus(`Cleared ${deletedMemberIds.length} test entries.`);
}

function handleCreateRally() {
setRallies((current) => createNextRally(current, `rally-${current.length + 1}-${Date.now()}`));
}

function handleDragStart(event, memberId) {
event.dataTransfer.effectAllowed = 'move';
event.dataTransfer.setData('text/plain', String(memberId));
}

function handleDropOnRally(event, rallyId) {
event.preventDefault();
const memberId = event.dataTransfer.getData('text/plain');
if (!memberId) return;
setRallies((current) => assignMemberToRally(current, rallyId, memberId));
}

function handleRemoveFromRally(memberId) {
setRallies((current) => removeMemberFromRallies(current, memberId));
}

function handleDeleteRally(rally) {
if (!window.confirm(`Delete ${rally.name}? Members will stay in the table.`)) return;
setRallies((current) => removeRallyById(current, rally.id));
}

function handleRallyLeadChange(rallyId, memberId) {
setRallies((current) => setRallyLead(current, rallyId, memberId));
}

function handleTroopWeightChange(rallyId, troopType, value) {
setRallies((current) => setRallyTroopWeight(current, rallyId, troopType, value));
}

function handleToggleLeadHero(rallyId, hero) {
setRallies((current) => toggleRallyLeadHero(current, rallyId, hero));
}

function handleAutoAssign(rallyId) {
setRallies((current) => autoAssignRallyMembers(current, rallyId, rows));
}

  function handleRenameRally(rallyId, name) {
    setRallies((current) => renameRally(current, rallyId, name));
  }

  function handleExportXlsx() {
    const headers = ['Name', 'Member ID', 'Infantry', 'Infantry TG', 'Cavalry', 'Cavalry TG', 'Archer', 'Archer TG', 'Heroes', 'Availability', 'Alliance', 'Updated'];
    const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bodyRows = filteredSorted.map((row) => {
      const cells = [row.name, row.member_id, formatUnitLevel(row.infantry_tier, row.infantry_tg), row.infantry_tg, formatUnitLevel(row.cavalry_tier, row.cavalry_tg), row.cavalry_tg, formatUnitLevel(row.archer_tier, row.archer_tg), row.archer_tg, (row.heroes || []).join(', '), row.availability, row.current_alliance, row.updated_at ? new Date(row.updated_at).toLocaleString() : ''];
      return '<tr>' + cells.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>';
    }).join('');
    const headerRow = '<tr>' + headers.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>';
    const table = '<table border="1"><thead>' + headerRow + '</thead><tbody>' + bodyRows + '</tbody></table>';
    const html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>' + table + '</body></html>';
    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'k710-roster-' + new Date().toISOString().slice(0, 10) + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  
  async function handleAddMember(event) {
    event.preventDefault();
    setAddMemberError('');
    setAddMemberStatus('');
    const name = newMember.name.trim();
    const memberId = newMember.member_id.trim();
    if (!name || !memberId) {
      setAddMemberError('Name and Member ID are required.');
      return;
    }
    setAddingMember(true);
    const payload = {
      name,
      member_id: memberId,
      infantry_tier: newMember.infantry_tier.trim() || null,
      infantry_tg: newMember.infantry_tg.trim() || null,
      cavalry_tier: newMember.cavalry_tier.trim() || null,
      cavalry_tg: newMember.cavalry_tg.trim() || null,
      archer_tier: newMember.archer_tier.trim() || null,
      archer_tg: newMember.archer_tg.trim() || null,
      heroes: newMember.heroes.split(',').map((h) => h.trim()).filter(Boolean),
      availability: newMember.availability.trim() || null,
      current_alliance: newMember.current_alliance.trim() || null,
    };
    const response = await fetch('/api/admin-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setAddingMember(false);
    if (!response.ok) {
      setAddMemberError(result.error || 'Could not add member.');
      return;
    }
    if (result.row) {
      setRows((current) => [result.row, ...current]);
    }
    setAddMemberStatus(`Added ${name}.`);
    setNewMember({ ...EMPTY_MEMBER });
  }
  

const filteredSorted = useMemo(() => {
const term = search.trim().toLowerCase();
let result = rows;
if (term) {
result = rows.filter((r) => {
return (
(r.name || '').toLowerCase().includes(term) ||
(r.member_id || '').toLowerCase().includes(term) ||
(r.heroes || []).some((h) => h.toLowerCase().includes(term)) ||
Object.values(r.power_profile || {}).some((value) => String(value || '').toLowerCase().includes(term)) ||
(r.availability || '').toLowerCase().includes(term)
);
});
}
const sorted = [...result].sort((a, b) => {
let av = a[sortKey];
let bv = b[sortKey];
if (Array.isArray(av)) av = av.join(', ');
if (Array.isArray(bv)) bv = bv.join(', ');
av = (av ?? '').toString().toLowerCase();
bv = (bv ?? '').toString().toLowerCase();
if (av < bv) return sortDir === 'asc' ? -1 : 1;
if (av > bv) return sortDir === 'asc' ? 1 : -1;
return 0;
});
return sorted;
}, [rows, search, sortKey, sortDir]);

const membersById = useMemo(() => {
return new Map(rows.map((row) => [String(row.member_id), row]));
}, [rows]);

const rallyByMemberId = useMemo(() => {
const assignments = new Map();
rallies.forEach((rally) => {
rally.memberIds.forEach((memberId) => assignments.set(String(memberId), rally.name));
});
return assignments;
}, [rallies]);

const assignedCount = rallyByMemberId.size;
const availableCount = rows.filter((row) => (
!String(row.availability || '').toLowerCase().includes('not available')
)).length;
const powerProfileCount = rows.filter((row) => row.power_profile).length;
const rallyCount = rallies.length;
const lastUpdated = rows.reduce((latest, row) => {
const timestamp = row.updated_at ? Date.parse(row.updated_at) : 0;
return timestamp > latest ? timestamp : latest;
}, 0);

return (
<div className="page admin-page">
<div className="card admin-dashboard-card">
<div className="admin-tabs">
<Link href="/admin/dashboard" className="admin-tab active">Player Records</Link>
<Link href="/admin/dashboard/interest" className="admin-tab">Interest Submissions</Link>
<Link href="/admin/dashboard/prep-ministers" className="admin-tab">KvK Prep Ministers</Link>
</div>
<div className="admin-hero">
<div>
<span className="admin-kicker">K710 command board</span>
<h1>Admin Dashboard</h1>
<p>Roster intake, rally composition, and hero guidance in one live planning view.</p>
</div>
<div className="admin-hero-actions">
<button
type="button"
onClick={clearTestData}
className="clear-test-data-btn"
disabled={deletingIds.includes('__test_data__')}
>
{deletingIds.includes('__test_data__') ? 'Clearing...' : 'Clear test data'}
</button>
<button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
</div>
</div>
<div className="card-body">
<div className="dashboard-stats" aria-label="Dashboard summary">
<div>
<span>Total members</span>
<strong>{rows.length}</strong>
</div>
<div>
<span>Available</span>
<strong>{availableCount}</strong>
</div>
<div>
<span>Assigned</span>
<strong>{assignedCount}</strong>
</div>
<div>
<span>Power profiles</span>
<strong>{powerProfileCount}</strong>
</div>
<div>
<span>Rallies</span>
<strong>{rallyCount}</strong>
</div>
<div>
<span>Latest update</span>
<strong>{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}</strong>
</div>
</div>
<div className="admin-actions">
<div className="search-shell">
<span>Search</span>
<input
type="text"
placeholder="Search by name, member ID, hero, availability..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="admin-search"
/>
</div>
</div>
{actionStatus && <div className="status">{actionStatus}</div>}
{actionError && <div className="status error">{actionError}</div>}
{loading && <p>Loading...</p>}
{error && <div className="status error">{error}</div>}
{!loading && !error && (
<div className="admin-workspace">
<section className="roster-panel" aria-label="Member roster">
<div className="panel-heading">
<div>
<span>Roster</span>
<h2>Members</h2>
</div>
<p>{filteredSorted.length} shown</p>
</div>
  <div className="roster-toolbar">
  <button type="button" className="export-xlsx-btn" onClick={handleExportXlsx}>
  Export to Excel
  </button>
  </div>
  <form className="add-member-form" onSubmit={handleAddMember}>
  <h3>Add roster member</h3>
 {addMemberError && <div className="status error">{addMemberError}</div>}
  {addMemberStatus && <div className="status">{addMemberStatus}</div>}
    <div className="add-member-grid">
    <input type="text" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
    <input type="text" placeholder="Member ID" value={newMember.member_id} onChange={(e) => setNewMember({ ...newMember, member_id: e.target.value })} />
    <input type="text" placeholder="Infantry tier" value={newMember.infantry_tier} onChange={(e) => setNewMember({ ...newMember, infantry_tier: e.target.value })} />
    <input type="text" placeholder="Infantry TG" value={newMember.infantry_tg} onChange={(e) => setNewMember({ ...newMember, infantry_tg: e.target.value })} />
    <input type="text" placeholder="Cavalry tier" value={newMember.cavalry_tier} onChange={(e) => setNewMember({ ...newMember, cavalry_tier: e.target.value })} />
    <input type="text" placeholder="Cavalry TG" value={newMember.cavalry_tg} onChange={(e) => setNewMember({ ...newMember, cavalry_tg: e.target.value })} />
    <input type="text" placeholder="Archer tier" value={newMember.archer_tier} onChange={(e) => setNewMember({ ...newMember, archer_tier: e.target.value })} />
  <input type="text" placeholder="Archer TG" value={newMember.archer_tg} onChange={(e) => setNewMember({ ...newMember, archer_tg: e.target.value })} />
  <input type="text" placeholder="Heroes (comma separated)" value={newMember.heroes} onChange={(e) => setNewMember({ ...newMember, heroes: e.target.value })} />
  <input type="text" placeholder="Availability" value={newMember.availability} onChange={(e) => setNewMember({ ...newMember, availability: e.target.value })} />
  <input type="text" placeholder="Alliance" value={newMember.current_alliance} onChange={(e) => setNewMember({ ...newMember, current_alliance: e.target.value })} />
  </div>
  <button type="submit" className="add-member-submit" disabled={addingMember}>
{addingMember ? 'Adding...' : 'Add member'}
</button>
  </form>
<div className="admin-table-wrap">
<table className="admin-table">
<thead>
<tr>
{COLUMNS.map((col) => (
<th key={col.key} onClick={() => handleSort(col.key)}>
{col.label}
{sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
</th>
))}
<th>Actions</th>
</tr>
</thead>
<tbody>
{filteredSorted.map((row) => (
<tr
key={row.member_id}
draggable
onDragStart={(event) => handleDragStart(event, row.member_id)}
>
<td>
<div className="member-name-cell">
<span>{row.name}</span>
{rallyByMemberId.has(String(row.member_id)) && (
<span className="rally-badge">{rallyByMemberId.get(String(row.member_id))}</span>
)}
</div>
</td>
<td className="member-id-cell">{row.member_id}</td>
<td><span className="unit-pill">{formatUnitLevel(row.infantry_tier, row.infantry_tg)}</span></td>
<td><span className="unit-pill cavalry">{formatUnitLevel(row.cavalry_tier, row.cavalry_tg)}</span></td>
<td><span className="unit-pill archer">{formatUnitLevel(row.archer_tier, row.archer_tg)}</span></td>
<td>
<div className="heroes-cell">
<strong>{(row.heroes || []).length}</strong>
<span>{(row.heroes || []).slice(0, 3).join(', ') || '-'}</span>
</div>
</td>
<td>
{row.power_profile ? (
<div className="power-cell">
<span>Gov {powerValue(row.power_profile, 'governor_gear')}</span>
<span>Charms {powerValue(row.power_profile, 'charms')}</span>
<span>Hero {powerValue(row.power_profile, 'hero_gear')}</span>
<span>Pet {powerValue(row.power_profile, 'pet_power')}</span>
<span>Masters {powerValue(row.power_profile, 'masters_power')}</span>
</div>
) : (
<span className="missing-power-pill">No power profile</span>
)}
</td>
<td>
<span className={`availability-pill ${availabilityTone(row.availability)}`}>
{row.availability || '-'}
</span>
</td>
<td><span className="unit-pill">{row.current_alliance || '-'}</span></td>
                  <td className="updated-cell">{row.updated_at ? new Date(row.updated_at).toLocaleString() : ''}</td>
<td>
<button
type="button"
className="delete-entry-btn"
onClick={() => deleteMember(row)}
disabled={deletingIds.includes(String(row.member_id))}
>
{deletingIds.includes(String(row.member_id)) ? 'Removing...' : 'Remove'}
</button>
</td>
</tr>
))}
</tbody>
</table>
{filteredSorted.length === 0 && <p>No results found.</p>}
</div>
</section>
<aside className="rally-sidebar" aria-label="Rally planner">
<div className="rally-sidebar-header">
<div>
<span>Planner</span>
<h2>Rallies</h2>
<p>{assignedCount} members assigned</p>
</div>
<button type="button" onClick={handleCreateRally} className="create-rally-btn">
Create Rally {rallies.length + 1}
</button>
</div>
<div className="rally-list">
{rallies.length === 0 && (
<div className="rally-empty-state">Create Rally 1 to start assigning members.</div>
)}
{rallies.map((rally) => (
<section
key={rally.id}
className="rally-dropzone"
onDragOver={(event) => event.preventDefault()}
onDrop={(event) => handleDropOnRally(event, rally.id)}
>
<div className="rally-dropzone-header">
<div className="rally-title-row">
<input className="rally-name-input" type="text" value={rally.name} onChange={(event) => handleRenameRally(rally.id, event.target.value)} aria-label="Rally name" />
<span>{rally.memberIds.length}</span>
</div>
<button
type="button"
className="delete-rally-btn"
onClick={() => handleDeleteRally(rally)}
aria-label={`Delete ${rally.name}`}
>
Delete
</button>
</div>
<div className="rally-controls">
<label className="rally-control-label">
<span>Rally Lead</span>
<select
value={rally.leadMemberId || ''}
onChange={(event) => handleRallyLeadChange(rally.id, event.target.value)}
>
<option value="">Select lead</option>
{rows.map((row) => (
<option key={row.member_id} value={row.member_id}>
{row.name} ({row.member_id})
</option>
))}
</select>
</label>
<div className="troop-weight-grid" aria-label={`${rally.name} troop criteria`}>
{[
['infantry', 'Infantry %'],
['cavalry', 'Cavalry %'],
['archer', 'Archer %'],
].map(([key, label]) => (
<label key={key} className="rally-control-label">
<span>{label}</span>
<input
type="number"
min="0"
max="100"
value={(rally.troopWeights && rally.troopWeights[key]) || 0}
onChange={(event) => handleTroopWeightChange(rally.id, key, event.target.value)}
/>
</label>
))}
</div>
<div className="lead-heroes-block">
<div className="lead-heroes-header">
<span>Lead Heroes</span>
<span>{(rally.leadHeroes || []).length}/4</span>
</div>
<div className="lead-heroes-grid">
{HEROES.map((hero) => {
const selected = (rally.leadHeroes || []).includes(hero);
const disabled = !selected && (rally.leadHeroes || []).length >= 4;
return (
<button
key={hero}
type="button"
className={selected ? 'lead-hero-btn selected' : 'lead-hero-btn'}
onClick={() => handleToggleLeadHero(rally.id, hero)}
disabled={disabled}
>
{hero}
</button>
);
})}
</div>
</div>
<button
type="button"
className="auto-assign-btn"
onClick={() => handleAutoAssign(rally.id)}
>
Auto assign 16
</button>
</div>
{rally.memberIds.length === 0 ? (
<p className="rally-drop-hint">Drop members here</p>
) : (
<div className="rally-member-list">
{rally.memberIds.map((memberId) => {
const member = membersById.get(String(memberId));
if (!member) return null;
const matchingLeadHeroes = getMatchingLeadHeroes(member, rally);
const troopLevels = getTroopLevelSummary(member);
return (
<div key={memberId} className="rally-member">
<div className="rally-member-details">
<strong>{member.name}</strong>
<span className="rally-member-id">{member.member_id}</span>
{troopLevels.length > 0 && (
<div className="rally-member-troops">
{troopLevels.map((troopLevel) => (
<span key={troopLevel}>{troopLevel}</span>
))}
</div>
)}
<div className="rally-member-heroes">
<span>Use:</span>
<strong>
{matchingLeadHeroes.length > 0 ? matchingLeadHeroes.join(', ') : 'No selected lead hero match'}
</strong>
</div>
</div>
<button
type="button"
onClick={() => handleRemoveFromRally(memberId)}
aria-label={`Remove ${member.name} from ${rally.name}`}
>
x
</button>
</div>
);
})}
</div>
)}
</section>
))}
</div>
</aside>
</div>
)}
</div>
</div>
</div>
);
}

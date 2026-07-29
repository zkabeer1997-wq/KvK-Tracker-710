'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import {
  HERO_SELECTION_LIMIT,
  RALLY_STORAGE_KEY,
  assignMemberToRally,
  autoAssignRallyMembers,
  createNextRally,
  normalizeRalliesForRows,
  parseStoredRallies,
  removeMemberFromRallies,
  TROOP_TYPES,
  updateRallyFormation,
  updateRallyLeadHeroes,
  updateRallyLead,
} from './rallyState.mjs';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'member_id', label: 'Member ID' },
  { key: 'infantry_tier', label: 'Infantry Tier' },
  { key: 'infantry_tg', label: 'Infantry TG' },
  { key: 'cavalry_tier', label: 'Cavalry Tier' },
  { key: 'cavalry_tg', label: 'Cavalry TG' },
  { key: 'archer_tier', label: 'Archer Tier' },
  { key: 'archer_tg', label: 'Archer TG' },
  { key: 'heroes', label: 'Heroes' },
  { key: 'availability', label: 'Availability' },
  { key: 'updated_at', label: 'Updated' },
  ];
export default function AdminDashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [rallies, setRallies] = useState([]);
  const [ralliesHydrated, setRalliesHydrated] = useState(false);
  const [rallyStatus, setRallyStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from('public_submissions').select('*');
      if (error) {
        setError(error.message);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadRallies() {
      const localRallies = parseStoredRallies(window.localStorage.getItem(RALLY_STORAGE_KEY));

      try {
        const response = await fetch('/api/admin-rallies');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load rallies.');
        }

        const remoteRallies = payload.rallies || [];
        if (remoteRallies.length === 0 && localRallies.length > 0) {
          setRallies(localRallies);
          await saveRallies(localRallies, 'Migrated local rallies to shared storage.');
        } else {
          setRallies(remoteRallies);
          window.localStorage.setItem(RALLY_STORAGE_KEY, JSON.stringify(remoteRallies));
        }
      } catch (err) {
        setRallies(localRallies);
        setRallyStatus(err.message);
      } finally {
        setRalliesHydrated(true);
      }
    }

    loadRallies();
  }, []);

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

  function handleCreateRally() {
    saveRallies(createNextRally(rallies, `rally-${rallies.length + 1}-${Date.now()}`));
  }

  function handleDragStart(event, memberId) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(memberId));
  }

  function handleDropOnRally(event, rallyId) {
    event.preventDefault();
    const memberId = event.dataTransfer.getData('text/plain');
    if (!memberId) return;

    saveRallies(assignMemberToRally(rallies, rallyId, memberId));
  }

  function handleRemoveFromRally(memberId) {
    saveRallies(removeMemberFromRallies(rallies, memberId));
  }

  function handleLeadChange(rallyId, memberId) {
    saveRallies(updateRallyLead(rallies, rallyId, memberId));
  }

  function handleFormationChange(rallyId, troopType, value) {
    saveRallies(updateRallyFormation(rallies, rallyId, troopType, value));
  }

  function handleLeadHeroChange(rallyId, heroName, selected) {
    saveRallies(updateRallyLeadHeroes(rallies, rallyId, heroName, selected));
  }

  function handleAutoAssign(rallyId) {
    const rally = rallies.find((item) => item.id === rallyId);
    if ((rally?.leadHeroNames || []).length !== HERO_SELECTION_LIMIT) {
      setRallyStatus(`Select ${HERO_SELECTION_LIMIT} rally lead heroes before auto assigning.`);
      return;
    }

    saveRallies(autoAssignRallyMembers(rallies, rallyId, rows), 'Rally members auto-assigned.');
  }

  function troopSummary(member) {
    return [
      `I ${member.infantry_tier}/${member.infantry_tg}`,
      `C ${member.cavalry_tier}/${member.cavalry_tg}`,
      `A ${member.archer_tier}/${member.archer_tg}`,
    ].join(' | ');
  }

  async function saveRallies(nextRallies, successMessage = 'Rallies saved.') {
    setRallies(nextRallies);
    setRallyStatus('Saving rallies...');
    window.localStorage.setItem(RALLY_STORAGE_KEY, JSON.stringify(nextRallies));

    try {
      const response = await fetch('/api/admin-rallies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rallies: nextRallies }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save rallies.');
      }

      setRallyStatus(successMessage);
    } catch (err) {
      setRallyStatus(err.message);
    }
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

  const availableHeroes = useMemo(() => {
    const heroes = new Set();
    rows.forEach((row) => {
      (row.heroes || []).forEach((hero) => {
        const heroName = String(hero || '').trim();
        if (heroName) heroes.add(heroName);
      });
    });
    return [...heroes].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const rallyByMemberId = useMemo(() => {
    const assignments = new Map();
    rallies.forEach((rally) => {
      if (rally.leadMemberId) assignments.set(String(rally.leadMemberId), `${rally.name} Lead`);
      rally.memberIds.forEach((memberId) => assignments.set(String(memberId), rally.name));
    });
    return assignments;
  }, [rallies]);

  const assignedMemberIds = useMemo(() => {
    const assigned = new Set();
    rallies.forEach((rally) => {
      if (rally.leadMemberId) assigned.add(String(rally.leadMemberId));
      rally.memberIds.forEach((memberId) => assigned.add(String(memberId)));
    });
    return assigned;
  }, [rallies]);

  return (
    <div className="page">
    <div className="card admin-dashboard-card">
    <div className="card-header admin-header-row">
    <h1>Admin Dashboard</h1>
    <button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
    </div>
    <div className="card-body">
    <input
    type="text"
    placeholder="Search by name, member ID, hero, availability..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="admin-search"
    />
    {loading && <p>Loading...</p>}
    {error && <div className="status error">{error}</div>}
    {!loading && !error && (
      <div className="admin-workspace">
      <div className="admin-table-wrap">
      <table className="admin-table">
      <thead>
      <tr>
      {COLUMNS.map((col) => (
        <th key={col.key} onClick={() => handleSort(col.key)}>
        {col.label}
        {sortKey === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
        </th>
        ))}
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
        <td>{row.member_id}</td>
        <td>{row.infantry_tier}</td>
        <td>{row.infantry_tg}</td>
        <td>{row.cavalry_tier}</td>
        <td>{row.cavalry_tg}</td>
        <td>{row.archer_tier}</td>
        <td>{row.archer_tg}</td>
        <td>{(row.heroes || []).join(', ')}</td>
        <td>{row.availability}</td>
        <td>{row.updated_at ? new Date(row.updated_at).toLocaleString() : ''}</td>
        </tr>
        ))}
      </tbody>
      </table>
      {filteredSorted.length === 0 && <p>No results found.</p>}
      </div>
      <aside className="rally-sidebar" aria-label="Rally planner">
      <div className="rally-sidebar-header">
      <div>
      <h2>Rallies</h2>
      <p>Drag members here.</p>
      {rallyStatus && <p className="rally-sync-status">{rallyStatus}</p>}
      </div>
      <button
      type="button"
      onClick={handleCreateRally}
      className="create-rally-btn"
      disabled={!ralliesHydrated}
      >
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
        <h3>{rally.name}</h3>
        <span>{rally.memberIds.length}</span>
        </div>
        <div className="rally-lead-section">
        <h4>Rally Lead</h4>
        <select
        value={rally.leadMemberId || ''}
        onChange={(event) => handleLeadChange(rally.id, event.target.value)}
        className="rally-lead-select"
        >
        <option value="">Select lead</option>
        {rows.map((member) => {
          const memberId = String(member.member_id);
          const usedElsewhere = assignedMemberIds.has(memberId) && rally.leadMemberId !== memberId;
          return (
            <option key={memberId} value={memberId} disabled={usedElsewhere}>
            {member.name} ({member.member_id})
            </option>
            );
        })}
        </select>
        <div className="rally-formation-grid">
        {TROOP_TYPES.map((troopType) => (
          <label key={troopType}>
          <span>{troopType[0].toUpperCase() + troopType.slice(1)} %</span>
          <input
          type="number"
          min="0"
          max="100"
          value={rally.formation?.[troopType] ?? 0}
          onChange={(event) => handleFormationChange(rally.id, troopType, event.target.value)}
          />
          </label>
          ))}
        </div>
        <div className="rally-hero-section">
        <div className="rally-hero-header">
        <h4>Lead Heroes</h4>
        <span>{(rally.leadHeroNames || []).length}/{HERO_SELECTION_LIMIT}</span>
        </div>
        <div className="rally-hero-grid">
        {availableHeroes.map((heroName) => {
          const selected = (rally.leadHeroNames || []).includes(heroName);
          const disabled = !selected && (rally.leadHeroNames || []).length >= HERO_SELECTION_LIMIT;
          return (
            <label key={heroName} className="rally-hero-option">
            <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={(event) => handleLeadHeroChange(rally.id, heroName, event.target.checked)}
            />
            <span>{heroName}</span>
            </label>
            );
        })}
        </div>
        </div>
        </div>
        <div className="rally-members-section">
        <div className="rally-members-header">
        <h4>Rally Members</h4>
        <button
        type="button"
        onClick={() => handleAutoAssign(rally.id)}
        className="auto-assign-btn"
        disabled={(rally.leadHeroNames || []).length !== HERO_SELECTION_LIMIT}
        >
        Auto assign 8
        </button>
        </div>
        {rally.memberIds.length === 0 ? (
          <p className="rally-drop-hint">Drop members here</p>
          ) : (
          <div className="rally-member-list">
          {rally.memberIds.map((memberId) => {
            const member = membersById.get(String(memberId));
            if (!member) return null;

            return (
              <div key={memberId} className="rally-member">
              <div>
              <strong>{member.name}</strong>
              <span>{member.member_id}</span>
              <span>{troopSummary(member)}</span>
              {rally.memberHeroAssignments?.[String(memberId)] && (
                <span>Hero: {rally.memberHeroAssignments[String(memberId)]}</span>
              )}
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
        </div>
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

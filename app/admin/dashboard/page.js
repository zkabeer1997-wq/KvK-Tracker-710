'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import {
  RALLY_STORAGE_KEY,
  assignMemberToRally,
  createNextRally,
  normalizeRalliesForRows,
  parseStoredRallies,
  removeMemberFromRallies,
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

  const rallyByMemberId = useMemo(() => {
    const assignments = new Map();
    rallies.forEach((rally) => {
      rally.memberIds.forEach((memberId) => assignments.set(String(memberId), rally.name));
    });
    return assignments;
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
        <h3>{rally.name}</h3>
        <span>{rally.memberIds.length}</span>
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

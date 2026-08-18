'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';

// Columns used for search, sort, and CSV export (keeps every field).
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'member_id', label: 'Player ID' },
  { key: 'current_alliance', label: 'Alliance' },
  { key: 'infantry', label: 'Infantry' },
  { key: 'cavalry', label: 'Cavalry' },
  { key: 'archer', label: 'Archer' },
  { key: 'heroes', label: 'Heroes' },
  { key: 'charms', label: 'Charms' },
  { key: 'governor_gear', label: 'Governor Gear' },
  { key: 'pet_power', label: 'Pet Power' },
  { key: 'masters_power', label: 'Masters Power' },
  { key: 'mystic_trial_score', label: 'Mystic Trial' },
  { key: 'availability', label: 'Availability' },
  { key: 'voice_chat', label: 'Voice Chat' },
  { key: 'auto_help', label: 'Auto Help' },
  { key: 'updated_at', label: 'Updated' },
];

// Consolidated columns actually rendered in the table so all fits on one screen.
const TABLE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'member_id', label: 'Player ID' },
  { key: 'infantry', label: 'Troops' },
  { key: 'heroes', label: 'Heroes' },
  { key: 'governor_gear', label: 'Power' },
  { key: 'availability', label: 'Availability' },
  { key: 'voice_chat', label: 'Voice Chat' },
  { key: 'auto_help', label: 'Auto Help' },
  { key: 'updated_at', label: 'Updated' },
];

function unitLevel(tier, tg) {
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

function cellValue(row, key) {
  if (key === 'infantry') return unitLevel(row.infantry_tier, row.infantry_tg);
  if (key === 'cavalry') return unitLevel(row.cavalry_tier, row.cavalry_tg);
  if (key === 'archer') return unitLevel(row.archer_tier, row.archer_tg);
  if (key === 'heroes') return Array.isArray(row.heroes) ? row.heroes.join(', ') : (row.heroes || '');
  if (key === 'updated_at') return row.updated_at ? new Date(row.updated_at).toLocaleString() : '';
  return row[key] == null ? '' : String(row[key]);
}

export default function AdminFlamedragonPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await fetch('/api/admin-flamedragon');
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to load Flamedragon forms.');
      } else {
        setRows(result.rows || []);
        if (result.configured === false) {
          setError('Flamedragon forms table not found. Apply the flamedragon_forms migration in Supabase.');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter((row) => COLUMNS.some((col) => cellValue(row, col.key).toLowerCase().includes(q)));
    }
    const sorted = [...list].sort((a, b) => {
      const av = cellValue(a, sortKey).toLowerCase();
      const bv = cellValue(b, sortKey).toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, query, sortKey, sortDir]);

  function exportCsv() {
    const header = COLUMNS.map((c) => c.label).join(',');
    const lines = visibleRows.map((row) => COLUMNS.map((c) => {
      const val = cellValue(row, c.key).replace(/"/g, '""');
      return '"' + val + '"';
    }).join(','));
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'k710-flamedragon-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function renderCell(row, key) {
    if (key === 'name') {
      return (
        <div className="member-name-cell">
          <span>{row.name || '-'}</span>
          {row.current_alliance && <span className="rally-badge">{row.current_alliance}</span>}
        </div>
      );
    }
    if (key === 'member_id') {
      return <span className="member-id-cell">{row.member_id || '-'}</span>;
    }
    if (key === 'infantry') {
      return (
        <div className="flamedragon-troop-stack">
          <span className="unit-pill">Inf {unitLevel(row.infantry_tier, row.infantry_tg)}</span>
          <span className="unit-pill cavalry">Cav {unitLevel(row.cavalry_tier, row.cavalry_tg)}</span>
          <span className="unit-pill archer">Arc {unitLevel(row.archer_tier, row.archer_tg)}</span>
        </div>
      );
    }
    if (key === 'heroes') {
      const heroes = Array.isArray(row.heroes) ? row.heroes : [];
      return (
        <div className="heroes-cell">
          <strong>{heroes.length}</strong>
          <span>{heroes.slice(0, 3).join(', ') || '-'}</span>
        </div>
      );
    }
    if (key === 'governor_gear') {
      return (
        <div className="power-cell flamedragon-power-cell">
          <span>Gov {row.governor_gear || '-'}</span>
          <span>Charms {row.charms || '-'}</span>
          <span>Pet {row.pet_power || '-'}</span>
          <span>Masters {row.masters_power || '-'}</span>
          <span>Mystic {row.mystic_trial_score || '-'}</span>
        </div>
      );
    }
    if (key === 'availability') {
      return (
        <span className={'availability-pill ' + availabilityTone(row.availability)}>
          {row.availability || '-'}
        </span>
      );
    }
    if (key === 'voice_chat') {
      return <span className="unit-pill">{row.voice_chat || '-'}</span>;
    }
    if (key === 'auto_help') {
      return <span className="unit-pill archer">{row.auto_help || '-'}</span>;
    }
    if (key === 'updated_at') {
      return <span className="updated-cell">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</span>;
    }
    return <span>{cellValue(row, key) || '-'}</span>;
  }

  return (
    <AdminShell
      title="Flamedragon Tyrant"
      subtitle="K710 command board"
      onLogout={handleLogout}
      actions={<button type="button" onClick={exportCsv} className="logout-btn">Export CSV</button>}
    >
        <p className="admin-page-lead">Availability, levels, and heroes submitted through the public Flamedragon Tyrant form.</p>
        <div className="admin-toolbar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, alliance, availability..."
            className="admin-search"
          />
          <span className="admin-count">{visibleRows.length} of {rows.length}</span>
        </div>

        {error && <div className="status error">{error}</div>}

        <div className="admin-table-wrap">
          {loading ? (
            <p>Loading Flamedragon forms...</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  {TABLE_COLUMNS.map((col) => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}>
                      {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr><td colSpan={TABLE_COLUMNS.length}>No submissions yet.</td></tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.member_id}>
                      {TABLE_COLUMNS.map((col) => (
                        <td key={col.key}>{renderCell(row, col.key)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
    </AdminShell>
  );
}

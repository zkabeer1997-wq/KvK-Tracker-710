'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

function unitLevel(tier, tg) {
  return [tier, tg].filter(Boolean).join(' / ') || '-';
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
      return `"${val}"`;
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
  return (
    <div className="page admin-page">
      <div className="card admin-dashboard-card">
        <div className="admin-tabs">
          <Link href="/admin/dashboard" className="admin-tab">Player Records</Link>
          <Link href="/admin/dashboard/interest" className="admin-tab">Interest Submissions</Link>
          <Link href="/admin/dashboard/prep-ministers" className="admin-tab">KvK Prep Ministers</Link>
          <Link href="/admin/dashboard/flamedragon" className="admin-tab active">Flamedragon Tyrant</Link>
        </div>
        <div className="admin-hero">
          <div>
            <span className="admin-kicker">K710 command board</span>
            <h1>Flamedragon Tyrant Form</h1>
            <p>Availability, levels, and heroes submitted through the public Flamedragon Tyrant form.</p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" onClick={exportCsv} className="logout-btn">Export CSV</button>
            <button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
          </div>
        </div>

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
                  {COLUMNS.map((col) => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} style={{ cursor: 'pointer' }}>
                      {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length}>No submissions yet.</td></tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.member_id}>
                      {COLUMNS.map((col) => (
                        <td key={col.key}>{cellValue(row, col.key) || '-'}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

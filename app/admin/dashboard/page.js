'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

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
        <tr key={row.member_id}>
        <td>{row.name}</td>
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
      )}
    </div>
    </div>
    </div>
    );
}

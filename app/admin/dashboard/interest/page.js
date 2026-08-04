'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COLUMNS = [
  { key: 'in_game_name', label: 'In-game name' },
  { key: 'player_id', label: 'Player ID' },
  { key: 'discord_username', label: 'Discord' },
  { key: 'current_server', label: 'Current server' },
  { key: 'current_alliance', label: 'Current alliance' },
  { key: 'intake_period', label: 'Intake period' },
  { key: 'migrate_alliance', label: 'Migrating to' },
  { key: 'highest_troop_level', label: 'Troop level' },
  { key: 'current_tg', label: 'TG' },
  { key: 't11_units', label: 'T11' },
  { key: 'mystic_trial_stages', label: 'Mystic Trial' },
  { key: 'total_power', label: 'Total Power' },
  { key: 'willing_reduce_power', label: 'Reduce power' },
  { key: 'passes_required', label: 'Passes required' },
  { key: 'current_passes', label: 'Current passes' },
  { key: 'active_commit', label: 'Active commit' },
  { key: 'willing_save_resources', label: 'Save resources' },
  { key: 'participates_battles', label: 'Battles' },
  { key: 'spending_archetype', label: 'Spending' },
  { key: 'main_language', label: 'Language' },
  { key: 'created_at', label: 'Submitted' },
];

const NUMERIC_KEYS = new Set(['total_power', 'mystic_trial_stages', 'current_tg', 'passes_required', 'current_passes']);
const SEARCH_KEYS = ['in_game_name', 'current_server', 'player_id', 'current_alliance'];

function cellValue(row, key) {
  if (key === 't11_units') return (row.t11_units || []).join(', ');
  if (key === 'created_at') return row.created_at ? new Date(row.created_at).toLocaleString() : '';
  return row[key] == null ? '' : String(row[key]);
}

function buildMatcher(query) {
  const q = query.trim();
  if (!q) return null;
  const escaped = q.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
  if (q.includes('%')) {
    const pattern = '^' + escaped.split('%').join('.*') + '$';
    try { return new RegExp(pattern, 'i'); } catch (e) { return null; }
  }
  try { return new RegExp(escaped, 'i'); } catch (e) { return null; }
}

export default function AdminInterestPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [intakeFilter, setIntakeFilter] = useState('');
  const [migrateFilter, setMigrateFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await fetch('/api/admin-interest-submissions');
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to load submissions.');
      } else {
        setRows(result.rows || []);
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

  const intakeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.intake_period).filter(Boolean))).sort(),
    [rows]
  );
  const migrateOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.migrate_alliance).filter(Boolean))).sort(),
    [rows]
  );
  const serverOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.current_server).filter(Boolean))).sort(),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const matcher = buildMatcher(query);
    let out = rows.filter((row) => {
      if (intakeFilter && row.intake_period !== intakeFilter) return false;
      if (migrateFilter && row.migrate_alliance !== migrateFilter) return false;
      if (serverFilter && row.current_server !== serverFilter) return false;
      if (matcher) {
        const hit = SEARCH_KEYS.some((key) => matcher.test(String(row[key] || '')));
        if (!hit) return false;
      }
      return true;
    });
    out = out.slice().sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (NUMERIC_KEYS.has(sortKey)) {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
      } else if (sortKey === 'created_at') {
        av = a.created_at ? new Date(a.created_at).getTime() : 0;
        bv = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else {
        av = String(av == null ? '' : av).toLowerCase();
        bv = String(bv == null ? '' : bv).toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, query, intakeFilter, migrateFilter, serverFilter, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function exportExcel() {
    const header = COLUMNS.map((c) => c.label);
    const escapeCell = (v) => {
      const s = String(v == null ? '' : v).replace(/"/g, '""');
      return '"' + s + '"';
    };
    const lines = [header.map(escapeCell).join(',')];
    visibleRows.forEach((row) => {
      lines.push(COLUMNS.map((c) => escapeCell(cellValue(row, c.key))).join(','));
    });
    const csv = '\ufeff' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interest-submissions-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page admin-page">
      <div className="card admin-dashboard-card">
        <div className="admin-tabs">
          <Link href="/admin/dashboard" className="admin-tab">Player Records</Link>
          <Link href="/admin/dashboard/interest" className="admin-tab active">Interest Submissions</Link>
        </div>
        <div className="admin-hero">
          <div>
            <span className="admin-kicker">K710 command board</span>
            <h1>Interest Submissions</h1>
            <p>Review 710 transfer onboarding requests submitted through the public interest form.</p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" onClick={handleLogout} className="logout-btn">Log Out</button>
          </div>
        </div>
        <div className="card-body">
          <div className="dashboard-stats" aria-label="Interest summary">
            <div>
              <span>Total submissions</span>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <span>Showing</span>
              <strong>{visibleRows.length}</strong>
            </div>
          </div>
          <div className="interest-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', margin: '16px 0' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              Search (Name, server, player ID, alliance) — use % as wildcard
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Legend%" style={{ minWidth: 260 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              Intake period
              <select value={intakeFilter} onChange={(e) => setIntakeFilter(e.target.value)}>
                <option value="">All</option>
                {intakeOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              Migrating to
              <select value={migrateFilter} onChange={(e) => setMigrateFilter(e.target.value)}>
                <option value="">All</option>
                {migrateOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
              Current server
              <select value={serverFilter} onChange={(e) => setServerFilter(e.target.value)}>
                <option value="">All</option>
                {serverOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </label>
            <button type="button" onClick={exportExcel} className="logout-btn">Export to Excel</button>
          </div>
          {loading && <p>Loading...</p>}
          {error && <div className="status error">{error}</div>}
          {!loading && !error && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key}>
                        <button type="button" onClick={() => toggleSort(col.key)} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>
                          {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                        </button>
                      </th>
                    ))}
                    <th>Screenshots</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id}>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === 'created_at' ? 'updated-cell' : undefined}>
                          {cellValue(row, col.key)}
                        </td>
                      ))}
                      <td className="updated-cell">
                        {(row.screenshot_urls || []).map((url, index) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" style={{ marginRight: 6 }}>Image {index + 1}</a>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleRows.length === 0 && <p>No interest submissions match your filters.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

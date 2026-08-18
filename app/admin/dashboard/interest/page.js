'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import StatusBadge from '../../../../components/admin/StatusBadge';
import { useEscapeToClose } from '../../../../lib/useEscapeToClose';

const COMPACT_COLUMNS = [
  { key: 'in_game_name', label: 'Name' },
  { key: 'current_server', label: 'Server' },
  { key: 'current_alliance', label: 'Alliance' },
  { key: 'migrate_alliance', label: 'Target' },
  { key: 'highest_troop_level', label: 'Troop Level' },
  { key: 't11_units', label: 'T11' },
  { key: 'mystic_trial_stages', label: 'Mystic Trial' },
  { key: 'total_power', label: 'Power' },
  { key: 'passes_required', label: 'Passes' },
  { key: 'intake_period', label: 'Intake' },
  { key: 'created_at', label: 'Submitted' },
];

const COLUMNS = [
  { key: 'status', label: 'Status' },
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

const EXPORT_COLUMNS = COLUMNS.filter((c) => c.key !== 'status');

const NUMERIC_KEYS = new Set(['total_power', 'mystic_trial_stages', 'current_tg', 'passes_required', 'current_passes']);
const SEARCH_KEYS = ['in_game_name', 'current_server', 'player_id', 'current_alliance'];

const STATUS_ACTIONS = [
  { value: 'special', label: 'Accept as Special', className: 'status-btn accept-special' },
  { value: 'normal', label: 'Accept as Normal', className: 'status-btn accept-normal' },
  { value: 'reject', label: 'Reject', className: 'status-btn reject' },
  { value: 'waitlist', label: 'Waitlist', className: 'status-btn waitlist' },
];

const STATUS_LABELS = {
  pending: 'Pending',
  special: 'Accepted (Special)',
  normal: 'Accepted (Normal)',
  reject: 'Rejected',
  waitlist: 'Waitlisted',
};

function statusColor(status) {
  if (status === 'special') return '#c9a227';
  if (status === 'normal') return '#3f9d58';
  if (status === 'reject') return '#c0473b';
  if (status === 'waitlist') return '#8a7cc0';
  return '#8a94a6';
}

function cellValue(row, key) {
  if (key === 'status') return STATUS_LABELS[row.status] || 'Pending';
  if (key === 't11_units') return (row.t11_units || []).join(', ');
  if (key === 'created_at') return row.created_at ? new Date(row.created_at).toLocaleString() : '';
  return row[key] == null ? '' : String(row[key]);
}

function buildMatcher(query) {
  const q = query.trim();
  if (!q) return null;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const [busyId, setBusyId] = useState('');
  const [rowMessage, setRowMessage] = useState({});
  const [credentials, setCredentials] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
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

  async function updateStatus(row, status) {
    setBusyId(row.id);
    setRowMessage((prev) => ({ ...prev, [row.id]: '' }));
    try {
      const response = await fetch('/api/admin-interest-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        setRowMessage((prev) => ({ ...prev, [row.id]: result.error || 'Update failed.' }));
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: result.row.status, decided_at: result.row.decided_at } : r)));
      if (result.account) {
        setCredentials({
          name: result.account.name,
          member_id: result.account.member_id,
          password: result.account.password,
          reused: result.account.recordExisted || result.account.profileExisted,
        });
        setRowMessage((prev) => ({ ...prev, [row.id]: 'Accepted. Player record and profile ready.' }));
      } else {
        setRowMessage((prev) => ({ ...prev, [row.id]: 'Status updated to ' + (STATUS_LABELS[status] || status) + '.' }));
      }
    } catch (err) {
      setRowMessage((prev) => ({ ...prev, [row.id]: 'Update failed: ' + err.message }));
    } finally {
      setBusyId('');
    }
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

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);

  useEscapeToClose(Boolean(selectedRow), () => setSelectedId(null));
  useEscapeToClose(Boolean(credentials), () => setCredentials(null));

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
    const header = EXPORT_COLUMNS.map((c) => c.label);
    const dataRows = visibleRows.map((row) => EXPORT_COLUMNS.map((c) => cellValue(row, c.key)));
    const allRows = [header, ...dataRows];

    const xmlEscape = (v) => String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    const colName = (n) => {
      let s = '';
      let x = n;
      while (x > 0) {
        const rem = (x - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        x = Math.floor((x - 1) / 26);
      }
      return s;
    };

    const sheetRows = allRows.map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXml = cells.map((val, cIdx) => {
        const ref = colName(cIdx + 1) + rowNum;
        const str = String(val == null ? '' : val);
        const num = str.trim() !== '' && !Number.isNaN(Number(str)) && /^-?\d+(\.\d+)?$/.test(str.trim());
        if (num) {
          return '<c r="' + ref + '"><v>' + xmlEscape(str.trim()) + '</v></c>';
        }
        return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(str) + '</t></is></c>';
      }).join('');
      return '<row r="' + rowNum + '">' + cellsXml + '</row>';
    }).join('');

    const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>' + sheetRows + '</sheetData></worksheet>';

    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>';

    const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Interest Submissions" sheetId="1" r:id="rId1"/></sheets></workbook>';

    const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>';

    const files = [
      { name: '[Content_Types].xml', data: contentTypes },
      { name: '_rels/.rels', data: rootRels },
      { name: 'xl/workbook.xml', data: workbook },
      { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
      { name: 'xl/worksheets/sheet1.xml', data: sheetXml },
    ];

    const crcTable = (() => {
      const table = new Uint32Array(256);
      for (let i = 0; i < 256; i += 1) {
        let c = i;
        for (let k = 0; k < 8; k += 1) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c >>> 0;
      }
      return table;
    })();

    const crc32 = (bytes) => {
      let crc = 0xffffffff;
      for (let i = 0; i < bytes.length; i += 1) {
        crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ 0xffffffff) >>> 0;
    };

    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;

    const pushU16 = (arr, v) => { arr.push(v & 0xff, (v >>> 8) & 0xff); };
    const pushU32 = (arr, v) => { arr.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff); };

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = encoder.encode(file.data);
      const crc = crc32(dataBytes);

      const local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20);
      pushU16(local, 0);
      pushU16(local, 0);
      pushU16(local, 0);
      pushU16(local, 0);
      pushU32(local, crc);
      pushU32(local, dataBytes.length);
      pushU32(local, dataBytes.length);
      pushU16(local, nameBytes.length);
      pushU16(local, 0);
      const localHeader = new Uint8Array(local);

      chunks.push(localHeader, nameBytes, dataBytes);

      const cen = [];
      pushU32(cen, 0x02014b50);
      pushU16(cen, 20);
      pushU16(cen, 20);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU32(cen, crc);
      pushU32(cen, dataBytes.length);
      pushU32(cen, dataBytes.length);
      pushU16(cen, nameBytes.length);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU16(cen, 0);
      pushU32(cen, 0);
      pushU32(cen, offset);
      central.push({ header: new Uint8Array(cen), name: nameBytes });

      offset += localHeader.length + nameBytes.length + dataBytes.length;
    });

    const centralStart = offset;
    let centralSize = 0;
    central.forEach((entry) => {
      chunks.push(entry.header, entry.name);
      centralSize += entry.header.length + entry.name.length;
    });

    const end = [];
    pushU32(end, 0x06054b50);
    pushU16(end, 0);
    pushU16(end, 0);
    pushU16(end, files.length);
    pushU16(end, files.length);
    pushU32(end, centralSize);
    pushU32(end, centralStart);
    pushU16(end, 0);
    chunks.push(new Uint8Array(end));

    const blob = new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interest-submissions-' + new Date().toISOString().slice(0, 10) + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Transfer Requests" subtitle="K710 command board" onLogout={handleLogout}>
          <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Review 710 transfer onboarding requests submitted through the public interest form.</p>
          {credentials && (
            <div className="credentials-modal-overlay" role="presentation" onClick={() => setCredentials(null)}>
              <div className="credentials-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h2>{credentials.reused ? 'Account already existed' : 'Account created'}</h2>
                <p>{credentials.name} &middot; ID {credentials.member_id}. Share this password with the player &mdash; they enter it as their PIN to edit their player record and power profile.</p>
                <div className="credentials-modal-row">
                  <code>{credentials.password}</code>
                  <button
                    type="button"
                    className="credentials-modal-copy"
                    onClick={() => navigator.clipboard && navigator.clipboard.writeText(credentials.password)}
                  >
                    Copy
                  </button>
                </div>
                <button type="button" onClick={() => setCredentials(null)} className="credentials-modal-close">Dismiss</button>
              </div>
            </div>
          )}
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
              <table className="admin-table admin-compact-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    {COMPACT_COLUMNS.map((col) => (
                      <th key={col.key}>
                        <button type="button" onClick={() => toggleSort(col.key)} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>
                          {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="admin-row-clickable" onClick={() => setSelectedId(row.id)}>
                      <td><StatusBadge status={row.status || 'pending'} label={STATUS_LABELS[row.status] || 'Pending'} /></td>
                      {COMPACT_COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === 'created_at' ? 'updated-cell' : undefined}>
                          {cellValue(row, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleRows.length === 0 && <p>No interest submissions match your filters.</p>}
            </div>
          )}

          {selectedRow && (
            <div className="admin-drawer-overlay" role="presentation" onClick={() => setSelectedId(null)}>
              <div className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="review-drawer-title" onClick={(e) => e.stopPropagation()}>
                <div className="admin-drawer-header">
                  <h2 id="review-drawer-title">{selectedRow.in_game_name || 'Applicant'}</h2>
                  <button type="button" className="admin-drawer-close" onClick={() => setSelectedId(null)} aria-label="Close">&times;</button>
                </div>

                <div className="admin-drawer-section">
                  <h3>Decision</h3>
                  <div className="admin-drawer-actions">
                    {STATUS_ACTIONS.map((action) => (
                      <button
                        key={action.value}
                        type="button"
                        disabled={busyId === selectedRow.id}
                        onClick={() => updateStatus(selectedRow, action.value)}
                        className={'status-action-btn' + (selectedRow.status === action.value ? ' active-' + action.value : '')}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                  {rowMessage[selectedRow.id] && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{rowMessage[selectedRow.id]}</p>}
                </div>

                <div className="admin-drawer-section">
                  <h3>Application</h3>
                  <div className="admin-drawer-grid">
                    {COLUMNS.filter((c) => c.key !== 'status').map((col) => (
                      <div key={col.key} className="admin-drawer-field">
                        <span>{col.label}</span>
                        <strong>{cellValue(selectedRow, col.key) || '-'}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedRow.screenshot_urls || []).length > 0 && (
                  <div className="admin-drawer-section">
                    <h3>Screenshots</h3>
                    <div className="admin-drawer-actions">
                      {selectedRow.screenshot_urls.map((url, index) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="status-action-btn">Image {index + 1}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
    </AdminShell>
  );
}

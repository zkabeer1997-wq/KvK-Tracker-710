'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';

const BRANCHES = [
  { id: 'infantry', label: 'Infantry', color: '#d9a94e', tierKey: 'infantry_tier', tgKey: 'infantry_tg' },
  { id: 'cavalry', label: 'Cavalry', color: '#e0662f', tierKey: 'cavalry_tier', tgKey: 'cavalry_tg' },
  { id: 'archer', label: 'Archer', color: '#86a873', tierKey: 'archer_tier', tgKey: 'archer_tg' },
];

const BANDS = [
  { key: 'tg8_t11', label: 'TG8 / T11', tg: 8, tier: 11 },
  { key: 'tg8_t10', label: 'TG8 / T10', tg: 8, tier: 10 },
  { key: 'tg7_t11', label: 'TG7 / T11', tg: 7, tier: 11 },
];

const ARC_PATHS = {
  infantry: 'M 100 22 A 78 78 0 0 1 167.5 139',
  cavalry: 'M 167.5 139 A 78 78 0 0 1 32.5 139',
  archer: 'M 32.5 139 A 78 78 0 0 1 100 22',
};

function extractNum(value) {
  const text = String(value || '').toUpperCase().trim();
  if (!text) return null;
  const match = text.match(/(?:TG|T)?(\d+)/);
  return match ? Number(match[1]) : null;
}

function matchesBand(tierVal, tgVal, band) {
  const tier = extractNum(tierVal);
  const tg = extractNum(tgVal);
  return tier === band.tier && tg === band.tg;
}

function countBands(rows, branch) {
  const counts = Object.fromEntries(BANDS.map((b) => [b.key, 0]));
  rows.forEach((row) => {
    BANDS.forEach((band) => {
      if (matchesBand(row[branch.tierKey], row[branch.tgKey], band)) {
        counts[band.key] += 1;
      }
    });
  });
  return counts;
}

function countTransferStatuses(rows) {
  const out = { special: 0, normal: 0, waitlist: 0, pending: 0, reject: 0 };
  rows.forEach((row) => {
    const status = String(row.status || 'pending').toLowerCase();
    if (status in out) out[status] += 1;
    else out.pending += 1;
  });
  return out;
}

export default function AdminDashboardOverviewPage() {
  const router = useRouter();
  const [roster, setRoster] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBranch, setActiveBranch] = useState('infantry');
  const [selectedBand, setSelectedBand] = useState('tg8_t11');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [rosterRes, transferRes] = await Promise.all([
          fetch('/api/admin-submissions'),
          fetch('/api/admin-interest-submissions'),
        ]);
        const rosterJson = await rosterRes.json();
        const transferJson = await transferRes.json();
        if (!rosterRes.ok) throw new Error(rosterJson.error || 'Unable to load player records.');
        if (!transferRes.ok) throw new Error(transferJson.error || 'Unable to load transfer requests.');
        if (!cancelled) {
          setRoster(rosterJson.rows || []);
          setTransfers(transferJson.rows || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const branch = BRANCHES.find((b) => b.id === activeBranch) || BRANCHES[0];
  const bandCounts = useMemo(() => countBands(roster, branch), [roster, branch]);
  const trackedTotal = BANDS.reduce((sum, b) => sum + (bandCounts[b.key] || 0), 0);
  const maxBand = Math.max(...BANDS.map((b) => bandCounts[b.key] || 0), 1);
  const transferCounts = useMemo(() => countTransferStatuses(transfers), [transfers]);
  const selectedBandMeta = BANDS.find((b) => b.key === selectedBand) || BANDS[0];

  return (
    <AdminShell
      title="Dashboard Panel"
      subtitle="K710 command overview"
      onLogout={handleLogout}
      counters={[
        { label: 'Roster', value: roster.length },
        { label: 'Transfers', value: transfers.length },
        { label: 'Pending', value: transferCounts.pending },
      ]}
    >
      <p className="admin-page-lead">
        Troop readiness for the three tracked TG/tier bands, plus transfer pipeline status.
      </p>

      {loading && <div className="status">Loading dashboard data…</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="dash-band-chips" aria-label="Tracked troop bands">
            {BANDS.map((b) => (
              <span key={b.key} className="dash-band-chip">
                <strong>{b.label}</strong>
              </span>
            ))}
          </div>

          <div className="dash-stage">
            <div className="dash-wheel-col">
              <div className="dash-wheel-wrap" aria-label="Unit type selector">
                <svg viewBox="0 0 200 200" role="img">
                  <title>Select Infantry, Cavalry, or Archer</title>
                  <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="28" />
                  {BRANCHES.map((b) => {
                    const on = b.id === activeBranch;
                    return (
                      <path
                        key={b.id}
                        className={'dash-arc' + (on ? ' is-active' : ' is-dim')}
                        d={ARC_PATHS[b.id]}
                        fill="none"
                        stroke={b.color}
                        strokeWidth="28"
                        tabIndex={0}
                        role="button"
                        aria-label={b.label}
                        aria-pressed={on}
                        onClick={() => setActiveBranch(b.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveBranch(b.id);
                          }
                        }}
                      />
                    );
                  })}
                  <text x="100" y="14" textAnchor="middle" fill="#d9a94e" fontSize="7" fontWeight="700">INF</text>
                  <text x="186" y="148" textAnchor="middle" fill="#e0662f" fontSize="7" fontWeight="700">CAV</text>
                  <text x="14" y="148" textAnchor="middle" fill="#86a873" fontSize="7" fontWeight="700">ARC</text>
                </svg>
                <div className="dash-hub">
                  <div className="dash-hub-branch">{branch.label}</div>
                  <div className="dash-hub-big" style={{ color: branch.color }}>{trackedTotal}</div>
                  <div className="dash-hub-sub">in the 3 tracked bands</div>
                </div>
              </div>
              <div className="dash-legend">
                {BRANCHES.map((b) => (
                  <span key={b.id}>
                    <i className="dash-swatch" style={{ background: b.color }} />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="dash-detail">
              <h2>{branch.label}</h2>
              <p className="dash-detail-hint">
                Exact matches only · TG8/T11 · TG8/T10 · TG7/T11 from Player Records.
              </p>

              <div className="dash-matrix" role="list">
                {BANDS.map((b) => {
                  const count = bandCounts[b.key] || 0;
                  const pct = Math.round((count / maxBand) * 100);
                  const selected = selectedBand === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      role="listitem"
                      className={'dash-band-row' + (selected ? ' is-selected' : '')}
                      onClick={() => setSelectedBand(b.key)}
                    >
                      <div className="dash-band-label">
                        {b.label}
                        <span>exact match</span>
                      </div>
                      <div className="dash-bar-track">
                        <div
                          className="dash-bar-fill"
                          style={{ width: pct + '%', background: branch.color }}
                        />
                      </div>
                      <div className="dash-band-count" style={{ color: branch.color }}>{count}</div>
                    </button>
                  );
                })}
              </div>

              <div className="dash-summary">
                <div className="dash-sum">
                  <b style={{ color: branch.color }}>{trackedTotal}</b>
                  <span>In 3 bands</span>
                </div>
                <div className="dash-sum">
                  <b>{roster.length}</b>
                  <span>Roster total</span>
                </div>
                <div className="dash-sum">
                  <b>{Math.max(roster.length - trackedTotal, 0)}</b>
                  <span>Other / blank</span>
                </div>
              </div>

              <div className="dash-actions">
                <Link href="/admin/dashboard" className="dash-btn primary">
                  Open Player Records · {branch.label} · {selectedBandMeta.label}
                </Link>
                <Link href="/admin/dashboard" className="dash-btn">
                  All 3 bands for this unit
                </Link>
              </div>
            </div>
          </div>

          <section className="dash-transfers" aria-label="Transfer requests summary">
            <div className="dash-transfers-head">
              <h2>Transfer requests</h2>
              <div className="dash-transfers-total">
                Total submissions · <strong>{transfers.length}</strong>
              </div>
            </div>
            <div className="dash-xfer-grid">
              <div className="dash-xfer">
                <div className="dash-xfer-v" style={{ color: 'var(--gold-bright)' }}>{transferCounts.special}</div>
                <div className="dash-xfer-l">Accepted · Special</div>
              </div>
              <div className="dash-xfer">
                <div className="dash-xfer-v" style={{ color: 'var(--success)' }}>{transferCounts.normal}</div>
                <div className="dash-xfer-l">Accepted · Normal</div>
              </div>
              <div className="dash-xfer">
                <div className="dash-xfer-v" style={{ color: '#b6a4e0' }}>{transferCounts.waitlist}</div>
                <div className="dash-xfer-l">Waitlist</div>
              </div>
              <div className="dash-xfer">
                <div className="dash-xfer-v" style={{ color: 'var(--ember)' }}>{transferCounts.pending}</div>
                <div className="dash-xfer-l">Pending</div>
              </div>
              <div className="dash-xfer">
                <div className="dash-xfer-v" style={{ color: '#ff8f8f' }}>{transferCounts.reject}</div>
                <div className="dash-xfer-l">Rejected</div>
              </div>
            </div>
            <p className="dash-xfer-link">
              <Link href="/admin/dashboard/interest">Open Transfer Requests →</Link>
              <span> · Matches Transfer Requests tab statuses</span>
            </p>
          </section>
        </>
      )}
    </AdminShell>
  );
}

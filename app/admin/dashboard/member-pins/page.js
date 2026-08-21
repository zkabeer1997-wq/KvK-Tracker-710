'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import ConfirmDialog from '../../../../components/admin/ConfirmDialog';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import styles from './page.module.css';

export default function AdminMemberPinsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [resettingId, setResettingId] = useState('');
  const [confirmRow, setConfirmRow] = useState(null);
  const [revealedPins, setRevealedPins] = useState({});
  const [copiedId, setCopiedId] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/admin-member-pins', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load member PINs.');
        if (active) setRows(result.rows || []);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load member PINs.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  async function performReset(row) {
    setConfirmRow(null);
    setResettingId(String(row.member_id));
    setError('');
    setStatus('');
    setCopiedId('');

    try {
      const response = await fetch('/api/admin-member-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: row.member_id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to reset PIN.');

      setRevealedPins((current) => ({ ...current, [row.member_id]: result.pin }));
      setRows((current) => current.map((item) => (
        String(item.member_id) === String(row.member_id)
          ? { ...item, pin_status: 'secured' }
          : item
      )));
      setStatus(`Reset PIN for ${row.name || row.member_id}. Copy the new PIN now; it will not be recoverable later.`);
    } catch (resetError) {
      setError(resetError.message || 'Unable to reset PIN.');
    } finally {
      setResettingId('');
    }
  }

  async function copyPin(memberId, pin) {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedId(memberId);
      window.setTimeout(() => setCopiedId((current) => (current === memberId ? '' : current)), 1600);
    } catch {
      setError('Could not copy automatically. Select the PIN and copy it manually.');
    }
  }

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => (
      String(row.name || '').toLowerCase().includes(term)
      || String(row.member_id || '').toLowerCase().includes(term)
    ));
  }, [rows, query]);

  const securedCount = rows.filter((row) => row.pin_status === 'secured').length;
  const needsResetCount = rows.length - securedCount;

  return (
    <AdminShell
      title="Member PINs"
      subtitle="Access control"
      onLogout={handleLogout}
      counters={[
        { label: 'Members', value: rows.length },
        { label: 'PINs secured', value: securedCount },
        { label: 'Need reset', value: needsResetCount },
      ]}
    >
      <section className={styles.notice}>
        <div>
          <span className={styles.noticeKicker}>Secure by design</span>
          <h2>Existing PINs cannot be viewed.</h2>
          <p>
            Member PINs are stored as one-way hashes. Resetting creates a replacement 6-digit PIN,
            stores only its new hash, and reveals the replacement here once so you can copy it privately.
          </p>
        </div>
      </section>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search member name or ID..."
          aria-label="Search member PIN list"
        />
        <span className="admin-count">{visibleRows.length} of {rows.length}</span>
      </div>

      {status && <div className="status">{status}</div>}
      {error && <div className="status error">{error}</div>}

      <div className="admin-table-wrap">
        {loading ? (
          <TableSkeleton columns={4} rows={8} />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Member ID</th>
                <th>PIN</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan="4">No members found.</td></tr>
              ) : visibleRows.map((row) => {
                const memberId = String(row.member_id);
                const revealedPin = revealedPins[memberId];
                const resetting = resettingId === memberId;
                return (
                  <tr key={memberId}>
                    <td><strong>{row.name || '-'}</strong></td>
                    <td><span className="member-id-cell">{memberId}</span></td>
                    <td>
                      {revealedPin ? (
                        <div className={styles.revealBox}>
                          <div>
                            <span className={styles.revealLabel}>New PIN · shown once</span>
                            <code className={styles.pinCode}>{revealedPin}</code>
                          </div>
                          <button
                            type="button"
                            className={styles.copyButton}
                            onClick={() => copyPin(memberId, revealedPin)}
                          >
                            {copiedId === memberId ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ) : (
                        <span className={row.pin_status === 'secured' ? styles.securedBadge : styles.resetBadge}>
                          {row.pin_status === 'secured' ? 'Protected · hidden' : 'Needs reset'}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="logout-btn"
                        disabled={resetting}
                        onClick={() => setConfirmRow(row)}
                      >
                        {resetting ? 'Resetting...' : 'Reset PIN'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmRow)}
        title="Reset member PIN?"
        message={confirmRow ? `Replace the PIN for ${confirmRow.name || confirmRow.member_id} (${confirmRow.member_id})? Their old PIN will stop working immediately.` : ''}
        confirmLabel="Reset PIN"
        danger={false}
        onCancel={() => setConfirmRow(null)}
        onConfirm={() => confirmRow && performReset(confirmRow)}
      />
    </AdminShell>
  );
}

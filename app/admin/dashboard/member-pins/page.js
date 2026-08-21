'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import ConfirmDialog from '../../../../components/admin/ConfirmDialog';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import styles from './page.module.css';

const EMPTY_MEMBER = { name: '', memberId: '', pin: '' };

function generateSixDigitPin() {
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) return '';
  const values = new Uint32Array(1);
  const range = 1_000_000;
  const limit = 0x100000000 - (0x100000000 % range);
  let value;
  do {
    window.crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);
  return String(value % range).padStart(6, '0');
}

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
  const [showCreate, setShowCreate] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [creating, setCreating] = useState(false);
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

  function openCreate() {
    setError('');
    setStatus('');
    setNewMember({ ...EMPTY_MEMBER, pin: generateSixDigitPin() });
    setShowCreate(true);
  }

  function closeCreate() {
    if (creating) return;
    setShowCreate(false);
    setNewMember(EMPTY_MEMBER);
  }

  function setCreateField(key, value) {
    setNewMember((current) => ({ ...current, [key]: value }));
  }

  function regeneratePin() {
    const pin = generateSixDigitPin();
    if (!pin) {
      setError('Secure PIN generation is unavailable in this browser. Enter a 6-digit PIN manually.');
      return;
    }
    setCreateField('pin', pin);
  }

  async function createMember(event) {
    event.preventDefault();
    setError('');
    setStatus('');

    const name = newMember.name.trim();
    const memberId = newMember.memberId.trim();
    const pin = newMember.pin.trim();

    if (!name || !memberId) {
      setError('Name and Member ID are required.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin-member-pins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberId, pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create member.');

      const createdRow = result.row || {
        name,
        member_id: memberId,
        pin_status: 'secured',
        updated_at: null,
      };
      setRows((current) => [...current, createdRow].sort((a, b) => (
        String(a.name || '').localeCompare(String(b.name || ''))
      )));
      setRevealedPins((current) => ({ ...current, [memberId]: pin }));
      setStatus(`Created ${name} (${memberId}). Copy the new PIN now; it will not be recoverable later.`);
      setShowCreate(false);
      setNewMember(EMPTY_MEMBER);
    } catch (createError) {
      setError(createError.message || 'Unable to create member.');
    } finally {
      setCreating(false);
    }
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
      actions={(
        <button type="button" className="logout-btn" onClick={showCreate ? closeCreate : openCreate}>
          {showCreate ? 'Cancel' : 'Create member'}
        </button>
      )}
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
            Member PINs are stored as one-way hashes. Create a member with an initial 6-digit PIN,
            or reset an existing member to a replacement PIN that is revealed here once for private copying.
          </p>
        </div>
      </section>

      {showCreate && (
        <form className={styles.createPanel} onSubmit={createMember}>
          <div className={styles.createHeader}>
            <div>
              <span className={styles.noticeKicker}>New roster access</span>
              <h2>Create member + PIN</h2>
              <p>Adds the member to Player Records with a secure initial PIN. Troop and hero details can be filled in later.</p>
            </div>
          </div>
          <div className={styles.createGrid}>
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={newMember.name}
                onChange={(event) => setCreateField('name', event.target.value)}
                maxLength={120}
                autoComplete="off"
                placeholder="In-game name"
                required
              />
            </label>
            <label className={styles.field}>
              <span>Member ID</span>
              <input
                value={newMember.memberId}
                onChange={(event) => setCreateField('memberId', event.target.value)}
                maxLength={120}
                autoComplete="off"
                placeholder="Member ID"
                required
              />
            </label>
            <label className={styles.field}>
              <span>6-digit PIN</span>
              <div className={styles.pinInputRow}>
                <input
                  value={newMember.pin}
                  onChange={(event) => setCreateField('pin', event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="new-password"
                  className={styles.pinInput}
                  placeholder="000000"
                  required
                />
                <button type="button" className={styles.generateButton} onClick={regeneratePin}>
                  Generate
                </button>
              </div>
            </label>
          </div>
          <div className={styles.createActions}>
            <button type="button" className={styles.secondaryButton} onClick={closeCreate} disabled={creating}>Cancel</button>
            <button type="submit" className={styles.primaryButton} disabled={creating}>
              {creating ? 'Creating...' : 'Create member'}
            </button>
          </div>
        </form>
      )}

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

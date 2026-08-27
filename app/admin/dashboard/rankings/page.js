'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import ConfirmDialog from '../../../../components/admin/ConfirmDialog';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import { Button, Field, Input, Select, Textarea, Table, Tag } from '../../../../components/ui';

const SCOPES = ['kingdom', 'alliance', 'player'];
const EMPTY_FORM = { scope: 'kingdom', metric: '', source: '', csv: '', published: true };

export default function AdminRankingsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-rankings', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load snapshots.');
      setRows(result.snapshots || []);
    } catch (err) {
      setError(err.message || 'Unable to load snapshots.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  function openCreate() {
    setError(''); setDetails([]); setStatus(''); setCreating(true); setForm(EMPTY_FORM);
  }

  function closeCreate() {
    if (saving) return;
    setCreating(false); setForm(EMPTY_FORM); setDetails([]);
  }

  async function save() {
    setSaving(true); setError(''); setDetails([]); setStatus('');
    try {
      const response = await fetch('/api/admin-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setDetails(result.details || []);
        throw new Error(result.error || 'Unable to save snapshot.');
      }
      setStatus('Snapshot posted.');
      setCreating(false); setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to save snapshot.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(row) {
    setError(''); setStatus('');
    try {
      const response = await fetch(`/api/admin-rankings/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !row.published }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update snapshot.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update snapshot.');
    }
  }

  async function confirmDelete() {
    if (!confirmRow) return;
    try {
      const response = await fetch(`/api/admin-rankings/${confirmRow.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete snapshot.');
      setStatus('Snapshot deleted.'); setConfirmRow(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete snapshot.'); setConfirmRow(null);
    }
  }

  return (
    <AdminShell title="Rankings" subtitle="Append-only snapshots shown at /rankings." onLogout={handleLogout}>
      {error && (
        <div className="guide-message error" role="alert">
          <p style={{ margin: 0 }}>{error}</p>
          {details.length > 0 && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
      {status && <p className="guide-message success" role="status">{status}</p>}

      <div style={{ marginBottom: 16 }}>
        <Button onClick={openCreate} disabled={creating}>+ Post new snapshot</Button>
      </div>

      {creating && (
        <div className="k-plate" style={{ padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Scope">
              <Select tone="console" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
                {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Metric" hint='e.g. "Total Power", "KvK Points"'>
              <Input tone="console" value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))} />
            </Field>
            <Field label="Source" hint="Where this data came from (optional)">
              <Input tone="console" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
            </Field>
          </div>
          <Field label="Rankings (CSV)" hint='One row per line: "rank,name,value". An optional header row is fine, and the value column is optional.'>
            <Textarea
              tone="console"
              rows={10}
              placeholder={'rank,name,value\n1,Alice,9000\n2,Bob,8500'}
              value={form.csv}
              onChange={(e) => setForm((f) => ({ ...f, csv: e.target.value }))}
            />
          </Field>
          <Field label="Publish immediately">
            <Select tone="console" value={form.published ? 'yes' : 'no'} onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'yes' }))}>
              <option value="yes">Published</option>
              <option value="no">Draft (hidden from /rankings)</option>
            </Select>
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={save} disabled={saving}>{saving ? 'Posting…' : 'Post snapshot'}</Button>
            <Button variant="quiet" onClick={closeCreate} disabled={saving}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : (
        <Table>
          <thead><tr><th>Scope</th><th>Metric</th><th>Rows</th><th>Captured</th><th>Published</th><th /></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.scope}</td>
                <td>{row.metric}</td>
                <td>{Array.isArray(row.rows) ? row.rows.length : 0}</td>
                <td>{new Date(row.captured_at).toLocaleString()}</td>
                <td>
                  <Tag tone={row.published ? 'success' : 'neutral'}>{row.published ? 'Published' : 'Draft'}</Tag>
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Button variant="quiet" onClick={() => togglePublished(row)}>
                    {row.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="quiet" onClick={() => setConfirmRow(row)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(confirmRow)}
        title="Delete this snapshot?"
        message={confirmRow ? `The ${confirmRow.scope} snapshot from ${new Date(confirmRow.captured_at).toLocaleString()} will be permanently removed.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmRow(null)}
      />
    </AdminShell>
  );
}

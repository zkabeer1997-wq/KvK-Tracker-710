'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import ConfirmDialog from '../../../../components/admin/ConfirmDialog';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import { Button, Field, Input, Select, Textarea, Table } from '../../../../components/ui';

const KINDS = ['kvk', 'championship', 'swordland', 'custom'];
const EMPTY_FORM = {
  slug: '', title: '', kind: 'custom', description: '', body_md: '',
  starts_at: '', ends_at: '', published: false,
};

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-events', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load events.');
      setRows(result.events || []);
    } catch (err) {
      setError(err.message || 'Unable to load events.');
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
    setError('');
    setStatus('');
    setEditingId('new');
    setForm(EMPTY_FORM);
  }

  function openEdit(row) {
    setError('');
    setStatus('');
    setEditingId(row.id);
    setForm({
      slug: row.slug,
      title: row.title,
      kind: row.kind,
      description: row.description || '',
      body_md: row.body_md || '',
      starts_at: toLocalInputValue(row.starts_at),
      ends_at: toLocalInputValue(row.ends_at),
      published: row.published,
    });
  }

  function closeEdit() {
    if (saving) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const isNew = editingId === 'new';
      const response = await fetch(isNew ? '/api/admin-events' : `/api/admin-events/${editingId}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : '',
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save event.');
      setStatus(isNew ? 'Event created.' : 'Event saved.');
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to save event.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!confirmRow) return;
    try {
      const response = await fetch(`/api/admin-events/${confirmRow.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete event.');
      setStatus('Event deleted.');
      setConfirmRow(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete event.');
      setConfirmRow(null);
    }
  }

  return (
    <AdminShell
      title="Events"
      subtitle="KvK, Championship, Swordland, and custom kingdom events. Bear Hunt's recurring schedule is code-defined, not editable here."
      onLogout={handleLogout}
    >
      {error && <p className="guide-message error" role="alert">{error}</p>}
      {status && <p className="guide-message success" role="status">{status}</p>}

      <div style={{ marginBottom: 16 }}>
        <Button onClick={openCreate} disabled={editingId !== null}>+ New event</Button>
      </div>

      {editingId !== null && (
        <div className="k-plate" style={{ padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Title">
              <Input tone="console" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Slug" hint="lowercase-with-hyphens">
              <Input tone="console" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
            <Field label="Kind">
              <Select tone="console" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            </Field>
            <Field label="Published">
              <Select tone="console" value={form.published ? 'yes' : 'no'} onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === 'yes' }))}>
                <option value="no">Draft</option>
                <option value="yes">Published</option>
              </Select>
            </Field>
            <Field label="Starts at (your local time)">
              <Input tone="console" type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
            </Field>
            <Field label="Ends at (optional)">
              <Input tone="console" type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} />
            </Field>
          </div>
          <Field label="Short description">
            <Input tone="console" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Body (markdown)">
            <Textarea tone="console" rows={8} value={form.body_md} onChange={(e) => setForm((f) => ({ ...f, body_md: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button variant="quiet" onClick={closeEdit} disabled={saving}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <Table>
          <thead>
            <tr><th>Title</th><th>Kind</th><th>Starts</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.kind}</td>
                <td>{new Date(row.starts_at).toLocaleString()}</td>
                <td>{row.published ? 'Published' : 'Draft'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Button variant="quiet" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="quiet" onClick={() => setConfirmRow(row)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(confirmRow)}
        title="Delete this event?"
        message={confirmRow ? `"${confirmRow.title}" will be permanently removed.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmRow(null)}
      />
    </AdminShell>
  );
}

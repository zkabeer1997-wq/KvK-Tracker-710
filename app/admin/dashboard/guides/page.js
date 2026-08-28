'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import ConfirmDialog from '../../../../components/admin/ConfirmDialog';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import { Button, Field, Input, Select, Table, Textarea } from '../../../../components/ui';

const EMPTY_FORM = {
  slug: '',
  title: '',
  category: 'Kingdom Guide',
  description: '',
  body: '',
  position: '0',
  is_published: false,
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmGuide, setConfirmGuide] = useState(null);
  const router = useRouter();

  async function loadGuides() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-guides', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load guides.');
      setGuides(result.guides || []);
    } catch (err) {
      setError(err.message || 'Unable to load guides.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGuides(); }, []);

  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  function openCreate() {
    const nextPosition = guides.reduce((max, guide) => Math.max(max, Number(guide.position) || 0), 0) + 10;
    setForm({ ...EMPTY_FORM, position: String(nextPosition) });
    setSlugWasEdited(false);
    setShowCreate(true);
    setError('');
    setStatus('');
  }

  function closeCreate() {
    if (saving) return;
    setShowCreate(false);
    setForm(EMPTY_FORM);
  }

  function updateTitle(title) {
    setForm((current) => ({
      ...current,
      title,
      slug: slugWasEdited ? current.slug : slugify(title),
    }));
  }

  async function createGuide() {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const response = await fetch('/api/admin-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, position: Number(form.position) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create guide.');

      setStatus(`“${result.guide.title}” created${result.guide.is_published ? ' and published' : ' as a draft'}.`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await loadGuides();
    } catch (err) {
      setError(err.message || 'Unable to create guide.');
    } finally {
      setSaving(false);
    }
  }

  async function removeGuide() {
    if (!confirmGuide || deleting) return;
    setDeleting(true);
    setError('');
    setStatus('');
    try {
      const response = await fetch(`/api/admin-guides/${encodeURIComponent(confirmGuide.slug)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to remove guide.');

      setStatus(`“${confirmGuide.title}” removed.`);
      setConfirmGuide(null);
      await loadGuides();
    } catch (err) {
      setError(err.message || 'Unable to remove guide.');
      setConfirmGuide(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell
      title="Guides"
      subtitle="Add guides to the K710 library, open existing guides for editing, or permanently remove obsolete entries."
      onLogout={handleLogout}
      counters={[
        { label: 'Total guides', value: guides.length },
        { label: 'Published', value: guides.filter((guide) => guide.is_published).length },
        { label: 'Drafts', value: guides.filter((guide) => !guide.is_published).length },
      ]}
    >
      {error && <p className="guide-message error" role="alert">{error}</p>}
      {status && <p className="guide-message success" role="status">{status}</p>}

      <div style={{ marginBottom: 16 }}>
        <Button onClick={openCreate} disabled={showCreate}>+ New guide</Button>
      </div>

      {showCreate && (
        <div className="k-plate" style={{ padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Field label="Title">
              <Input tone="console" value={form.title} maxLength={180} onChange={(event) => updateTitle(event.target.value)} />
            </Field>
            <Field label="Slug" hint="Used in the guide URL; lowercase and hyphens only">
              <Input
                tone="console"
                value={form.slug}
                maxLength={80}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  setForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }));
                }}
              />
            </Field>
            <Field label="Category">
              <Input tone="console" value={form.category} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </Field>
            <Field label="Library position" hint="Lower numbers appear first">
              <Input tone="console" type="number" min="0" max="100000" step="1" value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} />
            </Field>
            <Field label="Status">
              <Select tone="console" value={form.is_published ? 'published' : 'draft'} onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.value === 'published' }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
          </div>
          <Field label="Short description">
            <Textarea tone="console" rows={3} maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </Field>
          <Field label="Guide text" hint="Markdown formatting is supported">
            <Textarea tone="console" rows={12} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={createGuide} disabled={saving}>{saving ? 'Creating…' : 'Create guide'}</Button>
            <Button variant="quiet" onClick={closeCreate} disabled={saving}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : guides.length === 0 ? (
        <div className="k-plate" style={{ padding: 24 }}>No guides yet. Create the first guide above.</div>
      ) : (
        <Table>
          <thead>
            <tr><th>Position</th><th>Title</th><th>Category</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide.slug}>
                <td>{guide.position}</td>
                <td><strong>{guide.title}</strong><br /><span style={{ opacity: 0.7 }}>/guides/{guide.slug}</span></td>
                <td>{guide.category}</td>
                <td>{guide.is_published ? 'Published' : 'Draft'}</td>
                <td>{guide.updated_at ? new Date(guide.updated_at).toLocaleString() : '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Link href={`/guides/${guide.slug}`} className="ui-btn ui-btn-quiet">Open / Edit</Link>
                    <Button variant="quiet" onClick={() => setConfirmGuide(guide)}>Remove</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(confirmGuide)}
        title="Remove this guide?"
        message={confirmGuide ? `“${confirmGuide.title}” will be permanently deleted from the guide library. This cannot be undone.` : ''}
        confirmLabel={deleting ? 'Removing…' : 'Remove guide'}
        onConfirm={removeGuide}
        onCancel={() => { if (!deleting) setConfirmGuide(null); }}
      />
    </AdminShell>
  );
}

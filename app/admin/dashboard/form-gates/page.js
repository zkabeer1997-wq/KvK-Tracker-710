'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import TableSkeleton from '../../../../components/admin/TableSkeleton';
import { Button, Field, Input, Table } from '../../../../components/ui';

const LABELS = {
  lead: 'Player Profile',
  joiner: 'KvK Availability',
  prep: 'KvK Prep',
  dragon: 'Flamedragon Tyrant',
};

const ORDER = ['lead', 'joiner', 'prep', 'dragon'];

export default function AdminFormGatesPage() {
  const [gates, setGates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [drafts, setDrafts] = useState({});
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin-form-gates', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load form gates.');
      const byKey = {};
      const nextDrafts = {};
      for (const gate of result.gates || []) {
        byKey[gate.form_key] = gate;
        nextDrafts[gate.form_key] = gate.message || '';
      }
      setGates(byKey);
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err.message || 'Unable to load form gates.');
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

  async function toggle(formKey) {
    const current = gates[formKey];
    await save(formKey, !current?.is_open, drafts[formKey] ?? '');
  }

  async function saveMessage(formKey) {
    const current = gates[formKey];
    await save(formKey, current?.is_open !== false, drafts[formKey] ?? '');
  }

  async function save(formKey, isOpen, message) {
    setSavingKey(formKey);
    setError('');
    setStatus('');
    try {
      const response = await fetch('/api/admin-form-gates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_key: formKey, is_open: isOpen, message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save form gate.');
      setGates((prev) => ({ ...prev, [formKey]: result.gate }));
      setStatus(`${LABELS[formKey]} ${isOpen ? 'opened' : 'closed'}.`);
    } catch (err) {
      setError(err.message || 'Unable to save form gate.');
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <AdminShell
      title="Form Gates"
      subtitle="Open or close the member intake forms linked from /forms."
      onLogout={handleLogout}
    >
      {error && <p className="guide-message error" role="alert">{error}</p>}
      {status && <p className="guide-message success" role="status">{status}</p>}

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <Table>
          <thead><tr><th>Form</th><th>Status</th><th>Closed message</th><th /></tr></thead>
          <tbody>
            {ORDER.map((formKey) => {
              const gate = gates[formKey] || { is_open: true, message: '' };
              const isOpen = gate.is_open !== false;
              return (
                <tr key={formKey}>
                  <td>{LABELS[formKey]}</td>
                  <td>{isOpen ? 'Open' : 'Closed'}</td>
                  <td style={{ minWidth: 260 }}>
                    <Field label="">
                      <Input
                        tone="console"
                        placeholder="Optional message shown while closed"
                        value={drafts[formKey] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [formKey]: e.target.value }))}
                        onBlur={() => saveMessage(formKey)}
                      />
                    </Field>
                  </td>
                  <td>
                    <Button
                      variant="quiet"
                      onClick={() => toggle(formKey)}
                      disabled={savingKey === formKey}
                    >
                      {savingKey === formKey ? 'Saving…' : isOpen ? 'Close form' : 'Open form'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}

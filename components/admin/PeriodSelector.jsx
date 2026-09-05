'use client';
import { useEffect, useId, useState } from 'react';
import { Button, Input } from '../ui';

// Lets an admin switch between the live "Current" table and a frozen,
// read-only snapshot of a past KvK period, and take a new snapshot without
// ever deleting or modifying the live table (see supabase/kvk_periods.sql).
export default function PeriodSelector({ scope, value, onChange, onArchived }) {
  const id = useId();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadPeriods() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin-periods?scope=${scope}`);
      const data = await response.json().catch(() => ({}));
      if (response.ok) setPeriods(data.periods || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function handleStartNewPeriod(event) {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      setError('A label is required.');
      return;
    }
    setSaving(true);
    setError('');
    const response = await fetch('/api/admin-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, label: trimmed }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error || 'Could not start the new period.');
      return;
    }
    setLabel('');
    setShowNew(false);
    await loadPeriods();
    onChange('current');
    if (onArchived) onArchived(data.period);
  }

  return (
    <div className="period-selector">
      <label htmlFor={`${id}-period`}>
        Time period
        <select
          id={`${id}-period`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="current">Current</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.label} ({new Date(period.archived_at).toLocaleDateString()})
            </option>
          ))}
        </select>
      </label>
      <Button variant="quiet" type="button" onClick={() => setShowNew((v) => !v)}>
        Start new period&hellip;
      </Button>
      {showNew && (
        <form className="period-selector-new" onSubmit={handleStartNewPeriod}>
          <Input
            tone="console"
            type="text"
            placeholder="e.g. Before Sept 4, 2026"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="New period label"
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save current data as this period'}
          </Button>
          {error && <span className="status error">{error}</span>}
        </form>
      )}
      {value !== 'current' && (
        <p className="period-selector-readonly" role="status">
          Viewing an archived period &mdash; read only. Switch to &ldquo;Current&rdquo; to edit.
        </p>
      )}
      <style>{`
        .period-selector{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin:18px 0;padding:14px 16px;background:var(--panel,#15212b);border:1px solid var(--edge,#34404b);border-radius:10px}
        .period-selector label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700}
        .period-selector select{height:40px;padding:8px 11px;background:var(--field-bg,#0e1821);color:var(--parchment,#eee);border:1px solid var(--edge,#45515b);border-radius:6px;font:inherit;min-width:220px}
        .period-selector-new{display:flex;flex-wrap:wrap;gap:10px;align-items:center;width:100%}
        .period-selector-readonly{width:100%;margin:0;font-size:12px;font-weight:700;color:var(--ember,#e0a030)}
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';

// Renders a piece of homepage text. For non-admins it is a plain element.
// For a logged-in admin it shows an inline edit control that saves via the
// existing admin-guarded PATCH /api/admin-content/[id] endpoint.
export default function HomeEditableText({
  id,
  fieldKey,
  initialText,
  isAdmin,
  as = 'span',
  className,
  multiline = false,
}) {
  const Tag = as;
  const [text, setText] = useState(initialText || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialText || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isAdmin) {
    return <Tag className={className}>{text}</Tag>;
  }

  async function save() {
    if (!id) {
      setError('This field is still being set up. Reload and try again.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin-content/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { key: fieldKey, text: draft } }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || 'Save failed');
        setSaving(false);
        return;
      }
      const savedText =
        result.block && result.block.content && result.block.content.text != null
          ? result.block.content.text
          : draft;
      setText(savedText);
      setEditing(false);
    } catch (e) {
      setError('Save failed');
    }
    setSaving(false);
  }

  if (editing) {
    return (
      <span className="home-edit-field">
        {multiline ? (
          <textarea
            className="home-edit-input"
            value={draft}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <input
            className="home-edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
        <span className="home-edit-actions">
          <button type="button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(text);
              setEditing(false);
              setError('');
            }}
            disabled={saving}
          >
            Cancel
          </button>
        </span>
        {error && <span className="home-edit-error">{error}</span>}
      </span>
    );
  }

  return (
    <Tag className={(className ? className + ' ' : '') + 'home-editable'}>
      {text}
      <button
        type="button"
        className="home-edit-pencil"
        title="Edit text"
        onClick={() => {
          setDraft(text);
          setEditing(true);
        }}
      >
        ✎
      </button>
    </Tag>
  );
}

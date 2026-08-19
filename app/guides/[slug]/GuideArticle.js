'use client';

import { useEffect, useState } from 'react';

export default function GuideArticle({ slug, memberId }) {
  const [guide, setGuide] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const query = memberId ? `?member_id=${encodeURIComponent(memberId)}` : '';
  const guidesHref = `/guides${query}`;

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/guides/${encodeURIComponent(slug)}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load this guide.');
        if (cancelled) return;
        setGuide(result.guide);
        setDraftTitle(result.guide?.title || '');
        setDraft(result.guide?.body || '');
        setIsAdmin(Boolean(result.isAdmin));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load this guide.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGuide();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (guide?.title) document.title = `${guide.title} | K710`;
    return () => { document.title = 'Kingdom Guide | K710'; };
  }, [guide?.title]);

  async function verifySavedGuide(expectedTitle, expectedBody) {
    const stamp = Date.now();
    const [guideResponse, directoryResponse] = await Promise.all([
      fetch(`/api/guides/${encodeURIComponent(slug)}?verify=${stamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      }),
      fetch(`/api/guides?verify=${stamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      }),
    ]);

    const guideResult = await guideResponse.json();
    const directoryResult = await directoryResponse.json();

    if (!guideResponse.ok) throw new Error(guideResult.error || 'Could not verify the saved guide.');
    if (!directoryResponse.ok) throw new Error(directoryResult.error || 'Could not verify the Guides directory.');

    const directoryGuide = (directoryResult.guides || []).find((item) => item.slug === slug);
    const persistedGuide = guideResult.guide;

    if (!persistedGuide || persistedGuide.title !== expectedTitle || persistedGuide.body !== expectedBody) {
      throw new Error('The database did not return the saved guide exactly as submitted.');
    }
    if (!directoryGuide || directoryGuide.title !== expectedTitle) {
      throw new Error('The Guides directory did not return the saved title.');
    }

    return persistedGuide;
  }

  async function saveGuide() {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError('Guide title cannot be blank.');
      return;
    }

    setSaving(true);
    setStatus('');
    setError('');

    try {
      const response = await fetch(`/api/guides/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ title: nextTitle, body: draft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save this guide.');

      const persistedGuide = await verifySavedGuide(nextTitle, draft);
      setGuide(persistedGuide);
      setDraftTitle(persistedGuide.title || '');
      setDraft(persistedGuide.body || '');
      setEditing(false);
      setStatus('Saved and verified. The individual guide and Guides directory now use this persisted title.');
    } catch (err) {
      setError(err.message || 'Unable to save and verify this guide.');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDraftTitle(guide?.title || '');
    setDraft(guide?.body || '');
    setEditing(false);
    setStatus('');
    setError('');
  }

  if (loading) {
    return (
      <main className="armory guide-page">
        <div className="armory-atmos" aria-hidden="true" />
        <div className="armory-inner guide-inner">
          <p className="k-narrative guide-loading">Opening the library volume…</p>
        </div>
      </main>
    );
  }

  if (!guide) {
    return (
      <main className="armory guide-page">
        <div className="armory-atmos" aria-hidden="true" />
        <div className="armory-inner guide-inner">
          <a href={guidesHref} className="guide-back">← Guides</a>
          <div className="guide-error k-narrative">{error || 'Guide not found.'}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="armory guide-page">
      <div className="armory-atmos" aria-hidden="true" />
      <span className="armory-rack-l" aria-hidden="true" />
      <span className="armory-rack-r" aria-hidden="true" />

      <div className="armory-inner guide-inner">
        <div className="guide-topbar">
          <a href={guidesHref} className="guide-back">← Guides</a>
          {isAdmin && <span className="guide-admin-badge">Admin editing available</span>}
        </div>

        <header className="guide-header">
          <span className="k-mark">{guide.category}</span>
          {!editing ? (
            <h1 className="k-display">{guide.title}</h1>
          ) : (
            <div className="guide-title-editor">
              <label htmlFor="guide-title">Guide title</label>
              <input
                id="guide-title"
                type="text"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                maxLength={180}
                autoFocus
              />
            </div>
          )}
          <p className="k-narrative">{guide.description}</p>
          <div className="guide-rule" aria-hidden="true" />
        </header>

        <article className="guide-volume">
          <div className="guide-volume-spine" aria-hidden="true" />
          {!editing ? (
            <div className="guide-body k-narrative">{guide.body || 'This guide has not been written yet.'}</div>
          ) : (
            <div className="guide-editor">
              <label htmlFor="guide-body">Guide text</label>
              <textarea
                id="guide-body"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck="true"
              />
              <p>Plain text is preserved exactly, including paragraph breaks and lists.</p>
            </div>
          )}
        </article>

        {error && <div className="guide-message error" role="alert">{error}</div>}
        {status && <div className="guide-message success" role="status">{status}</div>}

        {isAdmin && (
          <div className="guide-admin-actions">
            {!editing ? (
              <button type="button" className="k-btn guide-edit" onClick={() => { setEditing(true); setStatus(''); setError(''); }}>
                Edit Guide
              </button>
            ) : (
              <>
                <button type="button" className="k-btn guide-save" onClick={saveGuide} disabled={saving}>
                  {saving ? 'Saving & verifying…' : 'Save Changes'}
                </button>
                <button type="button" className="guide-cancel" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        <footer className="guide-footer">
          <span>Last updated {guide.updated_at ? new Date(guide.updated_at).toLocaleString() : '—'}</span>
          {memberId && <span>Member {memberId}</span>}
        </footer>
      </div>

      <style jsx>{`
        .guide-page{color:var(--parchment)}
        .guide-inner{width:min(940px,100%);padding-top:clamp(82px,10vh,118px);padding-bottom:80px}
        .guide-topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:34px;padding-bottom:14px;border-bottom:1px solid var(--edge)}
        .guide-back{color:var(--brass);font-family:var(--font-body);font-size:12px;text-decoration:none;letter-spacing:.06em}
        .guide-back:hover{color:var(--gold-hot)}
        .guide-admin-badge{font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#d8ba6c;border:1px solid rgba(201,164,78,.34);background:rgba(201,164,78,.07);padding:7px 9px}
        .guide-header{max-width:780px;margin-bottom:30px}
        .guide-header h1{margin:9px 0 10px;font-size:clamp(32px,5.4vw,58px);line-height:1.02;letter-spacing:.055em;color:var(--parchment)}
        .guide-header p{margin:0;color:var(--parchment-dim);font-size:17px;line-height:1.65;max-width:65ch}
        .guide-title-editor{margin:12px 0 14px}
        .guide-title-editor label{display:block;margin-bottom:8px;font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--brass)}
        .guide-title-editor input{display:block;width:100%;border:1px solid rgba(201,164,78,.38);background:#100f0d;color:var(--parchment);padding:14px 16px;font-family:var(--font-display);font-size:clamp(24px,4vw,42px);letter-spacing:.045em;outline:none}
        .guide-title-editor input:focus{border-color:rgba(233,193,98,.78);box-shadow:0 0 0 2px rgba(201,164,78,.09)}
        .guide-rule{width:120px;height:1px;margin-top:24px;background:linear-gradient(90deg,var(--gold),transparent)}
        .guide-volume{position:relative;min-height:420px;padding:clamp(28px,4vw,48px) clamp(24px,5vw,58px);background:linear-gradient(135deg,rgba(45,35,24,.95),rgba(25,21,17,.98));border:1px solid rgba(201,164,78,.27);box-shadow:0 28px 70px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.025)}
        .guide-volume:before{content:'';position:absolute;inset:10px;border:1px solid rgba(201,164,78,.11);pointer-events:none}
        .guide-volume-spine{position:absolute;left:0;top:0;bottom:0;width:8px;background:linear-gradient(90deg,#1a120b,#79592b,#2b1d10);border-right:1px solid rgba(201,164,78,.35)}
        .guide-body{position:relative;z-index:1;white-space:pre-wrap;color:#e6dcc2;font-size:17px;line-height:1.82;letter-spacing:.005em}
        .guide-editor{position:relative;z-index:1}
        .guide-editor label{display:block;margin-bottom:9px;font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--brass)}
        .guide-editor textarea{display:block;width:100%;min-height:520px;resize:vertical;border:1px solid rgba(201,164,78,.32);background:#100f0d;color:#eee4ca;padding:18px;font-family:var(--font-body);font-size:16px;line-height:1.68;outline:none}
        .guide-editor textarea:focus{border-color:rgba(233,193,98,.72);box-shadow:0 0 0 2px rgba(201,164,78,.08)}
        .guide-editor p{margin:9px 0 0;color:var(--t-muted);font-size:11px}
        .guide-admin-actions{display:flex;gap:10px;align-items:center;margin-top:20px}
        .guide-edit,.guide-save{min-width:145px;border-color:rgba(201,164,78,.44);background:linear-gradient(180deg,#5f4b27,#312617);color:#f1dc9d}
        .guide-save:disabled{opacity:.58;cursor:wait}
        .guide-cancel{border:0;background:transparent;color:var(--parchment-dim);padding:10px 12px;cursor:pointer;font-family:var(--font-body)}
        .guide-cancel:hover{color:var(--parchment)}
        .guide-message{margin-top:16px;padding:11px 13px;font-size:12px;border:1px solid}
        .guide-message.error{color:#ffc1ad;border-color:rgba(255,125,91,.27);background:rgba(255,94,52,.06)}
        .guide-message.success{color:#c9edcf;border-color:rgba(120,205,137,.25);background:rgba(88,180,106,.06)}
        .guide-footer{display:flex;justify-content:space-between;gap:20px;margin-top:24px;padding-top:15px;border-top:1px solid rgba(201,164,78,.13);color:var(--t-muted);font-family:var(--font-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase}
        .guide-loading,.guide-error{margin-top:80px;color:var(--parchment-dim)}
        @media(max-width:620px){.guide-inner{padding-top:72px}.guide-topbar{align-items:flex-start;flex-direction:column}.guide-header h1{font-size:34px}.guide-title-editor input{font-size:28px}.guide-header p,.guide-body{font-size:15px}.guide-volume{padding:26px 20px 30px 28px;min-height:360px}.guide-editor textarea{min-height:440px}.guide-footer{flex-direction:column}.guide-admin-actions{align-items:stretch;flex-direction:column}.guide-edit,.guide-save,.guide-cancel{width:100%}}
      `}</style>
    </main>
  );
}

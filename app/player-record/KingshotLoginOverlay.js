'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'k710-kingshot-player-id';

function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '';
}

export default function KingshotLoginOverlay({ next = '' }) {
  const [playerId, setPlayerId] = useState('');
  const [remembered, setRemembered] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const autoAttempted = useRef(false);

  async function verify(id, { automatic = false } = {}) {
    const clean = String(id || '').trim();
    if (!clean || loading) return;
    setLoading(true);
    setStatus(automatic ? 'Rechecking your saved governor against Kingdom 710…' : 'Checking live Kingshot membership…');
    try {
      const response = await fetch('/api/member-auth/kingshot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: clean }),
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok !== true) {
        setStatus(data?.error || 'Kingshot verification failed.');
        return;
      }
      try { localStorage.setItem(STORAGE_KEY, data.memberId || clean); } catch {}
      setRemembered(true);
      setStatus(`${data.player?.nickname || 'Governor'} verified in Kingdom 710.`);
      window.setTimeout(() => {
        window.location.href = safeNext(next) || '/player-record';
      }, 650);
    } catch {
      setStatus('Kingshot verification could not be completed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoAttempted.current) return;
    autoAttempted.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || '';
      if (saved) {
        setPlayerId(saved);
        setRemembered(true);
        verify(saved, { automatic: true });
      }
    } catch {}
    // verify is intentionally run only once from persisted local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function forget() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setRemembered(false);
    setPlayerId('');
    setStatus('Saved governor removed from this browser.');
  }

  return (
    <aside className="ks-login-float" aria-live="polite">
      <div className="ks-login-card">
        <span className="ks-login-mark">KINGSHOT VERIFIED ACCESS</span>
        <strong>{remembered ? 'Returning governor detected' : 'Use your Kingshot Player ID'}</strong>
        <p>
          {remembered
            ? 'This browser remembers only your Player ID. K710Hub still rechecks the live kingdom before granting access.'
            : 'K710Hub checks the live player record and grants access only while the governor is currently in Kingdom 710.'}
        </p>
        <div className="ks-login-row">
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Kingshot Player ID"
            aria-label="Kingshot Player ID"
          />
          <button type="button" onClick={() => verify(playerId)} disabled={loading || !playerId}>
            {loading ? 'Checking…' : 'Verify 710'}
          </button>
        </div>
        {remembered && <button type="button" className="ks-forget" onClick={forget}>Forget this governor</button>}
        {status && <small>{status}</small>}
      </div>
      <style jsx>{`
        .ks-login-float{position:fixed;z-index:65;right:18px;bottom:18px;width:min(410px,calc(100vw - 36px));pointer-events:none}
        .ks-login-card{pointer-events:auto;padding:16px;border:1px solid rgba(208,160,82,.34);background:linear-gradient(145deg,rgba(20,16,11,.97),rgba(8,10,14,.985));box-shadow:0 18px 50px rgba(0,0,0,.44);color:#f4e6c9}
        .ks-login-mark{display:block;font:700 9px/1.2 var(--font-mono);letter-spacing:.14em;color:#d9ac62}.ks-login-card strong{display:block;margin-top:6px;font:700 17px/1.2 var(--font-display)}
        .ks-login-card p{margin:6px 0 12px;color:#b8ac98;font-size:12px;line-height:1.5}.ks-login-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.ks-login-row input{min-width:0;height:42px;border:1px solid rgba(208,160,82,.25);background:#0c0d10;color:#f2eadb;padding:0 11px;font:600 12px var(--font-mono);outline:none}.ks-login-row input:focus{border-color:#d4a45e}.ks-login-row button{border:1px solid #d09d52;background:#d09d52;color:#1b130b;padding:0 13px;font-size:11px;font-weight:900;cursor:pointer}.ks-login-row button:disabled{opacity:.55;cursor:wait}.ks-login-card small{display:block;margin-top:10px;color:#c5bcae;font-size:10px;line-height:1.45}.ks-forget{margin-top:10px;border:0;background:transparent;color:#9f927f;text-decoration:underline;font-size:10px;cursor:pointer;padding:0}
        @media(max-width:620px){.ks-login-float{position:relative;right:auto;bottom:auto;width:calc(100% - 32px);margin:-78px auto 26px}.ks-login-row{grid-template-columns:1fr}.ks-login-row button{height:42px}}
      `}</style>
    </aside>
  );
}

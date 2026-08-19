'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MemberAccessGate({ returnTo }) {
  const [mode, setMode] = useState('login');
  const [memberId, setMemberId] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetStatus() {
    setStatus('');
    setIsError(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetStatus();
    setLoading(true);
    try {
      const response = await fetch('/api/member-access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, passphrase }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIsError(true);
        setStatus(data?.error || 'Unable to sign in.');
        return;
      }
      setStatus('Credentials accepted. Opening the secure kingdom…');
      window.location.assign(returnTo || '/guides');
    } catch {
      setIsError(true);
      setStatus('Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(event) {
    event.preventDefault();
    resetStatus();
    if (passphrase !== confirmPassphrase) {
      setIsError(true);
      setStatus('The two access phrases do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/member-access/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, currentPin, passphrase }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIsError(true);
        setStatus(data?.error || 'Unable to activate secure access.');
        return;
      }
      setStatus('Secure access activated. Opening the kingdom…');
      window.location.assign(returnTo || '/guides');
    } catch {
      setIsError(true);
      setStatus('Unable to activate secure access right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-access-v2">
      <div className="member-access-atmos" aria-hidden="true" />
      <section className="member-access-shell">
        <header className="member-access-head">
          <span className="k-mark">Kingdom 710 · Secure Gate</span>
          <h1 className="k-display">Member Access</h1>
          <p className="k-narrative">
            Your Player ID identifies you. Your private access phrase proves it is really you.
          </p>
        </header>

        <div className="member-access-tabs" role="tablist" aria-label="Member access mode">
          <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); resetStatus(); }}>
            Sign In
          </button>
          <button type="button" className={mode === 'activate' ? 'is-active' : ''} onClick={() => { setMode('activate'); resetStatus(); }}>
            Activate Access
          </button>
        </div>

        {mode === 'login' ? (
          <form className="member-access-card" onSubmit={handleLogin}>
            <div className="member-access-card-head">
              <span className="k-mark">Returning Member</span>
              <h2 className="k-display">Enter the Kingdom</h2>
              <p>Use the access phrase you created during activation.</p>
            </div>
            <label>
              <span>Player ID</span>
              <input value={memberId} onChange={(e) => setMemberId(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              <span>Access Phrase</span>
              <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} autoComplete="current-password" required />
            </label>
            {status && <div className={isError ? 'member-access-status error' : 'member-access-status'}>{status}</div>}
            <button className="member-access-primary" type="submit" disabled={loading}>{loading ? 'Checking…' : 'Enter Secure Hub'}</button>
            <p className="member-access-footnote">Five incorrect attempts temporarily lock this Player ID for 15 minutes.</p>
          </form>
        ) : (
          <form className="member-access-card" onSubmit={handleActivate}>
            <div className="member-access-card-head">
              <span className="k-mark">One-Time Activation</span>
              <h2 className="k-display">Claim Your Secure Access</h2>
              <p>No admin-issued PIN is needed. Use the PIN you already chose for your K710 Player Record one final time, then create your own access phrase.</p>
            </div>
            <label>
              <span>Player ID</span>
              <input value={memberId} onChange={(e) => setMemberId(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              <span>Your Existing K710 PIN</span>
              <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} autoComplete="one-time-code" required />
            </label>
            <label>
              <span>Create Access Phrase</span>
              <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} autoComplete="new-password" minLength={10} required />
              <small>At least 10 characters. A memorable phrase is better than a short PIN.</small>
            </label>
            <label>
              <span>Confirm Access Phrase</span>
              <input type="password" value={confirmPassphrase} onChange={(e) => setConfirmPassphrase(e.target.value)} autoComplete="new-password" minLength={10} required />
            </label>
            {status && <div className={isError ? 'member-access-status error' : 'member-access-status'}>{status}</div>}
            <button className="member-access-primary" type="submit" disabled={loading}>{loading ? 'Activating…' : 'Activate & Enter'}</button>
            <p className="member-access-footnote">Only Player IDs already approved on the secure roster can activate. New Player Records do not automatically get access.</p>
          </form>
        )}

        <aside className="member-access-explainer">
          <div><strong>1</strong><span>Player chooses their own credentials</span></div>
          <div><strong>2</strong><span>Server issues a revocable 7-day session</span></div>
          <div><strong>3</strong><span>Leadership can revoke access instantly</span></div>
        </aside>

        <Link className="member-access-back" href="/player-record">← Return to the Gatehouse</Link>
      </section>

      <style jsx>{`
        .member-access-v2{min-height:100vh;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 20%,#26304a 0,#14192b 38%,#090c14 78%);color:var(--parchment);padding:96px 22px 70px}
        .member-access-atmos{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(201,164,78,.05),transparent 20%,transparent 80%,rgba(201,164,78,.05)),radial-gradient(circle at 50% 82%,rgba(72,138,197,.12),transparent 38%)}
        .member-access-shell{position:relative;z-index:1;width:min(780px,100%);margin:0 auto}
        .member-access-head{text-align:center;margin-bottom:28px}.member-access-head h1{font-size:clamp(36px,7vw,64px);margin:8px 0 10px;letter-spacing:.08em}.member-access-head p{color:var(--parchment-dim);font-size:17px;max-width:650px;margin:0 auto;line-height:1.55}
        .member-access-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(201,164,78,.25);background:rgba(7,10,17,.72);padding:5px;margin:0 auto 14px;max-width:520px}.member-access-tabs button{border:0;background:transparent;color:var(--parchment-dim);padding:12px 14px;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.12em;cursor:pointer}.member-access-tabs button.is-active{background:rgba(201,164,78,.12);color:var(--gold-hot);box-shadow:inset 0 0 0 1px rgba(201,164,78,.2)}
        .member-access-card{background:linear-gradient(180deg,rgba(26,28,32,.97),rgba(13,15,20,.98));border:1px solid rgba(201,164,78,.32);box-shadow:0 28px 80px rgba(0,0,0,.48);padding:clamp(24px,5vw,42px);display:grid;gap:18px}.member-access-card-head{padding-bottom:10px;border-bottom:1px solid rgba(201,164,78,.14)}.member-access-card-head h2{margin:6px 0 7px;font-size:clamp(24px,4vw,34px);letter-spacing:.05em}.member-access-card-head p{margin:0;color:var(--parchment-dim);line-height:1.55}
        .member-access-card label{display:grid;gap:7px}.member-access-card label>span{font-family:var(--font-mono);font-size:10px;color:var(--brass);text-transform:uppercase;letter-spacing:.11em}.member-access-card input{width:100%;box-sizing:border-box;background:#0b0e15;border:1px solid rgba(201,164,78,.23);color:var(--parchment);padding:13px 14px;font:inherit;outline:none}.member-access-card input:focus{border-color:rgba(225,187,92,.68);box-shadow:0 0 0 3px rgba(201,164,78,.08)}.member-access-card small{color:var(--t-muted);line-height:1.4}
        .member-access-primary{border:1px solid rgba(115,188,247,.55);background:linear-gradient(180deg,#22659a,#17476e);color:#eef8ff;padding:14px 18px;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.12em;cursor:pointer}.member-access-primary:disabled{opacity:.58;cursor:wait}.member-access-status{padding:11px 13px;border:1px solid rgba(116,192,126,.38);background:rgba(66,126,76,.12);color:#bde5c3;font-size:13px}.member-access-status.error{border-color:rgba(210,86,86,.42);background:rgba(142,54,54,.14);color:#f0b0b0}.member-access-footnote{margin:0;color:var(--t-muted);font-size:12px;line-height:1.45}
        .member-access-explainer{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.member-access-explainer div{border:1px solid rgba(201,164,78,.14);background:rgba(10,12,17,.62);padding:14px;display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:start}.member-access-explainer strong{color:var(--gold-hot);font-family:var(--font-display-loaded),Georgia,serif;font-size:20px}.member-access-explainer span{color:var(--parchment-dim);font-size:12px;line-height:1.45}.member-access-back{display:inline-block;margin-top:24px;color:var(--brass);text-decoration:none;font-size:12px;letter-spacing:.05em}.member-access-back:hover{color:var(--gold-hot)}
        @media(max-width:650px){.member-access-v2{padding-top:78px}.member-access-explainer{grid-template-columns:1fr}.member-access-card{padding:24px 18px}}
      `}</style>
    </main>
  );
}

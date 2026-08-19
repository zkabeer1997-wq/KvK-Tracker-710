'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import MemberHub from '../../components/kingdom/world/MemberHub';

export default function PlayerRecordGate({ banner }) {
  const [memberId, setMemberId] = useState('');
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [verifiedMemberId, setVerifiedMemberId] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Auth path is unchanged: same RPC, same arguments, same failure copy.
  async function handleUnlock(e) {
    e.preventDefault();
    setStatus('');
    setIsError(false);
    if (!memberId) {
      setIsError(true);
      setStatus('Please enter your Member ID.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('verify_page_pin', {
      p_member_id: memberId,
      p_pin: pin,
    });
    setLoading(false);
    if (error) {
      setIsError(true);
      setStatus('Something went wrong: ' + error.message);
      return;
    }
    if (data === true) {
      setVerifiedMemberId(memberId);
      if (reduced) {
        setUnlocked(true);
      } else {
        setOpening(true);
        setTimeout(() => {
          setUnlocked(true);
          setOpening(false);
        }, 1500);
      }
    } else {
      setIsError(true);
      setStatus('Incorrect PIN for this Member ID.');
    }
  }

  if (unlocked) {
    return <MemberHub memberId={verifiedMemberId} />;
  }

  return (
    <main className="k-scene gatehouse">
      <div className="k-scene-layer gatehouse-art" aria-hidden="true" />
      <div className="k-scene-layer gatehouse-torch gatehouse-torch-l" aria-hidden="true" />
      <div className="k-scene-layer gatehouse-torch gatehouse-torch-r" aria-hidden="true" />
      <div className="k-scene-layer k-vignette" aria-hidden="true" />

      <div className="k-scene-layer gatehouse-guards" aria-hidden="true">
        <span className="gatehouse-guard gatehouse-guard-l" />
        <span className="gatehouse-guard gatehouse-guard-r" />
      </div>

      <div className="gatehouse-inner">
        {banner}

        <header className="gatehouse-head">
          <span className="k-mark">Security Checkpoint</span>
          <h1 className="k-display gatehouse-title">The Gatehouse</h1>
          <p className="k-narrative gatehouse-lede">
            Your governor ID is your name inside the kingdom.
          </p>
        </header>

        <form className="gatehouse-desk k-ui" onSubmit={handleUnlock}>
          <div className="gatehouse-desk-grain" aria-hidden="true" />

          <label className="k-field" htmlFor="gate-member-id">
            <span>Member ID</span>
            <input
              id="gate-member-id"
              className="k-input"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="k-field" htmlFor="gate-pin">
            <span>PIN</span>
            <input
              id="gate-pin"
              className="k-input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              placeholder="Leave blank if you are new"
            />
          </label>

          {status && (
            <div className={isError ? 'status error' : 'status'} role="status">
              {status}
            </div>
          )}

          <button type="submit" className="k-btn k-btn-sky gatehouse-submit" disabled={loading || opening}>
            {loading ? 'Checking…' : opening ? 'Gate opening…' : 'Present Credentials'}
          </button>

          <p className="gatehouse-hint k-narrative">
            First time through? Leave the PIN blank and one will be set for you.
          </p>
        </form>

        <Link href="/admin" className="gatehouse-restricted">
          <span className="k-mark">Restricted</span>
          <span>Command Access</span>
        </Link>
      </div>

      <div className={`gatehouse-doors ${opening ? 'is-open' : ''}`} aria-hidden="true">
        <span className="gatehouse-door gatehouse-door-l" />
        <span className="gatehouse-door gatehouse-door-r" />
        <span className="gatehouse-doorlight" />
      </div>
    </main>
  );
}

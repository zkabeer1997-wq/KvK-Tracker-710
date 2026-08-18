'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function PlayerRecordGate({ banner }) {
  const [memberId, setMemberId] = useState('');
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [verifiedMemberId, setVerifiedMemberId] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setUnlocked(true);
    } else {
      setIsError(true);
      setStatus('Incorrect PIN for this Member ID.');
    }
  }

  if (unlocked) {
    const encodedId = encodeURIComponent(verifiedMemberId);
    return (
      <main className="command-deck-page">
        <div className="command-deck-inner">
          <div className="command-deck-header">
            <span className="eyebrow">Inner Gate &middot; Access Granted</span>
            <h1>Welcome back, {verifiedMemberId}</h1>
            <p>Choose which record you would like to update.</p>
          </div>
          <div className="command-deck-grid">
            <Link href={`/power-profile?member_id=${encodedId}`} className="command-deck-tile">
              <h2>War Ledger</h2>
              <p>Governor gear, charms, hero gear, and power stats.</p>
            </Link>
            <Link href={`/player-record/form?member_id=${encodedId}`} className="command-deck-tile">
              <h2>Rally Joiner Form</h2>
              <p>Troop tiers, TG, heroes, and battle availability.</p>
            </Link>
            <Link href={`/prep-phase-backpack?member_id=${encodedId}`} className="command-deck-tile">
              <h2>Minister&rsquo;s Hall</h2>
              <p>Backpack amounts and minister position bookings.</p>
            </Link>
            <Link href={`/flamedragon?member_id=${encodedId}`} className="command-deck-tile">
              <h2>Flamedragon Tyrant Form</h2>
              <p>Availability, levels, and heroes.</p>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inner-gate-page">
      <div className="inner-gate-card">
        <svg className="inner-gate-crest" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 3 L35 8 V19 C35 28 29 34 20 37 C11 34 5 28 5 19 V8 Z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {banner}
        <h1>Inner Gate</h1>
        <p className="sub">Members report to the inner checkpoint. Enter your Member ID and PIN to continue.</p>
        <form className="inner-gate-form" onSubmit={handleUnlock}>
          <label htmlFor="gate-member-id">
            <span>Member ID</span>
            <input id="gate-member-id" value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
          </label>
          <label htmlFor="gate-pin">
            <span>PIN</span>
            <input id="gate-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Leave blank if you are new" />
          </label>
          {status && <div className={isError ? 'status error' : 'status'}>{status}</div>}
          <button type="submit" className="inner-gate-submit" disabled={loading}>{loading ? 'Checking...' : 'Enter the Kingdom'}</button>
        </form>
        <p className="inner-gate-hint">First time here? Leave the PIN blank &mdash; one will be set for you.</p>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function PlayerRecordGate({ banner }) {
const [memberId, setMemberId] = useState('');
const [pin, setPin] = useState('');h
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
<main className="page public-page">
<div className="card admin-login-card rallies-hub">
<div className="card-header">
<h1>K710 Rallies</h1>
<p>Choose which record you would like to update, {verifiedMemberId}.</p>
</div>
<div className="card-body">
<div className="rallies-hub-options">
<Link href={`/power-profile?member_id=${encodedId}`} className="rallies-hub-option">
<h2>Rally Lead Form</h2>
<p>Governor gear, charms, hero gear, and power stats.</p>
</Link>
<Link href={`/player-record/form?member_id=${encodedId}`} className="rallies-hub-option">
<h2>Rally Joiner Form</h2>
<p>Troop tiers, TG, heroes, and battle availability.</p>
</Link>
</div>
</div>
</div>
</main>
);
}

return (
<main className="page">
<div className="card admin-login-card">
{banner}
<div className="card-body">
<form onSubmit={handleUnlock}>
<label htmlFor="gate-member-id">Member ID</label>
<input id="gate-member-id" value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
<label htmlFor="gate-pin">PIN</label>
<input id="gate-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Leave blank if you are new" />
{status && <div className={isError ? 'status error' : 'status'}>{status}</div>}
<button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Continue'}</button>
</form>
</div>
</div>
</main>
);
}

'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import PlayerRecordForm from './PlayerRecordForm';

export default function PlayerRecordPage() {
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
return (
<main className="page public-page">
<PlayerRecordForm initialMemberId={verifiedMemberId} />
</main>
);
}

return (
<main className="page">
<div className="card admin-login-card">
<div className="card-header">
<h1>K710 Rallies</h1>
<p>Enter your Member ID and PIN to continue. New members can leave the PIN blank.</p>
</div>
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

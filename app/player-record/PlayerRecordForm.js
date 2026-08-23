'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AVAILABILITY_OPTIONS = [
'First half (12-14:30 UTC)',
'Second half (14:30-17 UTC)',
'Full battle (12-17 UTC)',
'Not Available'
];
const ALLIANCES = ['710', 'RED', 'SKY'];

export default function PlayerRecordForm({ initialMemberId = '' }) {
const [name, setName] = useState('');
const [memberId, setMemberId] = useState(initialMemberId);
const [infantryTier, setInfantryTier] = useState('');
const [infantryTg, setInfantryTg] = useState('');
const [cavalryTier, setCavalryTier] = useState('');
const [cavalryTg, setCavalryTg] = useState('');
const [archerTier, setArcherTier] = useState('');
const [archerTg, setArcherTg] = useState('');
const [heroes, setHeroes] = useState([]);
const [availability, setAvailability] = useState('');
  const [currentAlliance, setCurrentAlliance] = useState('');
const [pin, setPin] = useState('');
const [onFile, setOnFile] = useState(null);
const [status, setStatus] = useState('');
const [isError, setIsError] = useState(false);
const [loading, setLoading] = useState(false);

async function lookup() {
if (!memberId) return;
const { data } = await supabase
.from('public_submissions')
.select('*')
.eq('member_id', memberId)
.maybeSingle();
if (data) {
setOnFile(data);
if (name === '') setName(data.name || '');
setInfantryTier(data.infantry_tier || '');
setInfantryTg(data.infantry_tg || '');
setCavalryTier(data.cavalry_tier || '');
setCavalryTg(data.cavalry_tg || '');
setArcherTier(data.archer_tier || '');
setArcherTg(data.archer_tg || '');
setHeroes(data.heroes || []);
setAvailability(data.availability || '');
        setCurrentAlliance(data.current_alliance || '');
} else {
setOnFile(null);
}
}

useEffect(() => {
if (initialMemberId) {
lookup();
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function handleSubmit(e) {
e.preventDefault();
setStatus('');
setIsError(false);
if (!name || !memberId || !pin) {
setIsError(true);
setStatus('Please fill in your name, member ID, and PIN.');
return;
}
setLoading(true);
const { data, error } = await supabase.rpc('submit_troop_form', {
p_name: name,
p_member_id: memberId,
p_infantry_tier: infantryTier || null,
p_infantry_tg: infantryTg || null,
p_cavalry_tier: cavalryTier || null,
p_cavalry_tg: cavalryTg || null,
p_archer_tier: archerTier || null,
p_archer_tg: archerTg || null,
p_heroes: heroes,
p_availability: availability || null,
p_pin: pin,
});
setLoading(false);
if (error) {
setIsError(true);
if (error.message && error.message.includes('PIN_MISMATCH')) {
setStatus('Incorrect PIN for this Member ID. Please try again.');
} else {
setStatus('Something went wrong: ' + error.message);
}
return;
}
setIsError(false);
if (currentAlliance) {
await supabase.from('submissions').update({ current_alliance: currentAlliance }).eq('member_id', memberId);
}
setStatus(
data === 'created' ? 'Submitted! Your entry has been created.' : 'Updated! Your entry has been saved.'
);
}

return (
<div className="public-shell single-form">
<section className="public-intro">
<span className="public-kicker">KvK Availability</span>
<h1>Battle availability</h1>
<p>Tell kingdom leadership when you can participate in KvK.</p>
<div className="public-intro-stats" aria-label="Submission checklist">
<div>
<strong>1</strong>
<span>Quick form</span>
</div>
<div>
<strong>UTC</strong>
<span>Battle time</span>
</div>
<div>
<strong>{availability ? 'Set' : 'Open'}</strong>
<span>Availability</span>
</div>
</div>
</section>
<form className="public-form-card" onSubmit={handleSubmit}>
<div className="form-section-header">
<span>KvK Availability</span>
<h2>Tell us when you can join.</h2>
</div>
<section className="identity-grid">
<label>Your name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your in-game name" /></label>
<label>Member ID<input value={memberId} onChange={(e) => setMemberId(e.target.value)} onBlur={lookup} placeholder="Your Member ID" /></label>
</section>
<section className="troop-section public-section">
<div className="section-title-row"><span>Alliance</span><h3>Current Alliance</h3><p>Select the alliance you are currently in.</p></div>
<label>Current Alliance<select value={currentAlliance} onChange={(e) => setCurrentAlliance(e.target.value)}><option value="">Select alliance</option>{ALLIANCES.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
</section>
{onFile && (
<div className="on-file">
Currently on file - Availability: {onFile.availability || '-'}
</div>
)}
<section className="troop-section public-section">
<div className="section-title-row"><span>Timing</span><h3>Battle availability</h3><p>Select the window rally planners should count on.</p></div>
<div className="availability-grid">
{AVAILABILITY_OPTIONS.map((option) => (
<label key={option} className={availability === option ? 'availability-choice selected' : 'availability-choice'}>
<input type="radio" name="availability" checked={availability === option} onChange={() => setAvailability(option)} />
<span>{option}</span>
</label>
))}
</div>
</section>
<section className="pin-panel">
<label>Enter your PIN<input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Your PIN" /></label>
<p className="hint">First submission sets your PIN. Enter the same PIN next time to update your entry.</p>
</section>
{status && <div className={isError ? 'status error' : 'status'}>{status}</div>}
<button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Save KvK Availability'}</button>
</form>
</div>
);
}

'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const HEROES = [
'Chenko', 'Yeonwoo', 'Amane', 'Amadeus', 'Vivian', 'Margot', 'Thrud', 'Saul',
'Hilde', 'Gordon', 'Eric', 'Fahd', 'Alcar', 'Long Fei', 'Triton', 'Sophia',
'Zoe', 'Jaeger', 'Petra', 'Rosa'
];

const TIERS = ['T11', 'T10'];
const TGS = ['TG8', 'TG7', 'TG6', 'TG5', 'Below TG5'];
const AVAILABILITY_OPTIONS = [
'First half (12-14:30 UTC)',
'Second half (14:30-17 UTC)',
'Full battle (12-17 UTC)',
'Not Available'
];

export default function Home() {
const [name, setName] = useState('');
const [memberId, setMemberId] = useState('');
const [infantryTier, setInfantryTier] = useState('');
const [infantryTg, setInfantryTg] = useState('');
const [cavalryTier, setCavalryTier] = useState('');
const [cavalryTg, setCavalryTg] = useState('');
const [archerTier, setArcherTier] = useState('');
const [archerTg, setArcherTg] = useState('');
const [heroes, setHeroes] = useState([]);
const [availability, setAvailability] = useState('');
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
} else {
setOnFile(null);
}
}

function toggleHero(hero) {
setHeroes((prev) =>
prev.includes(hero) ? prev.filter((h) => h !== hero) : [...prev, hero]
);
}

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
setStatus(
data === 'created'
? 'Submitted! Your entry has been created.'
: 'Updated! Your entry has been saved.'
);
}

return (
<main className="page">
<div className="card">
<div className="card-header">
<h1>K710 KvK Planner</h1>
<p>
Enter your name and Member ID, set your Tier/TG per unit type, pick your
Heroes and Availability, then submit. Updating overwrites your previous
entry using the same PIN — never a duplicate.
</p>
</div>

<form className="card-body" onSubmit={handleSubmit}>
<label>
Your name
<input
value={name}
onChange={(e) => setName(e.target.value)}
placeholder="Your in-game name"
/>
</label>

<label>
Member ID
<input
value={memberId}
onChange={(e) => setMemberId(e.target.value)}
onBlur={lookup}
placeholder="Your Member ID"
/>
</label>

{onFile && (
<div className="on-file">
Currently on file — Infantry: {onFile.infantry_tier || '-'}-{onFile.infantry_tg || '-'} ·
Cavalry: {onFile.cavalry_tier || '-'}-{onFile.cavalry_tg || '-'} ·
Archer: {onFile.archer_tier || '-'}-{onFile.archer_tg || '-'}
{onFile.heroes && onFile.heroes.length > 0 && (
<> · Heroes: {onFile.heroes.join(', ')}</>
)}
{onFile.availability && <> · Availability: {onFile.availability}</>}
</div>
)}

<section className="troop-section">
<h3>Infantry</h3>
<div className="row">
<label>
Tier
<select value={infantryTier} onChange={(e) => setInfantryTier(e.target.value)}>
<option value="">Tier</option>
{TIERS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
<label>
TG
<select value={infantryTg} onChange={(e) => setInfantryTg(e.target.value)}>
<option value="">TG</option>
{TGS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
</div>
</section>

<section className="troop-section">
<h3>Cavalry</h3>
<div className="row">
<label>
Tier
<select value={cavalryTier} onChange={(e) => setCavalryTier(e.target.value)}>
<option value="">Tier</option>
{TIERS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
<label>
TG
<select value={cavalryTg} onChange={(e) => setCavalryTg(e.target.value)}>
<option value="">TG</option>
{TGS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
</div>
</section>

<section className="troop-section">
<h3>Archer</h3>
<div className="row">
<label>
Tier
<select value={archerTier} onChange={(e) => setArcherTier(e.target.value)}>
<option value="">Tier</option>
{TIERS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
<label>
TG
<select value={archerTg} onChange={(e) => setArcherTg(e.target.value)}>
<option value="">TG</option>
{TGS.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</label>
</div>
</section>

<section className="troop-section">
<h3>Heroes</h3>
<div className="checkbox-grid">
{HEROES.map((hero) => (
<label key={hero} className="checkbox-item">
<input
type="checkbox"
checked={heroes.includes(hero)}
onChange={() => toggleHero(hero)}
/>
{hero}
</label>
))}
</div>
</section>

<section className="troop-section">
<h3>Availability</h3>
<div className="checkbox-grid">
{AVAILABILITY_OPTIONS.map((option) => (
<label key={option} className="checkbox-item">
<input
type="radio"
name="availability"
checked={availability === option}
onChange={() => setAvailability(option)}
/>
{option}
</label>
))}
</div>
</section>

<label>
Enter your PIN
<input
type="password"
value={pin}
onChange={(e) => setPin(e.target.value)}
placeholder="Your PIN"
/>
</label>
<p className="hint">
First submission sets your PIN. Enter the same PIN next time to update
your entry.
</p>

{status && (
<div className={isError ? 'status error' : 'status'}>{status}</div>
)}

<button type="submit" disabled={loading}>
{loading ? 'Submitting...' : 'Submit'}
</button>
</form>
</div>
</main>
);
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const HEROES = [
'Chenko', 'Yeonwoo', 'Amane', 'Amadeus', 'Vivian', 'Margot', 'Thrud', 'Saul', 'Hilde', 'Gordon',
'Eric', 'Fahd', 'Alcar', 'Long Fei', 'Triton', 'Sophia', 'Zoe', 'Jaeger', 'Petra', 'Rosa'
];
const TIERS = ['T11', 'T10'];
const TGS = ['TG8', 'TG7', 'TG6', 'TG5', 'Below TG5'];
const AVAILABILITY_OPTIONS = [
'First half (12-14:30 UTC)',
'Second half (14:30-17 UTC)',
'Full battle (12-17 UTC)',
'Not Available'
];
const ALLIANCES = ['710', 'RED', 'SKY'];
const UNIT_FIELDS = [
{ key: 'infantry', label: 'Infantry', tier: 'infantryTier', tg: 'infantryTg' },
{ key: 'cavalry', label: 'Cavalry', tier: 'cavalryTier', tg: 'cavalryTg' },
{ key: 'archer', label: 'Archer', tier: 'archerTier', tg: 'archerTg' },
];

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

const tierValues = { infantryTier, cavalryTier, archerTier };
const tgValues = { infantryTg, cavalryTg, archerTg };
const tierSetters = { infantryTier: setInfantryTier, cavalryTier: setCavalryTier, archerTier: setArcherTier };
const tgSetters = { infantryTg: setInfantryTg, cavalryTg: setCavalryTg, archerTg: setArcherTg };

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

function toggleHero(hero) {
setHeroes((prev) => (
prev.includes(hero) ? prev.filter((h) => h !== hero) : [...prev, hero]
));
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
<span className="public-kicker">Player record</span>
<h1>Troops and heroes</h1>
<p>Share your unit strength, hero roster, and battle window so rally leads can build cleaner marches.</p>
<div className="public-intro-stats" aria-label="Submission checklist">
<div>
<strong>3</strong>
<span>Troop types</span>
</div>
<div>
<strong>{heroes.length}</strong>
<span>Heroes picked</span>
</div>
<div>
<strong>{availability ? 'Set' : 'Open'}</strong>
<span>Availability</span>
</div>
</div>
</section>
<form className="public-form-card" onSubmit={handleSubmit}>
<div className="form-section-header">
<span>Player record</span>
<h2>Tell rally leads what you can bring.</h2>
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
Currently on file - Infantry: {onFile.infantry_tier || '-'}-{onFile.infantry_tg || '-'} / Cavalry: {onFile.cavalry_tier || '-'}-{onFile.cavalry_tg || '-'} / Archer: {onFile.archer_tier || '-'}-{onFile.archer_tg || '-'}
{onFile.heroes && onFile.heroes.length > 0 && <> / Heroes: {onFile.heroes.join(', ')}</>}
{onFile.availability && <> / Availability: {onFile.availability}</>}
</div>
)}
<section className="troop-section public-section">
<div className="section-title-row"><span>Troops</span><h3>Unit strength</h3><p>Choose the best tier and TG for each troop type.</p></div>
<div className="unit-card-grid">
{UNIT_FIELDS.map((unit) => (
<div key={unit.key} className={`unit-card ${unit.key}`}>
<h4>{unit.label}</h4>
<div className="row">
<label>Tier<select value={tierValues[unit.tier]} onChange={(e) => tierSetters[unit.tier](e.target.value)}><option value="">Tier</option>{TIERS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
<label>TG<select value={tgValues[unit.tg]} onChange={(e) => tgSetters[unit.tg](e.target.value)}><option value="">TG</option>{TGS.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
</div>
</div>
))}
</div>
</section>
<section className="troop-section public-section">
<div className="section-title-row"><span>Heroes</span><h3>Available heroes</h3><p>Pick every hero you can confidently use for rally guidance.</p></div>
<div className="hero-chip-grid">
{HEROES.map((hero) => (
<label key={hero} className={heroes.includes(hero) ? 'hero-chip selected' : 'hero-chip'}>
<input type="checkbox" checked={heroes.includes(hero)} onChange={() => toggleHero(hero)} />
<span>{hero}</span>
</label>
))}
</div>
</section>
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
<button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit loadout'}</button>
</form>
</div>
);
}

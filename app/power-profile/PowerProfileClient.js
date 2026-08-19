'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
CHARM_LEVEL_OPTIONS,
CHARM_SLOTS,
GOVERNOR_GEAR_OPTIONS,
GOVERNOR_GEAR_SLOTS,
POWER_PROFILE_FIELDS,
blankCharmSelections,
blankGovernorGearSelections,
parseCharmSelections,
parseGovernorGearSelections,
serializeCharmSelections,
serializeGovernorGearSelections,
} from '../../lib/powerProfiles.mjs';

function PowerProfileForm({ initialMemberId = '', intro }) {
const [form, setForm] = useState({
name: '',
member_id: initialMemberId,
governor_gear: '',
charms: '',
hero_gear: '',
pet_power: '',
masters_power: '',
pin: '',
});
const [governorGear, setGovernorGear] = useState(blankGovernorGearSelections());
const [charms, setCharms] = useState(blankCharmSelections());
const [onFile, setOnFile] = useState(null);
const [status, setStatus] = useState('');
const [isError, setIsError] = useState(false);
const [loading, setLoading] = useState(false);

function updateField(key, value) {
setForm((current) => ({ ...current, [key]: value }));
}

function updateGovernorGear(key, value) {
setGovernorGear((current) => {
const next = { ...current, [key]: value };
setForm((currentForm) => ({ ...currentForm, governor_gear: serializeGovernorGearSelections(next) }));
return next;
});
}

function updateCharm(key, value) {
setCharms((current) => {
const next = { ...current, [key]: value };
setForm((currentForm) => ({ ...currentForm, charms: serializeCharmSelections(next) }));
return next;
});
}

async function lookup(overrideMemberId) {
const memberId = (overrideMemberId !== undefined ? overrideMemberId : form.member_id).trim();
if (!memberId) return;
const response = await fetch(`/api/power-profile?member_id=${encodeURIComponent(memberId)}`);
const result = await response.json();
if (!response.ok) {
setOnFile(null);
return;
}
if (result.profile) {
const gearSelections = parseGovernorGearSelections(result.profile.governor_gear);
const gearSummary = serializeGovernorGearSelections(gearSelections);
const charmSelections = parseCharmSelections(result.profile.charms);
const charmSummary = serializeCharmSelections(charmSelections);
setGovernorGear(gearSelections);
setCharms(charmSelections);
setOnFile(result.profile);
setForm((current) => ({
...current,
name: current.name || result.profile.name || '',
governor_gear: gearSummary || result.profile.governor_gear || '',
charms: charmSummary || result.profile.charms || '',
hero_gear: result.profile.hero_gear || '',
pet_power: result.profile.pet_power || '',
masters_power: result.profile.masters_power || '',
}));
} else {
setOnFile(null);
}
}

useEffect(() => {
if (initialMemberId) {
lookup(initialMemberId);
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

async function handleSubmit(event) {
event.preventDefault();
setStatus('');
setIsError(false);
setLoading(true);
const response = await fetch('/api/power-profile', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(form),
});
const result = await response.json();
setLoading(false);
if (!response.ok) {
setIsError(true);
setStatus(result.error || 'Could not save power profile.');
return;
}
setOnFile(result.profile);
setStatus(result.status === 'created' ? 'Power profile created.' : 'Power profile updated.');
}

return (
<main className="armory">
<div className="armory-atmos" aria-hidden="true" />
<div className="armory-rack-l" aria-hidden="true" />
<div className="armory-rack-r" aria-hidden="true" />
<div className="armory-inner">
<header className="armory-head">
<span className="k-mark">The Armory</span>
<h1 className="k-display armory-title k-engraved">Governor War Ledger</h1>
<p className="k-narrative armory-lede">Inspect your equipment. Rally leadership reads this to know what you bring to the field.</p>
</header>
{intro}
<form className="public-form-card war-ledger-form" onSubmit={handleSubmit}>
<section className="identity-grid">
<label>Your name<input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Your in-game name" /></label>
<label>Member ID<input value={form.member_id} onChange={(e) => updateField('member_id', e.target.value)} onBlur={() => lookup()} placeholder="Your Member ID" /></label>
</section>
{onFile && (
<div className="on-file">
Power profile on file - Governor Gear: {onFile.governor_gear || '-'} / Charms: {onFile.charms || '-'} / Hero Gear: {onFile.hero_gear || '-'} / Pet Power: {onFile.pet_power || '-'} / Masters Power: {onFile.masters_power || '-'}
</div>
)}

<div className="ledger-block">
  <div className="ledger-block-head">
    <span className="ledger-block-kicker">Governor Armory</span>
    <h3>Governor Gear</h3>
  </div>
  <div className="ledger-gear-grid">
    {GOVERNOR_GEAR_SLOTS.map((slot) => (
      <label key={slot.key} className="ledger-select">
        <span>{slot.label}</span>
        <select
          value={governorGear[slot.key]}
          onChange={(event) => updateGovernorGear(slot.key, event.target.value)}
        >
          <option value="">Select gear</option>
          {GOVERNOR_GEAR_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    ))}
  </div>
</div>

<div className="ledger-block">
  <div className="ledger-block-head">
    <span className="ledger-block-kicker">Talisman Case</span>
    <h3>Charms</h3>
  </div>
  <div className="ledger-charm-grid">
    {CHARM_SLOTS.map((slot) => (
      <label key={slot.key} className="ledger-select">
        <span>{slot.label}</span>
        <select
          value={charms[slot.key]}
          onChange={(event) => updateCharm(slot.key, event.target.value)}
        >
          <option value="">Select level</option>
          {CHARM_LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    ))}
  </div>
</div>

<div className="ledger-block">
  <div className="ledger-block-head">
    <span className="ledger-block-kicker">War Stats</span>
    <h3>Hero, Pet &amp; Masters Power</h3>
    <p>Use the exact labels or numbers you want admins to see.</p>
  </div>
  <div className="ledger-stats-grid">
    {POWER_PROFILE_FIELDS.map((field) => (
      <label key={field.key} className="ledger-select">
        <span>{field.label}</span>
        <input
          value={form[field.key]}
          onChange={(event) => updateField(field.key, event.target.value)}
          placeholder={field.label}
        />
      </label>
    ))}
  </div>
</div>

<section className="pin-panel">
<label>Enter your PIN<input type="password" value={form.pin} onChange={(e) => updateField('pin', e.target.value)} placeholder="Your PIN" /></label>
<p className="hint">First power submission sets your PIN for this page. Enter the same PIN next time to update it.</p>
</section>
{status && <div className={isError ? 'status error' : 'status'}>{status}</div>}
<button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save War Ledger'}</button>
</form>
</div>
</main>
);
}

function PowerProfilePageInner({ intro }) {
const searchParams = useSearchParams();
const memberId = searchParams.get('member_id') || '';
return <PowerProfileForm initialMemberId={memberId} intro={intro} />;
}

export default function PowerProfileClient({ intro }) {
return (
<Suspense fallback={null}>
<PowerProfilePageInner intro={intro} />
</Suspense>
);
}

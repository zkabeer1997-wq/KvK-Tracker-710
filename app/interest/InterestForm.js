'use client';

import { useEffect, useState } from 'react';
import SealedPetition from '../../components/kingdom/world/SealedPetition';

const MIGRATE_OPTIONS = [
'710 (Bear 0200UTC and 1300UTC)',
'RED (Bear 1105UTC, 1900UTC and 2320UTC)',
'SKY (Bear 1200UTC and 2000UTC)',
'Other',
];
const TROOP_LEVEL_OPTIONS = ['TG8', 'TG7', 'TG6', 'TG5', 'Below TG5'];
const T11_OPTIONS = ['Infantry', 'Cavalry', 'Archer', 'No T11'];
const YES_NO = ['Yes', 'No'];
const INTAKE_PERIOD_OPTIONS = (() => {
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const out = [];
const now = new Date();
for (let i = 0; i < 12; i += 1) {
const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
out.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
}
return out;
})();
const SPENDING_OPTIONS = [
'P2W Whale (spending like a KS shareholder)',
'P2W Dolphin (between $1000-$2000 monthly)',
'P2W Tadpole (upto $1000 monthly)',
'Occasional spending (less than $100 monthly)',
'F2P (pure skills, always on)',
];

const ACTS = [
  { id: 'identity', num: 'I', label: 'Who Approaches' },
  { id: 'intake', num: 'II', label: 'The Crossing' },
  { id: 'troops', num: 'III', label: 'Strength of Arms' },
  { id: 'commitment', num: 'IV', label: 'The Oath' },
  { id: 'battle-report', num: 'V', label: 'Proof' },
];

function Act({ id, num, title, children }) {
  return (
    <section id={id} className="petition-act">
      <header className="petition-act-head">
        <span className="petition-act-num k-display">{num}</span>
        <h2 className="petition-act-title k-display">{title}</h2>
        <span className="petition-act-rule" aria-hidden="true" />
      </header>
      <div className="petition-act-body">{children}</div>
    </section>
  );
}

function Chapter({ id, title, children }) {
  return (
    <section id={id} className="petition-group">
      <h3 className="petition-group-title k-mark">{title}</h3>
      <div className="petition-group-body">{children}</div>
    </section>
  );
}

const initialForm = {
inGameName: '',
playerId: '',
discordUsername: '',
currentServer: '',
intakePeriod: '',
currentAlliance: '',
migrateAlliance: '',
migrateAllianceOther: '',
highestTroopLevel: '',
currentTg: '',
t11: [],
mysticTrialStages: '',
totalPower: '',
willingReducePower: '',
passesRequired: '',
currentPasses: '',
activeCommit: '',
willingSaveResources: '',
participatesBattles: '',
spendingArchetype: '',
mainLanguage: '',
mainLanguageOther: '',
};

export default function InterestForm() {
const [form, setForm] = useState(initialForm);
const [screenshots, setScreenshots] = useState([]);
const [status, setStatus] = useState('');
const [isError, setIsError] = useState(false);
const [loading, setLoading] = useState(false);
const [sealed, setSealed] = useState(false);
const [reducedMotion, setReducedMotion] = useState(false);

useEffect(() => {
  if (typeof window === 'undefined') return;
  setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}, []);

function updateField(key, value) {
setForm((current) => ({ ...current, [key]: value }));
}

function toggleT11(option) {
setForm((current) => {
const has = current.t11.includes(option);
return { ...current, t11: has ? current.t11.filter((o) => o !== option) : [...current.t11, option] };
});
}

async function handleSubmit(e) {
e.preventDefault();
setStatus('');
setIsError(false);

const required = [
['inGameName', 'In-game name'],
['playerId', 'Player ID'],
['discordUsername', 'Discord username'],
['currentServer', 'Your current server'],
['currentAlliance', 'Your current alliance'],
['migrateAlliance', 'Which alliance are you looking to migrate to'],
['intakePeriod', 'Intake period'],
['highestTroopLevel', 'Current highest troop level'],
['currentTg', 'Current amount of TG'],
['mysticTrialStages', 'Current Mystic Trial total stages'],
['totalPower', 'Total Power'],
['activeCommit', 'Active commitment'],
['willingSaveResources', 'Willing to save resources'],
['participatesBattles', 'Participation in battles'],
['spendingArchetype', 'Spending archetype'],
['mainLanguage', 'Main language'],
];
for (const [key, label] of required) {
if (!String(form[key] || '').trim()) {
setIsError(true);
setStatus(`Please fill in: ${label}.`);
return;
}
}
if (form.t11.length === 0) {
setIsError(true);
setStatus('Please select at least one T11 option.');
return;
}
if (screenshots.length === 0) {
setIsError(true);
setStatus('Please upload at least one screenshot.');
return;
}

setLoading(true);
const body = new FormData();
body.append('in_game_name', form.inGameName);
body.append('player_id', form.playerId);
body.append('discord_username', form.discordUsername);
body.append('current_server', form.currentServer);
body.append('current_alliance', form.currentAlliance);
body.append('intake_period', form.intakePeriod);
body.append(
'migrate_alliance',
form.migrateAlliance === 'Other' ? `Other: ${form.migrateAllianceOther}` : form.migrateAlliance
);
body.append('highest_troop_level', form.highestTroopLevel);
body.append('current_tg', form.currentTg);
form.t11.forEach((option) => body.append('t11_units', option));
body.append('mystic_trial_stages', form.mysticTrialStages);
body.append('total_power', form.totalPower);
body.append('willing_reduce_power', form.willingReducePower);
body.append('passes_required', form.passesRequired);
body.append('current_passes', form.currentPasses);
body.append('active_commit', form.activeCommit);
body.append('willing_save_resources', form.willingSaveResources);
body.append('participates_battles', form.participatesBattles);
body.append('spending_archetype', form.spendingArchetype);
body.append(
'main_language',
form.mainLanguage === 'Other' ? `Other: ${form.mainLanguageOther}` : form.mainLanguage
);
screenshots.forEach((file) => body.append('screenshots', file));

const response = await fetch('/api/interest', { method: 'POST', body });
const result = await response.json().catch(() => ({}));
setLoading(false);

if (!response.ok) {
setIsError(true);
setStatus(result.error || 'Something went wrong. Please try again.');
return;
}
setIsError(false);
setStatus('');
setForm(initialForm);
setScreenshots([]);
setSealed(true);
}

return (
<>
{sealed && (
  <SealedPetition reducedMotion={reducedMotion} onClose={() => setSealed(false)} />
)}
<form className="public-form-card interest-petition" onSubmit={handleSubmit}>
<nav className="petition-index" aria-label="Petition sections">
  {ACTS.map((a) => (
    <a key={a.id} href={`#${a.id}`} className="petition-index-item">
      <span className="petition-index-num">{a.num}</span>
      {a.label}
    </a>
  ))}
</nav>

<Act id="identity" num="I" title="Who Approaches">
<Chapter id="identity-fields" title="Identity">
<div className="identity-grid">
<label>In-game name<input value={form.inGameName} onChange={(e) => updateField('inGameName', e.target.value)} /></label>
<label>Player ID<input value={form.playerId} onChange={(e) => updateField('playerId', e.target.value)} /></label>
<label>Discord username<input value={form.discordUsername} onChange={(e) => updateField('discordUsername', e.target.value)} /></label>
<label>Your current server (prior to transfer)<input value={form.currentServer} onChange={(e) => updateField('currentServer', e.target.value)} /></label>
<label>Your current alliance (prior to transfer)<input value={form.currentAlliance} onChange={(e) => updateField('currentAlliance', e.target.value)} /></label>
</div>
</Chapter>

</Act>

<Act id="intake" num="II" title="The Crossing">
<Chapter id="intake-fields" title="Intake window">
<div className="troop-section public-section">
<div className="section-title-row"><span>Intake</span><h3>Which intake period are you applying for?</h3></div>
<div className="radio-group">
{INTAKE_PERIOD_OPTIONS.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="intakePeriod" checked={form.intakePeriod === option} onChange={() => updateField('intakePeriod', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>
</Chapter>

<Chapter id="migration-fields" title="Migration">
<div className="troop-section public-section">
<div className="section-title-row"><span>Migration</span><h3>Which alliance are you looking to migrate to?</h3></div>
<div className="radio-group">
{MIGRATE_OPTIONS.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="migrateAlliance" checked={form.migrateAlliance === option} onChange={() => updateField('migrateAlliance', option)} />
<span>{option}</span>
</label>
))}
</div>
{form.migrateAlliance === 'Other' && (
<input placeholder="Please specify" value={form.migrateAllianceOther} onChange={(e) => updateField('migrateAllianceOther', e.target.value)} />
)}
</div>
</Chapter>

</Act>

<Act id="troops" num="III" title="Strength of Arms">
<Chapter id="troops-fields" title="Troops">
<div className="troop-section public-section">
<div className="section-title-row"><span>Troops</span><h3>Current highest troop level (not TC)</h3></div>
<div className="radio-group">
{TROOP_LEVEL_OPTIONS.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="highestTroopLevel" checked={form.highestTroopLevel === option} onChange={() => updateField('highestTroopLevel', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>

<div className="identity-grid">
<label>Current amount of TG<input value={form.currentTg} onChange={(e) => updateField('currentTg', e.target.value)} placeholder="We need to understand how far you can push your TG level" /></label>
</div>

<div className="troop-section public-section">
<div className="section-title-row"><span>Troops</span><h3>Do you have T11?</h3></div>
<div className="checkbox-grid">
{T11_OPTIONS.map((option) => (
<label key={option} className="checkbox-item">
<input type="checkbox" checked={form.t11.includes(option)} onChange={() => toggleT11(option)} />
<span>{option}</span>
</label>
))}
</div>
</div>
</Chapter>

<Chapter id="power-fields" title="Power">
<div className="identity-grid">
<label>Current Mystic Trial TOTAL STAGES<input value={form.mysticTrialStages} onChange={(e) => updateField('mysticTrialStages', e.target.value)} /></label>
<label>Total Power<input value={form.totalPower} onChange={(e) => updateField('totalPower', e.target.value)} /></label>
</div>

<div className="troop-section public-section">
<div className="section-title-row"><span>Power</span><h3>Are you willing to reduce your power? (for normal invite power cap)</h3></div>
<div className="radio-group">
{YES_NO.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="willingReducePower" checked={form.willingReducePower === option} onChange={() => updateField('willingReducePower', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>

<div className="identity-grid">
<label>Number of passes required for you to transfer to 710<input value={form.passesRequired} onChange={(e) => updateField('passesRequired', e.target.value)} /></label>
<label>Your current number of transfer passes<input value={form.currentPasses} onChange={(e) => updateField('currentPasses', e.target.value)} /></label>
</div>
</Chapter>

</Act>

<Act id="commitment" num="IV" title="The Oath">
<Chapter id="commitment-fields" title="Commitment">
<div className="troop-section public-section">
<div className="section-title-row"><span>Commitment</span><h3>Are you able to actively commit to game, and participate in alliance events?</h3></div>
<div className="radio-group">
{YES_NO.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="activeCommit" checked={form.activeCommit === option} onChange={() => updateField('activeCommit', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>

<div className="troop-section public-section">
<div className="section-title-row"><span>Commitment</span><h3>Are you willing to save resources for kvk prep, doing only minimal rewards on sub-events?</h3></div>
<div className="radio-group">
{YES_NO.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="willingSaveResources" checked={form.willingSaveResources === option} onChange={() => updateField('willingSaveResources', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>

<div className="troop-section public-section">
<div className="section-title-row"><span>Commitment</span><h3>Do you participate in Sanctuaries, Castle and KVK battles?</h3></div>
<div className="radio-group">
{YES_NO.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="participatesBattles" checked={form.participatesBattles === option} onChange={() => updateField('participatesBattles', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>
</Chapter>

<Chapter id="spending-fields" title="Spending">
<div className="troop-section public-section">
<div className="section-title-row"><span>Spending</span><h3>Your spending archetype</h3></div>
<div className="radio-group">
{SPENDING_OPTIONS.map((option) => (
<label key={option} className="radio-option">
<input type="radio" name="spendingArchetype" checked={form.spendingArchetype === option} onChange={() => updateField('spendingArchetype', option)} />
<span>{option}</span>
</label>
))}
</div>
</div>
</Chapter>

<Chapter id="language-fields" title="Language">
<div className="troop-section public-section">
<div className="section-title-row"><span>Language</span><h3>Main language of communication in-game</h3></div>
<div className="radio-group">
<label className="radio-option">
<input type="radio" name="mainLanguage" checked={form.mainLanguage === 'English'} onChange={() => updateField('mainLanguage', 'English')} />
<span>English</span>
</label>
<label className="radio-option">
<input type="radio" name="mainLanguage" checked={form.mainLanguage === 'Other'} onChange={() => updateField('mainLanguage', 'Other')} />
<span>Other</span>
</label>
</div>
{form.mainLanguage === 'Other' && (
<input placeholder="Please specify" value={form.mainLanguageOther} onChange={(e) => updateField('mainLanguageOther', e.target.value)} />
)}
</div>
</Chapter>

</Act>

<Act id="battle-report" num="V" title="Proof">
<Chapter id="proof-fields" title="Battle report">
<div className="troop-section public-section">
<div className="section-title-row"><span>Screenshots</span><h3>Upload your most recent battle report</h3><p>Should show your in-game name, Gov Gears/charms, Hero Gears and Masters.</p></div>
<input id="battle-report-upload" type="file" multiple accept="image/*" aria-label="Upload battle report screenshots" onChange={(e) => setScreenshots(Array.from(e.target.files || []))} />
<p className="file-hint">{screenshots.length > 0 ? `${screenshots.length} file(s) selected` : 'No files selected yet.'}</p>
</div>
</Chapter>

</Act>

{status && <div className={isError ? 'status error' : 'status'}>{status}</div>}
<button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Petition'}</button>
</form>
</>
);
}

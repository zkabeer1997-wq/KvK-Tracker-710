'use client';

import { useState } from 'react';

export const TIME_SLOTS = [
  '23:45', '00:15', '00:45', '01:15', '01:45', '02:15', '02:45', '03:15', '03:45', '04:15',
  '04:45', '05:15', '05:45', '06:15', '06:45', '07:15', '07:45', '08:15', '08:45', '09:15',
  '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15',
  '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15',
  '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15',
];

const CONSTRUCTION_UPGRADES = ['TG5', 'TG6', 'TG7', 'TG8'];
const T11_TROOPS = ['T11 Infantry', 'T11 Cavalry', 'T11 Archers'];

const initialForm = {
  inGameName: '',
  wantConstruction: '',
  constructionUpgrades: [],
  ttgUsed: '',
  tgUsed: '',
  wantResearch: '',
  t11Troops: [],
  tgDust: '',
  researchSpeedupDays: '',
  wantTroopTraining: '',
  isTransfer: '',
  troopSpeedupDays: '',
  promotingT11: '',
  notes: '',
};

function SlotPicker({ label, sublabel, selected, onToggle }) {
  return (
    <div className="prep-slot-group">
      <div className="prep-slot-head">
        <strong>{label}</strong>
        {sublabel ? <span className="prep-slot-sub">{sublabel}</span> : null}
      </div>
      <div className="prep-slot-grid">
        {TIME_SLOTS.map((slot) => {
          const on = selected.includes(slot);
          return (
            <button
              type="button"
              key={slot}
              className={on ? 'prep-slot on' : 'prep-slot'}
              onClick={() => onToggle(slot)}
              aria-pressed={on}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PrepBackpackForm({ initialMemberId = '' }) {
  const [form, setForm] = useState(initialForm);
  const [availDay1, setAvailDay1] = useState([]);
  const [availDay2, setAvailDay2] = useState([]);
  const [availDay4, setAvailDay4] = useState([]);
  const [availDay5, setAvailDay5] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInArray(setter) {
    return (value) =>
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleCheckbox(key, value) {
    setForm((prev) => {
      const list = prev[key];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    setIsError(false);
    if (!initialMemberId) {
      setIsError(true);
      setStatus('Missing Member ID. Please return to the hub and unlock again.');
      return;
    }
    if (!String(form.inGameName).trim()) {
      setIsError(true);
      setStatus('Please enter your in-game name.');
      return;
    }
    setLoading(true);
    const payload = {
      member_id: initialMemberId,
      in_game_name: form.inGameName,
      want_construction: form.wantConstruction,
      construction_upgrades: form.constructionUpgrades,
      ttg_used: form.ttgUsed,
      tg_used: form.tgUsed,
      want_research: form.wantResearch,
      t11_troops: form.t11Troops,
      tg_dust: form.tgDust,
      research_speedup_days: form.researchSpeedupDays,
      want_troop_training: form.wantTroopTraining,
      is_transfer: form.isTransfer,
      troop_speedup_days: form.troopSpeedupDays,
      promoting_t11: form.promotingT11,
      avail_day1: availDay1,
      avail_day2: availDay2,
      avail_day4: availDay4,
      avail_day5: availDay5,
      notes: form.notes,
    };
    const response = await fetch('/api/prep-backpack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setIsError(true);
      setStatus(result.error || 'Something went wrong. Please try again.');
      return;
    }
    setIsError(false);
    setStatus('Thanks! Your Prep Phase Backpack booking has been received.');
    setForm(initialForm);
    setAvailDay1([]);
    setAvailDay2([]);
    setAvailDay4([]);
    setAvailDay5([]);
  }

  return (
    <form className="public-form-card" onSubmit={handleSubmit}>
      <div className="form-section-header prep-header-block">
        <span>Prep Phase Backpack</span>
        <h2>Backpack Amounts and Minister Position Bookings</h2>
        <p>Booking as Member ID: <strong>{initialMemberId || '(unknown)'}</strong></p>
      </div>

      <section className="identity-grid">
        <label>In-game name<input value={form.inGameName} onChange={(e) => updateField('inGameName', e.target.value)} /></label>
      </section>

      <div className="prep-day-grid">
        <section className="form-block">
        <h3>Chief Minister &mdash; Construction (Day 1)</h3>
        <label>Do you want the Construction Chief Minister buff?
          <select value={form.wantConstruction} onChange={(e) => updateField('wantConstruction', e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <div className="checkbox-row">
          <span>Construction Upgrades</span>
          {CONSTRUCTION_UPGRADES.map((opt) => (
            <label key={opt} className="chk">
              <input type="checkbox" checked={form.constructionUpgrades.includes(opt)} onChange={() => toggleCheckbox('constructionUpgrades', opt)} />
              {opt}
            </label>
          ))}
        </div>
        <label>How much TTG will you use?<input value={form.ttgUsed} onChange={(e) => updateField('ttgUsed', e.target.value)} /></label>
        <label>How much TG will you use?<input value={form.tgUsed} onChange={(e) => updateField('tgUsed', e.target.value)} /></label>
        <SlotPicker label="Available Times &mdash; Day 1 (Construction)" sublabel="30-minute start times, UTC" selected={availDay1} onToggle={toggleInArray(setAvailDay1)} />
      </section>

      <section className="form-block">
        <h3>Chief Minister &mdash; Research (Day 2)</h3>
        <label>Do you want Chief Minister for research?
          <select value={form.wantResearch} onChange={(e) => updateField('wantResearch', e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <div className="checkbox-row">
          <span>Which new T11 troop are you unlocking?</span>
          {T11_TROOPS.map((opt) => (
            <label key={opt} className="chk">
              <input type="checkbox" checked={form.t11Troops.includes(opt)} onChange={() => toggleCheckbox('t11Troops', opt)} />
              {opt}
            </label>
          ))}
        </div>
        <label>How much TG Dust will you use?<input value={form.tgDust} onChange={(e) => updateField('tgDust', e.target.value)} /></label>
        <label>How many days of speedups will you use? (Include general speedups)<input value={form.researchSpeedupDays} onChange={(e) => updateField('researchSpeedupDays', e.target.value)} /></label>
        <SlotPicker label="Available Times &mdash; Day 2 (Research)" sublabel="30-minute start times, UTC" selected={availDay2} onToggle={toggleInArray(setAvailDay2)} />
      </section>

      <section className="form-block">
        <h3>Noble Advisor &mdash; Troop Training (Day 4)</h3>
        <label>Do you want a Troop Training appointment?
          <select value={form.wantTroopTraining} onChange={(e) => updateField('wantTroopTraining', e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <label>Are you a transfer?
          <select value={form.isTransfer} onChange={(e) => updateField('isTransfer', e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <label>How many days of speedups will you use? (600+ days gets more slots)<input value={form.troopSpeedupDays} onChange={(e) => updateField('troopSpeedupDays', e.target.value)} /></label>
        <label>Promoting to T11 troops?
          <select value={form.promotingT11} onChange={(e) => updateField('promotingT11', e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
        <SlotPicker label="Available Times &mdash; Day 4 (Troop Training)" sublabel="30-minute start times, UTC" selected={availDay4} onToggle={toggleInArray(setAvailDay4)} />
      </section>

      <section className="form-block">
        <h3>Overflow (Day 5) &mdash; Construction &amp; Research second chance</h3>
        <p className="prep-slot-sub">If you are not scheduled on Day 1 or Day 2, you may be placed here. Pick any times you are available.</p>
        <SlotPicker label="Available Times &mdash; Day 5 (Overflow)" sublabel="30-minute start times, UTC" selected={availDay5} onToggle={toggleInArray(setAvailDay5)} />
      </section>
        </div>

      <section className="form-block">
        <label>Notes for the planner<textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} /></label>
      </section>

      {status ? <div className={isError ? 'status error' : 'status'}>{status}</div> : null}
      <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Submitting...' : 'Submit booking'}</button>
    </form>
  );
}

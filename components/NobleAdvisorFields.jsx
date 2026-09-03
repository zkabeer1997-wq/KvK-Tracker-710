'use client';
import { TIME_SLOTS } from '../lib/nobleAdvisor.mjs';
export function SlotPicker({ label, sublabel, selected, onToggle }) {
  return (
    <div className="prep-slot-group">
      <div className="prep-slot-head">
        <strong>{label}</strong>
        <span className="prep-slot-count">{selected.length} selected</span>
        {sublabel ? <span className="prep-slot-sub">{sublabel} &middot; UTC</span> : null}
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


export default function NobleAdvisorFields({ form, updateField, availDay4, onToggle }) {
 return (
      <section className="form-block">
        <span className="minister-day-badge">Day 4</span>
        <h3>Noble Advisor &mdash; Troop Training</h3>
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
        <SlotPicker label="Available Times &mdash; Day 4 (Troop Training)" sublabel="30-minute start times, UTC" selected={availDay4} onToggle={onToggle} />
      </section>

 );
}

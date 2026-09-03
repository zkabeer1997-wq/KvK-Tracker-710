'use client';

import { Button, Field, Input, Select } from '../ui';
import { ALLIANCE_EVENT_TYPES, MAX_ALLIANCE_EVENTS } from '../../lib/allianceEvents.mjs';

export default function AllianceEventEditor({ events, onChange, disabled }) {
  function update(index, field, value) {
    onChange(events.map((event, i) => i === index ? { ...event, [field]: value } : event));
  }
  return (
    <fieldset disabled={disabled} className="alliance-event-editor">
      <legend>Alliance events</legend>
      <p>Set dates and UTC start times for Swordland, Tri-Alliance, and Vikings Vengeance. Save the alliance to publish them on the Events page.</p>
      <p>Add another entry to schedule the same event on a different date. Hidden alliances do not appear publicly.</p>
      {events.map((event, index) => (
        <div key={index} className="alliance-event-row">
          <Field label={`Event ${index + 1}`} htmlFor={`alliance-event-${index}`}>
            <Select id={`alliance-event-${index}`} tone="console" value={event.type} onChange={e => update(index, 'type', e.target.value)}>
              {Object.entries(ALLIANCE_EVENT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Field>
          <Field label="Date (UTC)" htmlFor={`alliance-date-${index}`}>
            <Input id={`alliance-date-${index}`} tone="console" type="date" min="2000-01-01" max="9999-12-31" value={event.date} onChange={e => update(index, 'date', e.target.value)} />
          </Field>
          <Field label="Start time (UTC)" htmlFor={`alliance-start-${index}`}>
            <Input id={`alliance-start-${index}`} tone="console" type="time" step="60" value={event.time_utc} onChange={e => update(index, 'time_utc', e.target.value)} />
          </Field>
          <Button variant="quiet" aria-label={`Remove event ${index + 1}`} onClick={() => onChange(events.filter((_, i) => i !== index))}>Remove</Button>
        </div>
      ))}
      {events.length === 0 && <p>No alliance events scheduled.</p>}
      <Button variant="quiet" disabled={events.length >= MAX_ALLIANCE_EVENTS} onClick={() => onChange([...events, { type: 'regular_swordland_1', date: '', time_utc: '' }])}>+ Add alliance event</Button>
      <style>{`
        .alliance-event-editor{border:1px solid var(--edge);padding:16px;display:grid;gap:12px;min-width:0}
        .alliance-event-editor p{margin:0;font-size:14px}
        .alliance-event-row{display:grid;grid-template-columns:minmax(200px,2fr) minmax(145px,1fr) minmax(130px,1fr) auto;gap:12px;align-items:end;border-top:1px solid var(--edge);padding-top:12px}
        .alliance-event-row input,.alliance-event-row select{min-width:0;max-width:100%}
        @media(max-width:1100px){.alliance-event-row{grid-template-columns:1fr 1fr}.alliance-event-row>:first-child{grid-column:1/-1}}
        @media(max-width:520px){.alliance-event-row{grid-template-columns:minmax(0,1fr)}.alliance-event-row>:first-child{grid-column:auto}}
      `}</style>
    </fieldset>
  );
}

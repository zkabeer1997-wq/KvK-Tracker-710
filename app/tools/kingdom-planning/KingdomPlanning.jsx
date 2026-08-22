'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';

const MILESTONES = [
  [0, 'Generation 1 Heroes'],
  [14, 'Plains fog lifts'],
  [38, 'Fertile Land fog lifts'],
  [45, 'Generation 2 / Alliance Resource Exchange window'],
  [54, 'First Castle Battle window'],
  [58, 'Generation 1 Pets window'],
  [70, 'Age of Truegold'],
  [78, 'Generation 2 Pets / Kingdom of Power eligibility window'],
  [110, 'Generation 3 Heroes & Pets window'],
  [150, 'Truegold Level 5 / Crucible'],
  [170, "Artisan's Vision / later Viking tiers window"],
  [195, 'Generation 4 Heroes & Pets window'],
  [220, 'War Academy window'],
  [275, 'Generation 5 Heroes & Pets window'],
  [315, 'Truegold Level 8 / Tempered Truegold window'],
  [355, 'Generation 6 Heroes & Pets window'],
  [440, 'Generation 7 Heroes / Pet window'],
];

function secondsFromText(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^\d+(?:\.\d+)?$/.test(text)) return Math.max(0, Number(text));
  const parts = text.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function clock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function RallyTimer() {
  const [rows, setRows] = useState([
    { id: 1, name: 'Lead 1', time: '1:30' },
    { id: 2, name: 'Lead 2', time: '1:10' },
    { id: 3, name: 'Lead 3', time: '0:55' },
  ]);

  const plan = useMemo(() => {
    const valid = rows.map((row) => ({ ...row, seconds: secondsFromText(row.time) })).filter((row) => row.seconds !== null);
    if (!valid.length) return { baseline: 0, rows: [] };
    const baseline = Math.max(...valid.map((row) => row.seconds));
    return {
      baseline,
      rows: valid.map((row) => ({ ...row, delay: baseline - row.seconds })).sort((a, b) => a.delay - b.delay),
    };
  }, [rows]);

  function patch(id, key, value) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  }

  return (
    <div>
      <header className={styles.head}><h2>Rally Timer</h2><p>Enter each confirmed march time. The slowest march launches first; faster marches get a launch delay so all arrivals land together.</p></header>
      <div className={styles.rallyRows}>
        {rows.map((row) => (
          <div className={styles.rallyRow} key={row.id}>
            <input aria-label="Player name" value={row.name} onChange={(e) => patch(row.id, 'name', e.target.value)} placeholder="Player" />
            <input aria-label="March time" value={row.time} onChange={(e) => patch(row.id, 'time', e.target.value)} placeholder="m:ss" inputMode="decimal" />
            <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>Remove</button>
          </div>
        ))}
      </div>
      <button className={styles.add} type="button" onClick={() => setRows((current) => [...current, { id: Date.now(), name: `Lead ${current.length + 1}`, time: '1:00' }])}>+ Add march</button>
      <div className={styles.metrics}>
        <div><span>Baseline march</span><strong>{clock(plan.baseline)}</strong></div>
        <div><span>Confirmed marches</span><strong>{plan.rows.length}</strong></div>
      </div>
      <div className={styles.timeline}>
        {plan.rows.map((row, index) => (
          <div className={styles.timelineRow} key={row.id}>
            <b>{index + 1}</b><span>{row.name || 'Unnamed'}</span><span>March {clock(row.seconds)}</span><strong>{row.delay === 0 ? 'LAUNCH NOW' : `+${clock(row.delay)}`}</strong>
          </div>
        ))}
      </div>
      <p className={styles.note}>Offsets assume everyone is targeting the same destination and that march times are measured under the same active buffs. A +0:20 offset means launch 20 seconds after the baseline march.</p>
    </div>
  );
}

function KingdomAge() {
  const today = new Date();
  const defaultOpen = new Date(today.getTime() - 200 * 86400000).toISOString().slice(0, 10);
  const [method, setMethod] = useState('date');
  const [openDate, setOpenDate] = useState(defaultOpen);
  const [vipDays, setVipDays] = useState(200);
  const [beastDate, setBeastDate] = useState(new Date(today.getTime() - 194 * 86400000).toISOString().slice(0, 10));

  const estimate = useMemo(() => {
    const now = new Date();
    let opened;
    if (method === 'vip') opened = new Date(now.getTime() - Math.max(0, Number(vipDays) || 0) * 86400000);
    else if (method === 'beast') {
      const completion = new Date(`${beastDate}T00:00:00`);
      opened = new Date(completion.getTime() - 6 * 86400000);
    } else opened = new Date(`${openDate}T00:00:00`);
    if (Number.isNaN(opened.getTime())) return null;
    const days = Math.max(0, Math.floor((now.getTime() - opened.getTime()) / 86400000));
    const next = MILESTONES.find(([day]) => day > days) || null;
    const passed = [...MILESTONES].reverse().find(([day]) => day <= days) || MILESTONES[0];
    return { opened, days, weeks: days / 7, next, passed };
  }, [method, openDate, vipDays, beastDate]);

  return (
    <div>
      <header className={styles.head}><h2>Kingdom Age Tracker</h2><p>Estimate server age from the evidence you actually have, then place the kingdom against practical milestone windows.</p></header>
      <div className={styles.segmented}>
        <button type="button" className={method === 'date' ? styles.active : ''} onClick={() => setMethod('date')}>Open date</button>
        <button type="button" className={method === 'vip' ? styles.active : ''} onClick={() => setMethod('vip')}>VIP days</button>
        <button type="button" className={method === 'beast' ? styles.active : ''} onClick={() => setMethod('beast')}>Beast achievement</button>
      </div>
      <div className={styles.ageInput}>
        {method === 'date' ? <label><span>Kingdom open date</span><input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} /></label> : null}
        {method === 'vip' ? <label><span>VIP login days</span><input type="number" min="0" value={vipDays} onChange={(e) => setVipDays(e.target.value)} /></label> : null}
        {method === 'beast' ? <label><span>Beast Hunting achievement completion</span><input type="date" value={beastDate} onChange={(e) => setBeastDate(e.target.value)} /></label> : null}
      </div>
      {estimate ? <>
        <div className={styles.metrics}>
          <div><span>Estimated age</span><strong>{estimate.days} days</strong></div>
          <div><span>Weeks</span><strong>{estimate.weeks.toFixed(1)}</strong></div>
          <div><span>Estimated opening</span><strong>{estimate.opened.toISOString().slice(0, 10)}</strong></div>
        </div>
        <div className={styles.milestoneCallout}>
          <span>Current window</span><b>Day {estimate.passed[0]} · {estimate.passed[1]}</b>
          {estimate.next ? <p>Next tracked milestone: <strong>Day {estimate.next[0]}</strong> · {estimate.next[1]} · about {estimate.next[0] - estimate.days} days away.</p> : <p>Beyond the currently tracked Day 440 milestone.</p>}
        </div>
        <div className={styles.milestones}>{MILESTONES.map(([day, label]) => <div key={day} className={day <= estimate.days ? styles.passed : ''}><b>Day {day}</b><span>{label}</span></div>)}</div>
      </> : null}
      <p className={styles.note}>VIP days are only a good age proxy if the player joined near kingdom creation and logged in consistently. Milestone dates are planning windows, not official guarantees.</p>
    </div>
  );
}

export default function KingdomPlanning() {
  const [tab, setTab] = useState('rally');
  return <section className={styles.shell}>
    <nav className={styles.tabs}>
      <button type="button" className={tab === 'rally' ? styles.activeTab : ''} onClick={() => setTab('rally')}>Rally Timer</button>
      <button type="button" className={tab === 'age' ? styles.activeTab : ''} onClick={() => setTab('age')}>Kingdom Age</button>
    </nav>
    <div className={styles.body}>{tab === 'rally' ? <RallyTimer /> : <KingdomAge />}</div>
  </section>;
}

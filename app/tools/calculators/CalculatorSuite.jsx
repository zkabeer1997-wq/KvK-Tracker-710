'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import {
  CHARM_LEVELS,
  GOVERNOR_GEAR_STAGES,
  GOVERNOR_SLOTS,
  HERO_GEAR_MILESTONES,
  HERO_SHARD_STEPS,
  HERO_XP_PER_LEVEL,
  MASTERY_LEVELS,
  RED_GEAR_BLOCKS,
  TROOP_DATA,
  WIDGET_COSTS,
  townCenterForHeroLevel,
} from './data';

const CALCULATORS = [
  ['governor-gear', 'Governor Gear', 'Satin · Threads · Vision'],
  ['governor-charms', 'Governor Charms', 'Guides · Designs'],
  ['hero-shards', 'Hero Shards', 'Specific · General'],
  ['hero-widgets', 'Hero Widgets', 'Exclusive gear'],
  ['hero-xp', 'Hero XP', 'Levels · Drill Camp'],
  ['hero-gear', 'Hero Gear', 'Enhancement · Mithril'],
  ['forgehammer', 'Forgehammer Set', 'Mastery · reserve'],
  ['troops', 'Troop Training', 'Train · promote · speedups'],
  ['vip', 'VIP Progress', 'Points · timeline'],
];

const EMPTY_RESOURCES = { satin: 0, threads: 0, visions: 0, guides: 0, designs: 0 };

function n(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function whole(value) {
  return Math.max(0, Math.floor(n(value)));
}

function fmt(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: number < 100 ? 2 : 0 }).format(number);
}

function formatDuration(seconds) {
  let remaining = Math.max(0, Math.round(Number(seconds) || 0));
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  if ((!days && !hours) || secs) parts.push(`${secs}s`);
  return parts.join(' ');
}

function sumIncremental(rows, from, to, keys) {
  const result = Object.fromEntries(keys.map((key) => [key, 0]));
  const start = Math.max(0, Number(from) + 1);
  const end = Math.min(rows.length - 1, Number(to));
  for (let i = start; i <= end; i += 1) {
    keys.forEach((key) => { result[key] += Number(rows[i]?.[key] || 0); });
  }
  return result;
}

function Field({ label, children, hint }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function Results({ children }) {
  return <div className={styles.results}>{children}</div>;
}

function SectionTitle({ title, text }) {
  return (
    <header className={styles.calcHead}>
      <h2>{title}</h2>
      <p>{text}</p>
    </header>
  );
}

function GovernorGearCalculator() {
  const [inventory, setInventory] = useState({ ...EMPTY_RESOURCES });
  const [plans, setPlans] = useState(() => Object.fromEntries(GOVERNOR_SLOTS.map((slot) => [slot.key, { enabled: false, from: 0, to: 1 }])));

  const totals = useMemo(() => GOVERNOR_SLOTS.reduce((acc, slot) => {
    const plan = plans[slot.key];
    if (!plan?.enabled || Number(plan.to) <= Number(plan.from)) return acc;
    const cost = sumIncremental(GOVERNOR_GEAR_STAGES, plan.from, plan.to, ['satin', 'threads', 'visions']);
    acc.satin += cost.satin;
    acc.threads += cost.threads;
    acc.visions += cost.visions;
    acc.pieces += 1;
    return acc;
  }, { satin: 0, threads: 0, visions: 0, pieces: 0 }), [plans]);

  function patchSlot(key, patch) {
    setPlans((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  return (
    <div>
      <SectionTitle title="Governor Gear" text="Price any combination of six Governor Gear pieces from their current stage to a target stage. All pieces use the same stage costs." />
      <div className={styles.inventoryGrid}>
        {['satin', 'threads', 'visions'].map((key) => (
          <Field key={key} label={`Owned ${key === 'visions' ? "Artisan's Vision" : key === 'threads' ? 'Gilded Threads' : 'Satin'}`}>
            <input type="number" min="0" value={inventory[key]} onChange={(e) => setInventory((x) => ({ ...x, [key]: e.target.value }))} />
          </Field>
        ))}
      </div>
      <div className={styles.planList}>
        {GOVERNOR_SLOTS.map((slot) => {
          const plan = plans[slot.key];
          return (
            <div className={styles.planRow} key={slot.key}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={plan.enabled} onChange={(e) => patchSlot(slot.key, { enabled: e.target.checked })} />
                <span><b>{slot.troop}</b>{slot.label}</span>
              </label>
              <select value={plan.from} disabled={!plan.enabled} onChange={(e) => {
                const from = Number(e.target.value);
                patchSlot(slot.key, { from, to: Math.max(from + 1, Number(plan.to)) });
              }}>
                {GOVERNOR_GEAR_STAGES.slice(0, -1).map((stage, index) => <option key={stage.label} value={index}>{stage.label}</option>)}
              </select>
              <span className={styles.arrow}>→</span>
              <select value={plan.to} disabled={!plan.enabled} onChange={(e) => patchSlot(slot.key, { to: Number(e.target.value) })}>
                {GOVERNOR_GEAR_STAGES.map((stage, index) => index > Number(plan.from) ? <option key={stage.label} value={index}>{stage.label}</option> : null)}
              </select>
            </div>
          );
        })}
      </div>
      <Results>
        <Metric label="Selected pieces" value={fmt(totals.pieces)} />
        <Metric label="Satin required" value={fmt(totals.satin)} note={`Short ${fmt(Math.max(0, totals.satin - n(inventory.satin)))}`} />
        <Metric label="Gilded Threads" value={fmt(totals.threads)} note={`Short ${fmt(Math.max(0, totals.threads - n(inventory.threads)))}`} />
        <Metric label="Artisan's Vision" value={fmt(totals.visions)} note={`Short ${fmt(Math.max(0, totals.visions - n(inventory.visions)))}`} />
      </Results>
    </div>
  );
}

function GovernorCharmCalculator() {
  const [owned, setOwned] = useState({ guides: 0, designs: 0 });
  const [plans, setPlans] = useState(() => Object.fromEntries(GOVERNOR_SLOTS.map((slot) => [slot.key, { enabled: false, from: 0, to: 1 }])));

  const totals = useMemo(() => GOVERNOR_SLOTS.reduce((acc, slot) => {
    const plan = plans[slot.key];
    if (!plan?.enabled || Number(plan.to) <= Number(plan.from)) return acc;
    const oneCharm = sumIncremental(CHARM_LEVELS, plan.from, plan.to, ['guides', 'designs']);
    acc.guides += oneCharm.guides * 3;
    acc.designs += oneCharm.designs * 3;
    acc.charms += 3;
    return acc;
  }, { guides: 0, designs: 0, charms: 0 }), [plans]);

  function patchSlot(key, patch) {
    setPlans((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  return (
    <div>
      <SectionTitle title="Governor Charms" text="Each Governor Gear piece carries three charms. Select the pieces you want to move and the calculator totals all three charm slots per piece through Level 22." />
      <div className={styles.inventoryGrid}>
        <Field label="Owned Charm Guides"><input type="number" min="0" value={owned.guides} onChange={(e) => setOwned((x) => ({ ...x, guides: e.target.value }))} /></Field>
        <Field label="Owned Charm Designs"><input type="number" min="0" value={owned.designs} onChange={(e) => setOwned((x) => ({ ...x, designs: e.target.value }))} /></Field>
      </div>
      <div className={styles.planList}>
        {GOVERNOR_SLOTS.map((slot) => {
          const plan = plans[slot.key];
          return (
            <div className={styles.planRow} key={slot.key}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={plan.enabled} onChange={(e) => patchSlot(slot.key, { enabled: e.target.checked })} />
                <span><b>{slot.troop}</b>{slot.label} · 3 charms</span>
              </label>
              <select value={plan.from} disabled={!plan.enabled} onChange={(e) => {
                const from = Number(e.target.value);
                patchSlot(slot.key, { from, to: Math.max(from + 1, Number(plan.to)) });
              }}>
                {CHARM_LEVELS.slice(0, -1).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}
              </select>
              <span className={styles.arrow}>→</span>
              <select value={plan.to} disabled={!plan.enabled} onChange={(e) => patchSlot(slot.key, { to: Number(e.target.value) })}>
                {CHARM_LEVELS.filter((row) => row.level > Number(plan.from)).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <Results>
        <Metric label="Charm slots" value={fmt(totals.charms)} />
        <Metric label="Charm Guides" value={fmt(totals.guides)} note={`Short ${fmt(Math.max(0, totals.guides - n(owned.guides)))}`} />
        <Metric label="Charm Designs" value={fmt(totals.designs)} note={`Short ${fmt(Math.max(0, totals.designs - n(owned.designs)))}`} />
      </Results>
    </div>
  );
}

function HeroShardCalculator() {
  const [state, setState] = useState({ from: 0, to: HERO_SHARD_STEPS.length - 1, specific: 0, general: 0 });
  const required = useMemo(() => sumIncremental(HERO_SHARD_STEPS, state.from, state.to, ['cost']).cost, [state.from, state.to]);
  const specificUsed = Math.min(required, n(state.specific));
  const afterSpecific = Math.max(0, required - specificUsed);
  const generalUsed = Math.min(afterSpecific, n(state.general));
  const short = Math.max(0, afterSpecific - generalUsed);

  return (
    <div>
      <SectionTitle title="Hero Shards" text="Calculate the exact shard requirement from any star sub-tier to a target. General shards fill only the remaining gap after hero-specific shards." />
      <div className={styles.controlGrid}>
        <Field label="Current state"><select value={state.from} onChange={(e) => setState((x) => ({ ...x, from: Number(e.target.value), to: Math.max(Number(e.target.value) + 1, x.to) }))}>{HERO_SHARD_STEPS.slice(0, -1).map((row, i) => <option key={row.label} value={i}>{row.label}</option>)}</select></Field>
        <Field label="Target state"><select value={state.to} onChange={(e) => setState((x) => ({ ...x, to: Number(e.target.value) }))}>{HERO_SHARD_STEPS.map((row, i) => i > state.from ? <option key={row.label} value={i}>{row.label}</option> : null)}</select></Field>
        <Field label="Hero-specific shards owned"><input type="number" min="0" value={state.specific} onChange={(e) => setState((x) => ({ ...x, specific: e.target.value }))} /></Field>
        <Field label="General shards available"><input type="number" min="0" value={state.general} onChange={(e) => setState((x) => ({ ...x, general: e.target.value }))} /></Field>
      </div>
      <Results>
        <Metric label="Total shards needed" value={fmt(required)} />
        <Metric label="Specific used" value={fmt(specificUsed)} />
        <Metric label="General used" value={fmt(generalUsed)} />
        <Metric label="Still missing" value={fmt(short)} note={short === 0 ? 'Target covered' : 'No allocation optimizer is applied'} />
      </Results>
    </div>
  );
}

function HeroWidgetCalculator() {
  const [state, setState] = useState({ from: 0, to: 10, specific: 0, general: 0 });
  const needed = useMemo(() => WIDGET_COSTS.slice(Number(state.from) + 1, Number(state.to) + 1).reduce((sum, value) => sum + value, 0), [state.from, state.to]);
  const specificUsed = Math.min(needed, n(state.specific));
  const generalUsed = Math.min(Math.max(0, needed - specificUsed), n(state.general));
  const short = Math.max(0, needed - specificUsed - generalUsed);

  return (
    <div>
      <SectionTitle title="Hero Widgets" text="Plan Mythic Hero Exclusive Gear widget levels without any generic-widget allocation algorithm. A full Level 0 → 10 push costs 275 widgets." />
      <div className={styles.controlGrid}>
        <Field label="Current widget level"><select value={state.from} onChange={(e) => setState((x) => ({ ...x, from: Number(e.target.value), to: Math.max(Number(e.target.value) + 1, x.to) }))}>{WIDGET_COSTS.slice(0, -1).map((_, i) => <option key={i} value={i}>Level {i}</option>)}</select></Field>
        <Field label="Target widget level"><select value={state.to} onChange={(e) => setState((x) => ({ ...x, to: Number(e.target.value) }))}>{WIDGET_COSTS.map((_, i) => i > state.from ? <option key={i} value={i}>Level {i}</option> : null)}</select></Field>
        <Field label="Hero-specific widgets"><input type="number" min="0" value={state.specific} onChange={(e) => setState((x) => ({ ...x, specific: e.target.value }))} /></Field>
        <Field label="Generic widgets for generation"><input type="number" min="0" value={state.general} onChange={(e) => setState((x) => ({ ...x, general: e.target.value }))} /></Field>
      </div>
      <Results>
        <Metric label="Widgets required" value={fmt(needed)} />
        <Metric label="Specific used" value={fmt(specificUsed)} />
        <Metric label="Generic used" value={fmt(generalUsed)} />
        <Metric label="Still missing" value={fmt(short)} />
      </Results>
    </div>
  );
}

function HeroXpCalculator() {
  const [state, setState] = useState({ from: 1, to: 80, owned: 0 });
  const xp = useMemo(() => HERO_XP_PER_LEVEL.slice(Number(state.from) + 1, Number(state.to) + 1).reduce((sum, value) => sum + value, 0), [state.from, state.to]);
  const short = Math.max(0, xp - n(state.owned));
  return (
    <div>
      <SectionTitle title="Hero XP" text="Total Hero XP between any two levels through Level 80, with the Town Center gate for the target and the 80% Drill Camp spillover reference." />
      <div className={styles.controlGrid}>
        <Field label="Current hero level"><select value={state.from} onChange={(e) => setState((x) => ({ ...x, from: Number(e.target.value), to: Math.max(Number(e.target.value) + 1, x.to) }))}>{HERO_XP_PER_LEVEL.slice(1, -1).map((_, i) => <option key={i + 1} value={i + 1}>Level {i + 1}</option>)}</select></Field>
        <Field label="Target hero level"><select value={state.to} onChange={(e) => setState((x) => ({ ...x, to: Number(e.target.value) }))}>{HERO_XP_PER_LEVEL.map((_, i) => i > state.from ? <option key={i} value={i}>Level {i}</option> : null)}</select></Field>
        <Field label="Hero XP owned"><input type="number" min="0" value={state.owned} onChange={(e) => setState((x) => ({ ...x, owned: e.target.value }))} /></Field>
      </div>
      <Results>
        <Metric label="Hero XP required" value={fmt(xp)} note={`Short ${fmt(short)}`} />
        <Metric label="Town Center gate" value={`TC ${townCenterForHeroLevel(Number(state.to))}`} />
        <Metric label="80% spillover equivalent" value={fmt(Math.floor(xp * 0.8))} note="Reference amount at the Drill Camp spillover rate" />
      </Results>
    </div>
  );
}

function HeroGearCalculator() {
  const [state, setState] = useState({ from: 0, to: 100, xp: 0, mithril: 0, mythic: 0 });
  const fromRow = HERO_GEAR_MILESTONES.find((row) => row.level === Number(state.from));
  const toRow = HERO_GEAR_MILESTONES.find((row) => row.level === Number(state.to));
  const xpNeeded = Math.max(0, Number(toRow?.cumulativeXp || 0) - Number(fromRow?.cumulativeXp || 0));
  const red = useMemo(() => {
    const current = Number(state.from);
    const target = Number(state.to);
    let mithril = 0;
    let mythicGear = 0;
    if (current <= 100 && target > 100) mythicGear += 2;
    RED_GEAR_BLOCKS.forEach((block) => {
      if (current < block.to && target >= block.to) {
        mithril += block.mithril;
        mythicGear += block.mythicGear;
      }
    });
    return { mithril, mythicGear };
  }, [state.from, state.to]);

  return (
    <div>
      <SectionTitle title="Hero Gear Enhancement" text="Enhancement XP plus Red Gear Mithril / Mythic Gear gates. To avoid interpolating unverified values, enhancement choices use verified progression milestones." />
      <div className={styles.controlGrid}>
        <Field label="Current enhancement"><select value={state.from} onChange={(e) => setState((x) => ({ ...x, from: Number(e.target.value), to: Math.max(Number(e.target.value), x.to) }))}>{HERO_GEAR_MILESTONES.slice(0, -1).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}</select></Field>
        <Field label="Target enhancement"><select value={state.to} onChange={(e) => setState((x) => ({ ...x, to: Number(e.target.value) }))}>{HERO_GEAR_MILESTONES.filter((row) => row.level > Number(state.from)).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}</select></Field>
        <Field label="Enhancement XP owned"><input type="number" min="0" value={state.xp} onChange={(e) => setState((x) => ({ ...x, xp: e.target.value }))} /></Field>
        <Field label="Mithril owned"><input type="number" min="0" value={state.mithril} onChange={(e) => setState((x) => ({ ...x, mithril: e.target.value }))} /></Field>
        <Field label="Mythic Gear fodder owned"><input type="number" min="0" value={state.mythic} onChange={(e) => setState((x) => ({ ...x, mythic: e.target.value }))} /></Field>
      </div>
      <Results>
        <Metric label="Enhancement XP" value={fmt(xpNeeded)} note={`Short ${fmt(Math.max(0, xpNeeded - n(state.xp)))}`} />
        <Metric label="Mithril" value={fmt(red.mithril)} note={`Short ${fmt(Math.max(0, red.mithril - n(state.mithril)))}`} />
        <Metric label="Mythic Gear" value={fmt(red.mythicGear)} note={`Short ${fmt(Math.max(0, red.mythicGear - n(state.mythic)))}`} />
      </Results>
      {Number(state.to) > 100 ? <p className={styles.footnote}>Red Gear imbuement requires Mythic gear at Level 100 / Mastery 10. Block materials are counted when your target crosses each 120/140/160/180/200 breakpoint.</p> : null}
    </div>
  );
}

function ForgehammerCalculator() {
  const [mode, setMode] = useState('set');
  const [setState, setSetState] = useState({ from: 0, to: 10, pieces: 6, hammers: 0, mythic: 0 });
  const [budget, setBudget] = useState({ stock: 0, income: 0, spend: 0, reserve: 0, points: 0, packHammers: 0, packPrice: 0 });

  const setTotals = useMemo(() => {
    const one = sumIncremental(MASTERY_LEVELS, setState.from, setState.to, ['hammers', 'mythicGear']);
    const pieces = Math.min(6, Math.max(1, whole(setState.pieces) || 1));
    return { hammers: one.hammers * pieces, mythicGear: one.mythicGear * pieces, pieces };
  }, [setState]);

  const available = n(budget.stock) + n(budget.income);
  const protectedNeed = n(budget.spend) + n(budget.reserve);
  const gap = Math.max(0, protectedNeed - available);
  const packCount = n(budget.packHammers) > 0 ? Math.ceil(gap / n(budget.packHammers)) : 0;

  return (
    <div>
      <SectionTitle title="Forgehammer & Mastery" text="Use Set Cost for deterministic Hero Gear Mastery costs, or Budget to test stock + projected income against a planned spend and protected reserve." />
      <div className={styles.segmented}>
        <button type="button" className={mode === 'set' ? styles.activeSegment : ''} onClick={() => setMode('set')}>Set cost</button>
        <button type="button" className={mode === 'budget' ? styles.activeSegment : ''} onClick={() => setMode('budget')}>Hammer budget</button>
      </div>
      {mode === 'set' ? (
        <>
          <div className={styles.controlGrid}>
            <Field label="Current Mastery"><select value={setState.from} onChange={(e) => setSetState((x) => ({ ...x, from: Number(e.target.value), to: Math.max(Number(e.target.value) + 1, x.to) }))}>{MASTERY_LEVELS.slice(0, -1).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}</select></Field>
            <Field label="Target Mastery"><select value={setState.to} onChange={(e) => setSetState((x) => ({ ...x, to: Number(e.target.value) }))}>{MASTERY_LEVELS.filter((row) => row.level > Number(setState.from)).map((row) => <option key={row.level} value={row.level}>Level {row.level}</option>)}</select></Field>
            <Field label="Gear pieces (1–6)"><input type="number" min="1" max="6" value={setState.pieces} onChange={(e) => setSetState((x) => ({ ...x, pieces: e.target.value }))} /></Field>
            <Field label="Forgehammers owned"><input type="number" min="0" value={setState.hammers} onChange={(e) => setSetState((x) => ({ ...x, hammers: e.target.value }))} /></Field>
            <Field label="Mythic Gear owned"><input type="number" min="0" value={setState.mythic} onChange={(e) => setSetState((x) => ({ ...x, mythic: e.target.value }))} /></Field>
          </div>
          <Results>
            <Metric label="Pieces" value={setTotals.pieces} />
            <Metric label="Forgehammers" value={fmt(setTotals.hammers)} note={`Short ${fmt(Math.max(0, setTotals.hammers - n(setState.hammers)))}`} />
            <Metric label="Mythic Gear" value={fmt(setTotals.mythicGear)} note={`Short ${fmt(Math.max(0, setTotals.mythicGear - n(setState.mythic)))}`} />
          </Results>
        </>
      ) : (
        <>
          <div className={styles.controlGrid}>
            <Field label="Current hammer stock"><input type="number" min="0" value={budget.stock} onChange={(e) => setBudget((x) => ({ ...x, stock: e.target.value }))} /></Field>
            <Field label="Projected hammer income"><input type="number" min="0" value={budget.income} onChange={(e) => setBudget((x) => ({ ...x, income: e.target.value }))} /></Field>
            <Field label="Planned hammer spend"><input type="number" min="0" value={budget.spend} onChange={(e) => setBudget((x) => ({ ...x, spend: e.target.value }))} /></Field>
            <Field label="Reserve to protect"><input type="number" min="0" value={budget.reserve} onChange={(e) => setBudget((x) => ({ ...x, reserve: e.target.value }))} /></Field>
            <Field label="Event points per hammer"><input type="number" min="0" value={budget.points} onChange={(e) => setBudget((x) => ({ ...x, points: e.target.value }))} /></Field>
            <Field label="Hammers per optional pack"><input type="number" min="0" value={budget.packHammers} onChange={(e) => setBudget((x) => ({ ...x, packHammers: e.target.value }))} /></Field>
            <Field label="Optional pack price"><input type="number" min="0" step="0.01" value={budget.packPrice} onChange={(e) => setBudget((x) => ({ ...x, packPrice: e.target.value }))} /></Field>
          </div>
          <Results>
            <Metric label="Available" value={fmt(available)} />
            <Metric label="Spend + reserve" value={fmt(protectedNeed)} />
            <Metric label="Hammer gap" value={fmt(gap)} note={gap === 0 ? 'Plan is covered' : 'Additional hammers required'} />
            <Metric label="Event points" value={fmt(n(budget.spend) * n(budget.points))} />
            <Metric label="Optional packs" value={fmt(packCount)} note={packCount && n(budget.packPrice) ? `Estimated ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(packCount * n(budget.packPrice))}` : ''} />
          </Results>
        </>
      )}
    </div>
  );
}

function TroopCalculator() {
  const [state, setState] = useState({ mode: 'train', troop: 'infantry', tier: 10, fromTier: 9, inputMode: 'qty', quantity: 1000, speedupMinutes: 60, speed: 0 });
  const table = TROOP_DATA[state.troop];
  const target = table[Number(state.tier)];
  const source = state.mode === 'promote' ? table[Number(state.fromTier)] : null;
  const perUnit = useMemo(() => {
    const keys = ['bread', 'wood', 'stone', 'iron', 'seconds', 'power', 'kvk', 'hog', 'sg'];
    const output = {};
    keys.forEach((key) => { output[key] = Math.max(0, Number(target?.[key] || 0) - Number(source?.[key] || 0)); });
    return output;
  }, [target, source]);
  const adjustedPerUnit = perUnit.seconds / (1 + n(state.speed) / 100);
  const count = state.inputMode === 'qty' ? whole(state.quantity) : Math.floor((n(state.speedupMinutes) * 60) / Math.max(adjustedPerUnit, 0.0001));

  return (
    <div>
      <SectionTitle title="Troop Training" text="Train or promote Infantry, Cavalry, and Archers from T1–T11. Quantity mode totals the bill; Speedup mode works backwards from your available training time." />
      <div className={styles.segmented}>
        <button type="button" className={state.mode === 'train' ? styles.activeSegment : ''} onClick={() => setState((x) => ({ ...x, mode: 'train' }))}>Train</button>
        <button type="button" className={state.mode === 'promote' ? styles.activeSegment : ''} onClick={() => setState((x) => ({ ...x, mode: 'promote', fromTier: Math.min(x.fromTier, x.tier - 1) }))}>Promote</button>
      </div>
      <div className={styles.controlGrid}>
        <Field label="Troop type"><select value={state.troop} onChange={(e) => setState((x) => ({ ...x, troop: e.target.value }))}><option value="infantry">Infantry</option><option value="cavalry">Cavalry</option><option value="archer">Archer</option></select></Field>
        {state.mode === 'promote' ? <Field label="Promote from"><select value={state.fromTier} onChange={(e) => setState((x) => ({ ...x, fromTier: Number(e.target.value), tier: Math.max(Number(e.target.value) + 1, x.tier) }))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((tier) => <option key={tier} value={tier}>T{tier}</option>)}</select></Field> : null}
        <Field label={state.mode === 'promote' ? 'Promote to' : 'Training tier'}><select value={state.tier} onChange={(e) => setState((x) => ({ ...x, tier: Number(e.target.value), fromTier: Math.min(x.fromTier, Number(e.target.value) - 1) }))}>{Array.from({ length: 11 }, (_, i) => i + 1).filter((tier) => state.mode !== 'promote' || tier > state.fromTier).map((tier) => <option key={tier} value={tier}>T{tier}</option>)}</select></Field>
        <Field label="Training Speed %"><input type="number" min="0" value={state.speed} onChange={(e) => setState((x) => ({ ...x, speed: e.target.value }))} /></Field>
      </div>
      <div className={styles.segmented}>
        <button type="button" className={state.inputMode === 'qty' ? styles.activeSegment : ''} onClick={() => setState((x) => ({ ...x, inputMode: 'qty' }))}>Quantity</button>
        <button type="button" className={state.inputMode === 'speedup' ? styles.activeSegment : ''} onClick={() => setState((x) => ({ ...x, inputMode: 'speedup' }))}>Speedup budget</button>
      </div>
      <div className={styles.controlGrid}>
        {state.inputMode === 'qty' ? <Field label="Troop quantity"><input type="number" min="0" value={state.quantity} onChange={(e) => setState((x) => ({ ...x, quantity: e.target.value }))} /></Field> : <Field label="Training speedups (minutes)"><input type="number" min="0" value={state.speedupMinutes} onChange={(e) => setState((x) => ({ ...x, speedupMinutes: e.target.value }))} /></Field>}
      </div>
      <Results>
        <Metric label="Troops" value={fmt(count)} />
        <Metric label="Bread" value={fmt(perUnit.bread * count)} />
        <Metric label="Wood" value={fmt(perUnit.wood * count)} />
        <Metric label="Stone" value={fmt(perUnit.stone * count)} />
        <Metric label="Iron" value={fmt(perUnit.iron * count)} />
        <Metric label="Base time" value={formatDuration(perUnit.seconds * count)} />
        <Metric label="Adjusted time" value={formatDuration(adjustedPerUnit * count)} note={`${fmt(state.speed)}% training speed`} />
        <Metric label="Power gain" value={fmt(perUnit.power * count)} />
        <Metric label="Kingdom of Power" value={fmt(perUnit.kvk * count)} />
        <Metric label="Strongest Governor" value={fmt(perUnit.sg * count)} />
        <Metric label="Hall of Governors" value={fmt(perUnit.hog * count)} note={Number(state.tier) === 11 ? 'T11 HoG rate not published in this dataset' : ''} />
      </Results>
    </div>
  );
}

function VipCalculator() {
  const [state, setState] = useState({ current: 0, target: 100000, reserve: 0, daily: 0, weekly: 0, deadline: 30 });
  const gap = Math.max(0, n(state.target) - n(state.current));
  const afterReserve = Math.max(0, gap - n(state.reserve));
  const dailyRate = n(state.daily) + n(state.weekly) / 7;
  const days = afterReserve === 0 ? 0 : dailyRate > 0 ? Math.ceil(afterReserve / dailyRate) : null;
  const deadline = Math.max(1, whole(state.deadline) || 1);
  const weeklyWindows = Math.max(1, deadline / 7);
  const weeklyNeededForDeadline = Math.max(0, (afterReserve - n(state.daily) * deadline) / weeklyWindows);

  return (
    <div>
      <SectionTitle title="VIP Progress" text="A points-based VIP timeline calculator. Enter the exact current and target VIP point totals shown in game; no spending recommendation or VIP-level lookup is applied." />
      <div className={styles.controlGrid}>
        <Field label="Current VIP points"><input type="number" min="0" value={state.current} onChange={(e) => setState((x) => ({ ...x, current: e.target.value }))} /></Field>
        <Field label="Target VIP points"><input type="number" min="0" value={state.target} onChange={(e) => setState((x) => ({ ...x, target: e.target.value }))} /></Field>
        <Field label="Reserve points already held"><input type="number" min="0" value={state.reserve} onChange={(e) => setState((x) => ({ ...x, reserve: e.target.value }))} /></Field>
        <Field label="Expected daily VIP points"><input type="number" min="0" value={state.daily} onChange={(e) => setState((x) => ({ ...x, daily: e.target.value }))} /></Field>
        <Field label="Additional weekly points"><input type="number" min="0" value={state.weekly} onChange={(e) => setState((x) => ({ ...x, weekly: e.target.value }))} /></Field>
        <Field label="Optional deadline (days)"><input type="number" min="1" value={state.deadline} onChange={(e) => setState((x) => ({ ...x, deadline: e.target.value }))} /></Field>
      </div>
      <Results>
        <Metric label="Raw gap" value={fmt(gap)} />
        <Metric label="Gap after reserve" value={fmt(afterReserve)} />
        <Metric label="Projected timeline" value={days === null ? 'No income entered' : `${fmt(days)} days`} />
        <Metric label="Weekly points needed for deadline" value={fmt(Math.ceil(weeklyNeededForDeadline))} note={`To target within ${deadline} days after daily gain`} />
      </Results>
    </div>
  );
}

const RENDERERS = {
  'governor-gear': GovernorGearCalculator,
  'governor-charms': GovernorCharmCalculator,
  'hero-shards': HeroShardCalculator,
  'hero-widgets': HeroWidgetCalculator,
  'hero-xp': HeroXpCalculator,
  'hero-gear': HeroGearCalculator,
  forgehammer: ForgehammerCalculator,
  troops: TroopCalculator,
  vip: VipCalculator,
};

export default function CalculatorSuite() {
  const [active, setActive] = useState('governor-gear');
  const ActiveCalculator = RENDERERS[active];
  return (
    <section className={styles.suite}>
      <nav className={styles.calcNav} aria-label="Calculator list">
        {CALCULATORS.map(([key, title, detail]) => (
          <button key={key} type="button" className={active === key ? styles.activeCalc : ''} onClick={() => setActive(key)}>
            <span>{title}</span>
            <small>{detail}</small>
          </button>
        ))}
      </nav>
      <div className={styles.workbench}>
        <ActiveCalculator />
        <div className={styles.sourceNote}>
          <strong>Calculator-only build.</strong> This suite performs deterministic cost, time, material, shortfall, and points math. It intentionally does not recommend which upgrade, hero, research lane, pack, or allocation is “best.” Game values can change after patches; the in-game screen remains the final authority.
        </div>
      </div>
    </section>
  );
}

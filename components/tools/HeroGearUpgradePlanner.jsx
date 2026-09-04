'use client';
import { useState } from 'react';
import { GOVERNOR_GEAR_OPTIONS, HERO_GEAR_PIECE_SLOTS, calculateHeroGearUpgradeAll } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();

function blankSelections() {
  return Object.fromEntries(HERO_GEAR_PIECE_SLOTS.map((s) => [s.key, { current: GOVERNOR_GEAR_OPTIONS[0], target: GOVERNOR_GEAR_OPTIONS[0] }]));
}

function groupByHero(slots) {
  const groups = [];
  slots.forEach((slot) => {
    let group = groups.find((g) => g.heroKey === slot.heroKey);
    if (!group) { group = { heroKey: slot.heroKey, heroLabel: slot.heroLabel, pieces: [] }; groups.push(group); }
    group.pieces.push(slot);
  });
  return groups;
}

export default function HeroGearUpgradePlanner() {
  const [selections, setSelections] = useState(blankSelections());
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const groups = groupByHero(HERO_GEAR_PIECE_SLOTS);

  function update(key, field, value) {
    setResult(null);
    setSelections((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function calculate() {
    setError('');
    try {
      setResult(calculateHeroGearUpgradeAll(selections));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Hero Gear</span><strong>All 12 pieces · 3 heroes × 4 pieces</strong></div>
        <span role="status">Reference data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          {groups.map((group) => (
            <section className={styles.panel} key={group.heroKey}>
              <div className={styles.sectionHead}><div><span className={styles.eyebrow}>{group.heroLabel}</span><h2>Helmet, Boots, Chest &amp; Arm</h2></div></div>
              <div className={styles.selections}>
                {group.pieces.map((s) => (
                  <div className={styles.selection} key={s.key}>
                    <div><strong>{s.pieceLabel}</strong><small>{s.stat}</small></div>
                    <label>Current
                      <select value={selections[s.key].current} onChange={(e) => update(s.key, 'current', e.target.value)}>
                        {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <span className={styles.arrow}>→</span>
                    <label>Target
                      <select value={selections[s.key].target} onChange={(e) => update(s.key, 'target', e.target.value)}>
                        {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <p className={styles.hint}>Leave a piece&apos;s current and target tier the same to skip it. Helmet and Boots feed Lethality; Chest and Arm feed Health.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={calculate}>Calculate upgrade plan</button>
          </div>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Calculated result</span><h2>Upgrade plan</h2></div>
          {error && <p role="alert" className={styles.warning}>{error}</p>}
          {result ? (
            <section className={styles.results} aria-label="Calculation results" aria-live="polite">
              <div className={styles.metrics}>
                <div><span>Upgrade steps</span><strong>{result.stepCount}</strong><small>Across {result.byPiece.length} of 12 pieces</small></div>
                <div><span>Mythic Gear pieces</span><strong>{fmt(result.totals.mythicGear)}</strong><small>Estimated</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Materials needed for the full plan</caption>
                  <thead><tr><th>Resource</th><th>Required</th></tr></thead>
                  <tbody>
                    <tr><th>Hero XP</th><td>{fmt(result.totals.xp)}</td></tr>
                    <tr><th>Mithril</th><td>{fmt(result.totals.mithril)}</td></tr>
                    <tr><th>Forgehammers</th><td>{fmt(result.totals.forgehammers)}</td></tr>
                    <tr><th>Mythic Gear pieces</th><td>{fmt(result.totals.mythicGear)}</td></tr>
                  </tbody>
                </table>
              </div>
              <details className={styles.details} open>
                <summary>Piece-by-piece breakdown ({result.byPiece.length} pieces)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Piece</th><th>XP</th><th>Mithril</th><th>Forgehammers</th><th>Mythic</th></tr></thead>
                    <tbody>
                      {result.byPiece.map((s) => (
                        <tr key={s.key}><th>{s.label}<small>{s.current} → {s.target}</small></th><td>{fmt(s.totals.xp)}</td><td>{fmt(s.totals.mithril)}</td><td>{fmt(s.totals.forgehammers)}</td><td>{s.totals.mythicGear || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Set a current and target tier for one or more of the 12 hero gear pieces, then calculate.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Hero gear structure: 3 heroes (Infantry, Archer, Cavalry) x 4 pieces (Helmet, Boots, Chest, Arm), confirmed by the site owner. Material amounts are illustrative placeholders pending a verified Kingshot cost table — confirm exact quantities in-game before spending.</footer>
    </div>
  );
}

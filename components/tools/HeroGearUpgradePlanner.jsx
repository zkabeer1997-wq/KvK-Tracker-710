'use client';
import { useState } from 'react';
import { HERO_GEAR_PIECE_SLOTS, HERO_GEAR_MASTERY_MAX_LEVEL, calculateHeroGearUpgradeAll } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();
const MASTERY_LEVELS = Array.from({ length: HERO_GEAR_MASTERY_MAX_LEVEL + 1 }, (_, i) => i);

function blankSelections() {
  return Object.fromEntries(HERO_GEAR_PIECE_SLOTS.map((s) => [s.key, { current: 0, target: 0 }]));
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
    setSelections((prev) => ({ ...prev, [key]: { ...prev[key], [field]: Number(value) } }));
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
        <div><span className="k-mark">Hero Gear</span><strong>All 12 pieces · Mastery +0 to +{HERO_GEAR_MASTERY_MAX_LEVEL}</strong></div>
        <span role="status">Forgehammer formula verified · Mythic Gear split estimated</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          {groups.map((group) => (
            <section className={styles.panel} key={group.heroKey}>
              <div className={styles.sectionHead}><div><span className={styles.eyebrow}>{group.heroLabel}</span><h2>Helmet, Boots, Chest &amp; Gloves</h2></div></div>
              <div className={styles.selections}>
                {group.pieces.map((s) => (
                  <div className={styles.selection} key={s.key}>
                    <div><strong>{s.pieceLabel}</strong><small>{s.stat}</small></div>
                    <label>Current
                      <select value={selections[s.key].current} onChange={(e) => update(s.key, 'current', e.target.value)}>
                        {MASTERY_LEVELS.map((l) => <option key={l} value={l}>{l === 0 ? 'Not started' : `Mastery +${l}`}</option>)}
                      </select>
                    </label>
                    <span className={styles.arrow}>→</span>
                    <label>Target
                      <select value={selections[s.key].target} onChange={(e) => update(s.key, 'target', e.target.value)}>
                        {MASTERY_LEVELS.map((l) => <option key={l} value={l}>{l === 0 ? 'Not started' : `Mastery +${l}`}</option>)}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <p className={styles.hint}>Leave a piece&apos;s current and target Mastery level the same to skip it. Helmet and Boots feed Lethality; Chest and Gloves feed Health.</p>
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
                <div><span>Mastery levels to gain</span><strong>{result.stepCount}</strong><small>Across {result.byPiece.length} of 12 pieces</small></div>
                <div><span>Mythic Gear pieces</span><strong>{fmt(result.totals.mythicGear)}</strong><small>Of 55 max per piece</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Materials needed for the full plan</caption>
                  <thead><tr><th>Resource</th><th>Required</th></tr></thead>
                  <tbody>
                    <tr><th>Forgehammers</th><td>{fmt(result.totals.forgehammers)}</td></tr>
                    <tr><th>Mythic Gear pieces</th><td>{fmt(result.totals.mythicGear)}</td></tr>
                  </tbody>
                </table>
              </div>
              <details className={styles.details} open>
                <summary>Piece-by-piece breakdown ({result.byPiece.length} pieces)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Piece</th><th>Forgehammers</th><th>Mythic Gear</th></tr></thead>
                    <tbody>
                      {result.byPiece.map((s) => (
                        <tr key={s.key}><th>{s.label}<small>Mastery +{s.current} → +{s.target}</small></th><td>{fmt(s.totals.forgehammers)}</td><td>{fmt(s.totals.mythicGear)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Set a current and target Mastery level for one or more of the 12 hero gear pieces, then calculate.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Hero gear structure (3 heroes x 4 pieces) and the Mastery forging Forgehammer formula (10 x level, matching the published 550-at-+10 / 2,100-at-+20 milestones) are verified via current Kingshot community references. The 55-piece Mythic Gear total per piece at +20 is verified; its exact per-level split is not published, so it is spread evenly here.</footer>
    </div>
  );
}

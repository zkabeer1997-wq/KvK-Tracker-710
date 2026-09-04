'use client';
import { useState } from 'react';
import { HEROES } from '../../lib/playerCombatOptions.mjs';
import { HERO_GEAR_MAX_LEVEL, calculateHeroGearUpgrade } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();
const LEVELS = Array.from({ length: HERO_GEAR_MAX_LEVEL }, (_, i) => i + 1);

export default function HeroGearUpgradePlanner() {
  const [hero, setHero] = useState(HEROES[0]);
  const [current, setCurrent] = useState(1);
  const [target, setTarget] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    try {
      setResult(calculateHeroGearUpgrade(current, target));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Hero Gear</span><strong>{HEROES.length} heroes tracked</strong></div>
        <span role="status">Reference data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Upgrade plan</span><h2>Which hero gear?</h2></div></div>
            <div className={styles.fields}>
              <label>Hero
                <select value={hero} onChange={(e) => setHero(e.target.value)}>
                  {HEROES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              <label>Current level
                <select value={current} onChange={(e) => { setResult(null); setCurrent(Number(e.target.value)); }}>
                  {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </label>
              <label>Target level
                <select value={target} onChange={(e) => { setResult(null); setTarget(Number(e.target.value)); }}>
                  {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.hint}>Mithril unlocks at level 10, Forgehammers at level 20, and Mythic Gear pieces are needed every other level from 30 onward.</p>
          </section>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={calculate}>Calculate upgrade plan</button>
          </div>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Calculated result</span><h2>{hero}&apos;s upgrade plan</h2></div>
          {error && <p role="alert" className={styles.warning}>{error}</p>}
          {result ? (
            <section className={styles.results} aria-label="Calculation results" aria-live="polite">
              <div className={styles.metrics}>
                <div><span>Levels to gain</span><strong>{result.stepCount}</strong><small>{hero}</small></div>
                <div><span>Stat gain</span><strong>+{fmt(result.totals.statGain)}%</strong><small>Estimated</small></div>
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
              <details className={styles.details}>
                <summary>Level-by-level breakdown ({result.steps.length} steps)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Level</th><th>XP</th><th>Mithril</th><th>Forgehammers</th><th>Mythic</th></tr></thead>
                    <tbody>
                      {result.steps.map((s) => (
                        <tr key={s.level}><th>{s.level} → {s.nextLevel}</th><td>{fmt(s.xp)}</td><td>{fmt(s.mithril)}</td><td>{fmt(s.forgehammers)}</td><td>{s.mythicGear || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Choose a hero, current and target level, then calculate.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Hero list: K710Hub&apos;s player-record combat options. Level costs and stat gains are illustrative placeholders pending a verified Kingshot cost table — confirm exact quantities in-game before spending.</footer>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { GOVERNOR_GEAR_OPTIONS, GOVERNOR_GEAR_SLOT_LABELS, calculateGovernorGearUpgrade } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();

export default function GovernorGearUpgradePlanner() {
  const [slot, setSlot] = useState(GOVERNOR_GEAR_SLOT_LABELS[0].key);
  const [current, setCurrent] = useState(GOVERNOR_GEAR_OPTIONS[0]);
  const [target, setTarget] = useState(GOVERNOR_GEAR_OPTIONS[5]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    try {
      setResult(calculateGovernorGearUpgrade(current, target));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Governor Gear</span><strong>{GOVERNOR_GEAR_OPTIONS.length} tracked gear tiers</strong></div>
        <span role="status">Reference data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Upgrade plan</span><h2>Which gear piece?</h2></div></div>
            <div className={styles.fields}>
              <label>Gear slot
                <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                  {GOVERNOR_GEAR_SLOT_LABELS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <label>Current tier
                <select value={current} onChange={(e) => { setResult(null); setCurrent(e.target.value); }}>
                  {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Target tier
                <select value={target} onChange={(e) => { setResult(null); setTarget(e.target.value); }}>
                  {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <p className={styles.hint}>Pick the slot you are planning (used for your own reference only — costs depend solely on the tier gap) then choose the current and target tier from the full Green → Red T6 progression.</p>
          </section>
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
                <div><span>Upgrade steps</span><strong>{result.stepCount}</strong><small>{GOVERNOR_GEAR_SLOT_LABELS.find((s) => s.key === slot)?.label}</small></div>
                <div><span>Power gained</span><strong>{fmt(result.totals.power)}</strong><small>Estimated</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Materials needed for the full plan</caption>
                  <thead><tr><th>Resource</th><th>Required</th></tr></thead>
                  <tbody>
                    <tr><th>Satin</th><td>{fmt(result.totals.satin)}</td></tr>
                    <tr><th>Gilded Thread</th><td>{fmt(result.totals.gildedThread)}</td></tr>
                    <tr><th>Artisan&apos;s Vision</th><td>{fmt(result.totals.artisansVision)}</td></tr>
                  </tbody>
                </table>
              </div>
              <details className={styles.details}>
                <summary>Tier-by-tier breakdown ({result.steps.length} steps)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Upgrade</th><th>Satin</th><th>Gilded Thread</th><th>Artisan&apos;s Vision</th><th>Power</th></tr></thead>
                    <tbody>
                      {result.steps.map((s, i) => (
                        <tr key={i}><th>{s.from} → {s.to}</th><td>{fmt(s.satin)}</td><td>{fmt(s.gildedThread)}</td><td>{fmt(s.artisansVision)}</td><td>{fmt(s.power)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Choose a current and target tier, then calculate to see materials and power gain.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Gear tier progression: verified against K710Hub&apos;s Governor Profile scanner. Material amounts and power gain are illustrative placeholders pending a verified Kingshot cost table — confirm exact quantities in-game before spending.</footer>
    </div>
  );
}

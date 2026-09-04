'use client';
import { useState } from 'react';
import { GOVERNOR_GEAR_OPTIONS, GOVERNOR_GEAR_SLOT_LABELS, calculateGovernorGearUpgradeAll } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();

function blankSelections() {
  return Object.fromEntries(GOVERNOR_GEAR_SLOT_LABELS.map((s) => [s.key, { current: GOVERNOR_GEAR_OPTIONS[0], target: GOVERNOR_GEAR_OPTIONS[0] }]));
}

export default function GovernorGearUpgradePlanner() {
  const [selections, setSelections] = useState(blankSelections());
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function update(key, field, value) {
    setResult(null);
    setSelections((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function calculate() {
    setError('');
    try {
      setResult(calculateGovernorGearUpgradeAll(selections));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Governor Gear</span><strong>All 6 pieces · {GOVERNOR_GEAR_OPTIONS.length} tracked gear tiers</strong></div>
        <span role="status">Costs calibrated to a verified reference point</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Upgrade plan</span><h2>Set every gear piece</h2></div></div>
            <div className={styles.selections}>
              {GOVERNOR_GEAR_SLOT_LABELS.map((s) => (
                <div className={styles.selection} key={s.key}>
                  <div><strong>{s.label}</strong></div>
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
            <p className={styles.hint}>Leave a piece&apos;s current and target tier the same to skip it. Set a higher target for any of the 6 slots to include it in the plan.</p>
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
                <div><span>Upgrade steps</span><strong>{result.stepCount}</strong><small>Across {result.bySlot.length} of 6 pieces</small></div>
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
              <details className={styles.details} open>
                <summary>Piece-by-piece breakdown ({result.bySlot.length} pieces)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Piece</th><th>Satin</th><th>Gilded Thread</th><th>Artisan&apos;s Vision</th><th>Power</th></tr></thead>
                    <tbody>
                      {result.bySlot.map((s) => (
                        <tr key={s.key}><th>{s.label}<small>{s.current} → {s.target}</small></th><td>{fmt(s.totals.satin)}</td><td>{fmt(s.totals.gildedThread)}</td><td>{fmt(s.totals.artisansVision)}</td><td>{fmt(s.totals.power)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Set a current and target tier for one or more of the 6 gear pieces, then calculate.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Gear tier progression: verified against K710Hub&apos;s Governor Profile scanner. Satin/Gilded Thread/Artisan&apos;s Vision costs are calibrated to a confirmed reference point (Gold T3 3★ → Red 0★: 90,000/900/180 → 108,000/1,080/220 Satin/Gilded Thread/Artisan&apos;s Vision, a verified 1.2x step-over-step growth rate) via current Kingshot community references; Artisan&apos;s Vision unlocking at Blue 2★ is likewise confirmed. Power gain is still an estimate — confirm exact quantities in-game before spending.</footer>
    </div>
  );
}

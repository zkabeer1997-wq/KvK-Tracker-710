'use client';
import { useState } from 'react';
import { MASTERS, MASTER_MAX_LEVEL, MASTER_BREAKTHROUGH_INTERVAL, calculateMasterUpgrade } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

const fmt = (n) => Number(n || 0).toLocaleString();
const LEVELS = Array.from({ length: MASTER_MAX_LEVEL }, (_, i) => i + 1);

export default function MasterUpgradePlanner() {
  const [master, setMaster] = useState(MASTERS[0].key);
  const [current, setCurrent] = useState(1);
  const [target, setTarget] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    try {
      setResult(calculateMasterUpgrade(current, target));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
  }

  const masterName = MASTERS.find((m) => m.key === master)?.name;

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Masters</span><strong>{MASTERS.length} masters · {MASTER_MAX_LEVEL} Affinity levels</strong></div>
        <span role="status">Roster and breakthrough gates verified · costs estimated</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Upgrade plan</span><h2>Which Master?</h2></div></div>
            <div className={styles.fields}>
              <label>Master
                <select value={master} onChange={(e) => setMaster(e.target.value)}>
                  {MASTERS.map((m) => <option key={m.key} value={m.key}>{m.name} — {m.role}</option>)}
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
            <p className={styles.hint}>Affinity (relationship level) runs 1–{MASTER_MAX_LEVEL}. Every {MASTER_BREAKTHROUGH_INTERVAL} levels is a breakthrough gate that costs Master Emblems on top of the usual Manuscripts.</p>
          </section>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={calculate}>Calculate upgrade plan</button>
          </div>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Calculated result</span><h2>{masterName}&apos;s upgrade plan</h2></div>
          {error && <p role="alert" className={styles.warning}>{error}</p>}
          {result ? (
            <section className={styles.results} aria-label="Calculation results" aria-live="polite">
              <div className={styles.metrics}>
                <div><span>Levels to gain</span><strong>{result.stepCount}</strong><small>{masterName}</small></div>
                <div><span>Breakthrough gates</span><strong>{result.steps.filter((s) => s.breakthrough).length}</strong><small>+{result.totals.squadBuff}% squad buff</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Resources needed for the full plan</caption>
                  <thead><tr><th>Resource</th><th>Required</th></tr></thead>
                  <tbody>
                    <tr><th>Affinity</th><td>{fmt(result.totals.affinity)}</td></tr>
                    <tr><th>Master&apos;s Manuscripts</th><td>{fmt(result.totals.manuscripts)}</td></tr>
                    <tr><th>Master Emblems</th><td>{fmt(result.totals.emblems)}</td></tr>
                  </tbody>
                </table>
              </div>
              <details className={styles.details}>
                <summary>Level-by-level breakdown ({result.steps.length} steps)</summary>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Level</th><th>Affinity</th><th>Manuscripts</th><th>Emblems</th><th>Squad buff</th></tr></thead>
                    <tbody>
                      {result.steps.map((s) => (
                        <tr key={s.level}><th>{s.level} → {s.nextLevel}{s.breakthrough ? ' · Breakthrough' : ''}</th><td>{fmt(s.affinity)}</td><td>{fmt(s.manuscripts)}</td><td>{s.emblems || '—'}</td><td>+{s.squadBuff}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your upgrade plan appears here</h2><p>Choose a Master, current and target level, then calculate.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Master roster, classes and the every-{MASTER_BREAKTHROUGH_INTERVAL}-level Emblem breakthrough gate are confirmed via current Kingshot community references. Exact Affinity/Manuscript/Emblem amounts per level are still estimated pending a directly-accessible cost table — confirm exact quantities in-game before spending.</footer>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { GOVERNOR_GEAR_OPTIONS, GOVERNOR_GEAR_SLOT_LABELS, compareGearLoadouts } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

function blank() { return Object.fromEntries(GOVERNOR_GEAR_SLOT_LABELS.map((s) => [s.key, GOVERNOR_GEAR_OPTIONS[0]])); }

export default function GovernorGearCompare() {
  const [labelA, setLabelA] = useState('Set A');
  const [labelB, setLabelB] = useState('Set B');
  const [loadoutA, setLoadoutA] = useState(blank());
  const [loadoutB, setLoadoutB] = useState(blank());
  const [result, setResult] = useState(null);

  function calculate() {
    const rows = compareGearLoadouts(GOVERNOR_GEAR_SLOT_LABELS, loadoutA, loadoutB);
    const totalA = rows.reduce((n, r) => n + r.scoreA, 0);
    const totalB = rows.reduce((n, r) => n + r.scoreB, 0);
    setResult({ rows, totalA, totalB });
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Governor Gear</span><strong>Compare two full 6-slot loadouts</strong></div>
        <span role="status">Reference data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Loadout A</span><h2><input aria-label="Loadout A name" value={labelA} onChange={(e) => setLabelA(e.target.value)} style={{background:'transparent',border:'none',color:'inherit',font:'inherit',width:'auto'}}/></h2></div></div>
            <div className={styles.fields}>
              {GOVERNOR_GEAR_SLOT_LABELS.map((s) => (
                <label key={s.key}>{s.label}
                  <select value={loadoutA[s.key]} onChange={(e) => { setResult(null); setLoadoutA((v) => ({ ...v, [s.key]: e.target.value })); }}>
                    {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>02 · Loadout B</span><h2><input aria-label="Loadout B name" value={labelB} onChange={(e) => setLabelB(e.target.value)} style={{background:'transparent',border:'none',color:'inherit',font:'inherit',width:'auto'}}/></h2></div></div>
            <div className={styles.fields}>
              {GOVERNOR_GEAR_SLOT_LABELS.map((s) => (
                <label key={s.key}>{s.label}
                  <select value={loadoutB[s.key]} onChange={(e) => { setResult(null); setLoadoutB((v) => ({ ...v, [s.key]: e.target.value })); }}>
                    {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={calculate}>Compare loadouts</button>
          </div>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Calculated result</span><h2>Loadout comparison</h2></div>
          {result ? (
            <section className={styles.results} aria-label="Comparison results" aria-live="polite">
              <div className={styles.metrics}>
                <div><span>{labelA} gear score</span><strong>{result.totalA}</strong><small>Sum of tier rank across 6 slots</small></div>
                <div><span>{labelB} gear score</span><strong>{result.totalB}</strong><small>{result.totalB > result.totalA ? `+${result.totalB - result.totalA} ahead` : result.totalB < result.totalA ? `${result.totalB - result.totalA} behind` : 'Even'}</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Slot-by-slot difference</caption>
                  <thead><tr><th>Slot</th><th>{labelA}</th><th>{labelB}</th><th>Delta</th></tr></thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.key}><th>{r.label}</th><td>{r.a}</td><td>{r.b}</td><td className={r.delta > 0 ? styles.covered : r.delta < 0 ? styles.shortfall : undefined}>{r.delta > 0 ? `+${r.delta}` : r.delta}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your comparison appears here</h2><p>Set both loadouts, then compare to see which slots are ahead or behind.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Gear score ranks each tier by position in the Green → Red T6 progression; it is a relative comparison, not an in-game stat total. Exact stat/set-bonus values are pending a verified Kingshot data source.</footer>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { MASTERS } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

export default function MastersDatabase() {
  const [a, setA] = useState(MASTERS[0].key);
  const [b, setB] = useState(MASTERS[1].key);
  const masterA = MASTERS.find((m) => m.key === a);
  const masterB = MASTERS.find((m) => m.key === b);

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Masters</span><strong>{MASTERS.length} masters in the database</strong></div>
        <span role="status">Class/skill data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Database</span><h2>All Masters</h2></div></div>
            <div className={styles.tableWrap}>
              <table>
                <caption>Browse the full roster</caption>
                <thead><tr><th>Master</th><th>Class / role</th></tr></thead>
                <tbody>
                  {MASTERS.map((m) => <tr key={m.key}><th>{m.name}</th><td>{m.role}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>02 · Compare</span><h2>Pick two Masters</h2></div></div>
            <div className={styles.fields}>
              <label>Master A
                <select value={a} onChange={(e) => setA(e.target.value)}>
                  {MASTERS.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
                </select>
              </label>
              <label>Master B
                <select value={b} onChange={(e) => setB(e.target.value)}>
                  {MASTERS.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
                </select>
              </label>
            </div>
          </section>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Comparison</span><h2>{masterA?.name} vs {masterB?.name}</h2></div>
          <section className={styles.results} aria-label="Master comparison">
            <div className={styles.tableWrap}>
              <table>
                <caption>Side-by-side</caption>
                <thead><tr><th>Field</th><th>{masterA?.name}</th><th>{masterB?.name}</th></tr></thead>
                <tbody>
                  <tr><th>Class / role</th><td>{masterA?.role}</td><td>{masterB?.role}</td></tr>
                  <tr><th>Squad buff</th><td>Pending verification</td><td>Pending verification</td></tr>
                  <tr><th>Signature skill</th><td>Pending verification</td><td>Pending verification</td></tr>
                </tbody>
              </table>
            </div>
            <p className={styles.warning}>Master classes, skills and buffs have not yet been verified against the current Kingshot build. Use the <a href="/tools/masters-upgrade">Master Upgrade Planner</a> for level costs, and check in-game or a current Kingshot guide for skill details until this database is filled in.</p>
          </section>
        </aside>
      </div>
      <footer className={styles.source}>Master roster: confirmed via current Kingshot community references (kingshot.net, kingshotguide.org). Class, skill and buff details are placeholders pending verified data.</footer>
    </div>
  );
}

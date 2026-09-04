'use client';
import { useState } from 'react';
import { HEROES } from '../../lib/playerCombatOptions.mjs';
import { GOVERNOR_GEAR_OPTIONS, HERO_GEAR_SLOT_LABELS, gearScore } from '../../lib/gearMastersCalc.mjs';
import styles from './CostPlanner.module.css';

function blank() { return Object.fromEntries(HERO_GEAR_SLOT_LABELS.map((s) => [s.key, GOVERNOR_GEAR_OPTIONS[0]])); }

export default function HeroGearSetBuilder() {
  const [hero, setHero] = useState(HEROES[0]);
  const [pieces, setPieces] = useState(blank());
  const [result, setResult] = useState(null);

  function calculate() {
    const rows = HERO_GEAR_SLOT_LABELS.map((s) => ({ ...s, tier: pieces[s.key], score: gearScore(pieces[s.key]) }));
    const total = rows.reduce((n, r) => n + r.score, 0);
    const minScore = Math.min(...rows.map((r) => r.score));
    const setTierIndex = GOVERNOR_GEAR_OPTIONS.findIndex((t) => gearScore(t) === minScore);
    const matched = rows.every((r) => r.score >= minScore) && minScore > 0;
    setResult({ rows, total, matchedTier: matched ? GOVERNOR_GEAR_OPTIONS[setTierIndex] : null });
  }

  return (
    <div className={styles.planner}>
      <div className={styles.topline}>
        <div><span className="k-mark">Hero Gear</span><strong>Build a full 4-piece set</strong></div>
        <span role="status">Reference data pending verification</span>
      </div>
      <div className={styles.layout}>
        <fieldset className={styles.inputs}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>01 · Hero</span><h2>Who is this set for?</h2></div></div>
            <label>Hero
              <select value={hero} onChange={(e) => setHero(e.target.value)}>
                {HEROES.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
          </section>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><span className={styles.eyebrow}>02 · Gear pieces</span><h2>Set each piece&apos;s tier</h2></div></div>
            <div className={styles.fields}>
              {HERO_GEAR_SLOT_LABELS.map((s) => (
                <label key={s.key}>{s.label}
                  <select value={pieces[s.key]} onChange={(e) => { setResult(null); setPieces((v) => ({ ...v, [s.key]: e.target.value })); }}>
                    {GOVERNOR_GEAR_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <p className={styles.hint}>Uses the same tier scale as Governor Gear (Green → Red T6) as a stand-in until hero-specific gear tiers are verified.</p>
          </section>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={calculate}>Build set</button>
          </div>
        </fieldset>
        <aside className={styles.resultColumn}>
          <div className={styles.resultTitle}><span className="k-mark">Calculated result</span><h2>{hero}&apos;s set</h2></div>
          {result ? (
            <section className={styles.results} aria-label="Set results" aria-live="polite">
              <div className={styles.metrics}>
                <div><span>Total gear score</span><strong>{result.total}</strong><small>Sum across 4 pieces</small></div>
                <div><span>Full-set floor</span><strong>{result.matchedTier || '—'}</strong><small>{result.matchedTier ? 'Every piece meets this tier' : 'Pieces are mismatched'}</small></div>
              </div>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Piece-by-piece breakdown</caption>
                  <thead><tr><th>Piece</th><th>Tier</th><th>Score</th></tr></thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.key}><th>{r.label}</th><td>{r.tier}</td><td>{r.score}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <div className={styles.empty}><h2>Your set appears here</h2><p>Set every piece&apos;s tier, then build to see the total score and weakest link.</p></div>
          )}
        </aside>
      </div>
      <footer className={styles.source}>Gear score ranks each tier by position in the Green → Red T6 progression as a stand-in for verified hero-gear stat totals and set bonuses.</footer>
    </div>
  );
}

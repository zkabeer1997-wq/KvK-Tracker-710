'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GOVERNOR_GEAR_ALL_TIERS, GOVERNOR_GEAR_PIECES, calculateGovernorGearPlan, resolveSetBonus } from '../../lib/governorGearOptimizer.mjs';
import { GOVERNOR_GEAR_EXCHANGE_NOTES_UNVERIFIED } from '../../lib/data/governorGear.mjs';

const RESOURCE_LABELS = { satin: 'Satin', threads: "Gilded Threads", vision: "Artisan's Vision" };
const RESOURCES = ['satin', 'threads', 'vision'];
const LAST_SOURCED_INDEX = GOVERNOR_GEAR_ALL_TIERS.findIndex((tier) => tier.placeholder) - 1;
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();
const pct = (n) => (n == null ? '—' : `${n.toFixed(2).replace(/\.?0+$/, '')}%`);

const defaultPieces = () => GOVERNOR_GEAR_PIECES.map((piece) => ({ id: piece.id, current: 0, target: 0, currentTouched: false }));

function TierSelect({ value, onChange, min = 0, allowPreview = true, label }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {GOVERNOR_GEAR_ALL_TIERS.map((tier) => (
        <option key={tier.key} value={tier.index} disabled={tier.index < min || (!allowPreview && tier.placeholder)}>
          {tier.label}
        </option>
      ))}
    </select>
  );
}

export default function GovernorGearOptimizer() {
  const [pieces, setPieces] = useState(defaultPieces);
  const [inventory, setInventory] = useState({ satin: 0, threads: 0, vision: 0 });
  const [result, setResult] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Loading your saved plan…');
  const saveTimer = useRef(null);
  const stateKey = 'governor-gear-optimizer';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/tool-state/${stateKey}`, { cache: 'no-store' });
        const result = await response.json();
        const saved = result?.state;
        if (response.ok && saved && typeof saved === 'object') {
          if (Array.isArray(saved.pieces) && saved.pieces.length === GOVERNOR_GEAR_PIECES.length) {
            setPieces(saved.pieces.map((p, i) => ({
              id: GOVERNOR_GEAR_PIECES[i].id,
              current: Math.max(0, Math.min(LAST_SOURCED_INDEX, Number(p.current) || 0)),
              target: Math.max(0, Math.min(GOVERNOR_GEAR_ALL_TIERS.length - 1, Number(p.target) || 0)),
              currentTouched: !!p.currentTouched,
            })));
          }
          if (saved.inventory && typeof saved.inventory === 'object') setInventory((v) => ({ ...v, ...saved.inventory }));
          if (!cancelled) setSaveStatus('Saved plan loaded.');
        } else if (!cancelled) {
          setSaveStatus(response.status === 401 ? 'Sign in as a member to save and sync.' : 'No saved plan yet.');
        }
      } catch {
        if (!cancelled) setSaveStatus('Could not restore saved inputs.');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('Saving…');
    saveTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tool-state/${stateKey}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { pieces, inventory } }) });
        setSaveStatus(response.ok ? 'Saved to your member profile.' : response.status === 401 ? 'Sign in as a member to save and sync.' : 'Save failed.');
      } catch {
        setSaveStatus('Save failed.');
      }
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [hydrated, pieces, inventory]);

  const setCurrent = (id, index) => {
    setResult(null);
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, current: index, currentTouched: true, target: Math.max(p.target, index) } : p)));
  };
  const setTarget = (id, index) => {
    setResult(null);
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, target: index } : p)));
  };
  const updateInventory = (key, value) => { setResult(null); setInventory((v) => ({ ...v, [key]: Math.max(0, Number(value) || 0) })); };
  const reset = () => { setPieces(defaultPieces()); setInventory({ satin: 0, threads: 0, vision: 0 }); setResult(null); };

  const currentSetBonus = useMemo(() => resolveSetBonus(Object.fromEntries(pieces.map((p) => [p.id, p.current]))), [pieces]);
  const targetSetBonus = useMemo(() => resolveSetBonus(Object.fromEntries(pieces.map((p) => [p.id, p.target]))), [pieces]);
  const newlyUnlocks3pc = targetSetBonus.threePieceTierIndex > currentSetBonus.threePieceTierIndex;
  const newlyUnlocks6pc = targetSetBonus.sixPieceTierIndex > currentSetBonus.sixPieceTierIndex;

  const calculate = () => setResult(calculateGovernorGearPlan(pieces, inventory));

  return (
    <section className="ggo-shell">
      <div className="ggo-inputs">
        <div className="ggo-panel-head">
          <div><h2>Set your target</h2><p>Choose each piece&apos;s current and target tier, then enter what&apos;s already in your bag.</p></div>
          <span role="status">{saveStatus}</span>
        </div>

        <h3>Gear pieces</h3>
        <div className="ggo-piece-table">
          <div className="ggo-piece-row ggo-piece-head"><span>Piece</span><span>Current</span><span>Target</span></div>
          {pieces.map((piece) => {
            const meta = GOVERNOR_GEAR_PIECES.find((p) => p.id === piece.id);
            return (
              <div className="ggo-piece-row" key={piece.id}>
                <span><b>{meta.type}</b><small>{meta.label}</small></span>
                <TierSelect value={piece.current} onChange={(index) => setCurrent(piece.id, index)} allowPreview={false} label={`${meta.label} current tier`} />
                <TierSelect value={piece.target} min={piece.current} onChange={(index) => setTarget(piece.id, index)} label={`${meta.label} target tier`} />
              </div>
            );
          })}
        </div>

        <h3>Set bonuses</h3>
        <div className="ggo-setbonus">
          <div><span>3-piece · Defense</span><strong>+{pct(targetSetBonus.threePieceDefense)}</strong><small>{targetSetBonus.threePieceTierLabel}{newlyUnlocks3pc ? ' · newly unlocked' : ''}</small></div>
          <div><span>6-piece · Attack</span><strong>+{pct(targetSetBonus.sixPieceAttack)}</strong><small>{targetSetBonus.sixPieceTierLabel}{newlyUnlocks6pc ? ' · newly unlocked' : ''}</small></div>
        </div>

        <h3>Resources you already have</h3>
        <div className="ggo-fields">
          {RESOURCES.map((key) => (
            <label key={key}>{RESOURCE_LABELS[key]}<input type="number" min="0" step="1" value={inventory[key]} onChange={(e) => updateInventory(key, e.target.value)} /></label>
          ))}
        </div>

        <details className="ggo-details">
          <summary>Resource exchange reference (unverified)</summary>
          <p className="ggo-hint">Sourced from kingshotoptimizer.com&apos;s public optimizer screen, not cross-checked against a second source — confirm in-game before relying on these.</p>
          <ul>{GOVERNOR_GEAR_EXCHANGE_NOTES_UNVERIFIED.map((note) => <li key={note.label}><b>{note.label}</b>{note.options.map((o) => <span key={o}>{o}</span>)}</li>)}</ul>
        </details>

        <div className="ggo-actions">
          <button className="ggo-calculate" type="button" onClick={calculate}>Calculate upgrade plan</button>
          <button className="ggo-quiet" type="button" onClick={reset}>Reset</button>
        </div>
      </div>

      <aside className="ggo-results" aria-live="polite">
        <div className="ggo-results-title"><span className="k-mark">Calculated result</span><h2>Upgrade plan</h2></div>
        {!result && <div className="ggo-empty"><span>◇</span><h2>Your upgrade plan appears here</h2><p>Choose current and target tiers for each piece, then calculate to see materials required.</p></div>}
        {result && result.steps.length === 0 && result.placeholderStepCount === 0 && (
          <div className="ggo-empty ggo-covered"><span>✓</span><h2>No upgrades needed</h2><p>Every piece is already at or above its target tier.</p></div>
        )}
        {result && (result.steps.length > 0 || result.placeholderStepCount > 0) && <>
          {result.assumedZeroSteps > 0 && (
            <p className="ggo-callout">Includes {result.assumedZeroSteps} upgrade step{result.assumedZeroSteps === 1 ? '' : 's'} assuming pieces still at Green 0★ are truly not upgraded yet, because their current tier wasn&apos;t changed from the default. Set each piece&apos;s actual current tier above if you already own progress on it.</p>
          )}
          {result.placeholderStepCount > 0 && (
            <p className="ggo-callout ggo-callout-preview">Preview / data pending: {result.placeholderStepCount} of your planned upgrade step{result.placeholderStepCount === 1 ? '' : 's'} fall in Red T5/T6, which have no sourced cost data yet. Those steps are excluded from the totals below.</p>
          )}
          {result.verifyTiers.length > 0 && (
            <p className="ggo-callout ggo-callout-verify">Spot-check in-game before trusting these totals: {result.verifyTiers.map((t) => `${t.label} (${t.verify === 'satin' ? 'Satin' : 'Threads'})`).join(', ')} — sources showed minor variance for these values.</p>
          )}
          <div className="ggo-tableWrap">
            <table>
              <caption>Materials needed for the full plan</caption>
              <thead><tr><th>Resource</th><th>Required</th><th>Owned</th><th>Still needed</th></tr></thead>
              <tbody>
                {RESOURCES.map((key) => (
                  <tr key={key}><th>{RESOURCE_LABELS[key]}</th><td>{fmt(result.totals[key])}</td><td>{fmt(inventory[key])}</td><td className={result.shortfall[key] ? 'ggo-shortfall' : 'ggo-covered'}>{fmt(result.shortfall[key])}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="ggo-details" open>
            <summary>Step-by-step breakdown ({result.steps.length} steps)</summary>
            <div className="ggo-tableWrap">
              <table>
                <thead><tr><th>Upgrade</th><th>Satin</th><th>Threads</th><th>Vision</th></tr></thead>
                <tbody>
                  {result.steps.map((step, index) => {
                    const meta = GOVERNOR_GEAR_PIECES.find((p) => p.id === step.pieceId);
                    return <tr key={`${step.pieceId}-${step.tier.key}-${index}`}><th>{meta.label}<small>{step.tier.label}{step.tier.verify ? ' · verify' : ''}</small></th><td>{fmt(step.tier.satin)}</td><td>{fmt(step.tier.threads)}</td><td>{fmt(step.tier.vision)}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </>}
      </aside>

      <style jsx>{`
        .ggo-shell{display:grid;grid-template-columns:minmax(360px,1.1fr) minmax(340px,.9fr);gap:20px;align-items:start;font-family:var(--font-body);color:var(--parchment)}
        .ggo-inputs,.ggo-results{border:1px solid var(--edge-strong);border-radius:var(--radius-lg);background:rgba(9,10,18,.86);padding:22px}
        .ggo-inputs{position:sticky;top:20px}
        .ggo-panel-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid var(--edge);margin-bottom:18px}
        .ggo-panel-head h2,.ggo-empty h2,.ggo-results-title h2{margin:0;color:var(--parchment);font-size:20px;text-transform:none;letter-spacing:0}
        .ggo-panel-head p{margin:5px 0 0;color:var(--parchment-dim);font-size:13px;line-height:1.5}
        .ggo-panel-head>span{flex:none;color:var(--brass);font-size:10px;font-family:var(--font-mono)}
        .ggo-inputs h3{margin:20px 0 10px;color:var(--brass-bright);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
        .ggo-piece-table{border:1px solid var(--edge)}
        .ggo-piece-row{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:10px;align-items:center;padding:9px 10px;border-bottom:1px solid var(--edge)}
        .ggo-piece-row:last-child{border-bottom:0}
        .ggo-piece-head{color:var(--t-secondary);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .ggo-piece-row b{display:block;color:var(--parchment);font-size:12px}
        .ggo-piece-row small{display:block;color:var(--parchment-dim);font-size:10px;margin-top:2px}
        .ggo-piece-row select,.ggo-fields input{width:100%;min-width:0;padding:8px 9px;background:#11141e;border:1px solid var(--edge-strong);color:var(--parchment);font-family:var(--font-body);font-size:12px;border-radius:6px}
        .ggo-setbonus{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .ggo-setbonus>div{padding:14px;border:1px solid var(--edge);border-radius:var(--radius-md);background:rgba(201,164,78,.06)}
        .ggo-setbonus span{display:block;color:var(--t-secondary);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .ggo-setbonus strong{display:block;margin-top:4px;color:var(--gold-hot);font-family:var(--font-mono);font-size:20px}
        .ggo-setbonus small{display:block;margin-top:4px;color:var(--parchment-dim);font-size:10.5px}
        .ggo-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .ggo-fields label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--parchment-dim)}
        .ggo-details{border-top:1px solid var(--edge);margin-top:18px;padding-top:14px}
        .ggo-details summary{cursor:pointer;color:var(--brass);font-size:12px}
        .ggo-details ul{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
        .ggo-details li{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--parchment-dim)}
        .ggo-details li b{color:var(--parchment)}
        .ggo-hint{margin:8px 0 0;color:var(--t-secondary);font-size:11px;line-height:1.5}
        .ggo-actions{display:flex;gap:10px;margin-top:20px}
        .ggo-calculate{flex:1;border:1px solid var(--gold-hot);border-radius:var(--radius-md);padding:12px 16px;background:var(--gold-aged);color:#171108;font-weight:900;cursor:pointer}
        .ggo-calculate:hover{background:var(--gold-hot)}
        .ggo-quiet{border:1px solid rgba(201,164,78,.35);background:transparent;color:var(--brass);border-radius:var(--radius-md);padding:12px 16px;cursor:pointer}
        .ggo-results-title{padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--edge)}
        .ggo-empty{min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}
        .ggo-empty>span{font-size:36px;color:var(--brass)}
        .ggo-empty p{max-width:40ch;color:var(--parchment-dim);font-size:13px}
        .ggo-covered>span{color:#a8cc96}
        .ggo-callout{padding:12px 14px;border:1px solid rgba(201,164,78,.4);border-left:3px solid var(--gold-hot);border-radius:8px;background:rgba(201,164,78,.08);color:#f0d9a0;font-size:12px;line-height:1.6;margin:0 0 14px}
        .ggo-callout-preview{border-color:rgba(226,138,95,.45);border-left-color:#e28a5f;background:rgba(226,138,95,.08);color:#f0c2a4}
        .ggo-callout-verify{border-color:rgba(101,169,216,.45);border-left-color:#65a9d8;background:rgba(101,169,216,.08);color:#b9dcf0}
        .ggo-tableWrap{overflow:auto}
        .ggo-results table{width:100%;border-collapse:collapse;font-size:12px}
        .ggo-results caption{text-align:left;color:var(--t-secondary);padding:0 0 10px}
        .ggo-results th,.ggo-results td{padding:9px 10px;border-bottom:1px solid var(--edge);text-align:right;white-space:nowrap}
        .ggo-results th:first-child{text-align:left}
        .ggo-results thead th{color:var(--t-secondary);font-size:10px;text-transform:uppercase;font-weight:600}
        .ggo-results tbody th{font-weight:500;color:var(--parchment)}
        .ggo-shortfall{color:#f2cb82;font-weight:700;font-family:var(--font-mono)}
        .ggo-covered{color:#9fcaa5;font-family:var(--font-mono)}
        @media(max-width:980px){.ggo-shell{grid-template-columns:1fr}.ggo-inputs{position:static}}
        @media(max-width:580px){.ggo-inputs,.ggo-results{padding:16px}.ggo-piece-row{grid-template-columns:1fr}.ggo-setbonus,.ggo-fields{grid-template-columns:1fr}.ggo-actions{flex-direction:column}}
      `}</style>
    </section>
  );
}

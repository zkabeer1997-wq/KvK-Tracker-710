'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  HERO_GEAR_PIECES,
  HERO_GEAR_LEVELS,
  HERO_GEAR_IMBUEMENT_TIERS,
  HERO_GEAR_RESOURCES,
  HERO_GEAR_RESOURCE_LABELS,
  defaultHeroGearSelections,
  calculateHeroGearPlan,
  nearMissAnalysis,
} from '../../lib/heroGearOptimizer.mjs';

const PROFILES_KEY = 'k710-hero-gear-profiles';
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

function readProfiles() {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeProfiles(profiles) {
  try { window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch { /* private mode / storage unavailable */ }
}

function LevelSelect({ value, onChange, options, min = 0, label }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {options.map((opt) => (
        <option key={opt.level ?? opt.tier} value={opt.level ?? opt.tier} disabled={(opt.level ?? opt.tier) < min}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function HeroGearOptimizer() {
  const [selections, setSelections] = useState(defaultHeroGearSelections);
  const [inventory, setInventory] = useState({ xp: 0, forgehammers: 0, mithril: 0, mythicGear: 0 });
  const [result, setResult] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [profileStatus, setProfileStatus] = useState('');

  useEffect(() => { setProfiles(readProfiles()); }, []);

  const setLevel = (id, key, value) => {
    setResult(null);
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, level: { ...s.level, [key]: value, ...(key === 'current' && s.level.target < value ? { target: value } : {}) } } : s)));
  };
  const setImbuement = (id, key, value) => {
    setResult(null);
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, imbuement: { ...s.imbuement, [key]: value, ...(key === 'current' && s.imbuement.target < value ? { target: value } : {}) } } : s)));
  };
  const setMythic = (id, key, value) => {
    setResult(null);
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, mythic: { ...s.mythic, [key]: value, ...(key === 'current' && value ? { target: true } : {}) } } : s)));
  };
  const updateInventory = (key, value) => { setResult(null); setInventory((v) => ({ ...v, [key]: Math.max(0, Number(value) || 0) })); };
  const reset = () => { setSelections(defaultHeroGearSelections()); setInventory({ xp: 0, forgehammers: 0, mithril: 0, mythicGear: 0 }); setResult(null); };
  const calculate = () => setResult(calculateHeroGearPlan(selections, inventory));

  const saveProfile = () => {
    const name = profileName.trim();
    if (!name) { setProfileStatus('Name the profile before saving.'); return; }
    const next = [...profiles.filter((p) => p.name !== name), { name, selections, inventory, savedAt: new Date().toISOString() }];
    writeProfiles(next);
    setProfiles(next);
    setSelectedProfile(name);
    setProfileStatus(`Saved "${name}" to this browser.`);
  };
  const loadProfile = () => {
    const profile = profiles.find((p) => p.name === selectedProfile);
    if (!profile) { setProfileStatus('Choose a saved profile to load.'); return; }
    setSelections(profile.selections);
    setInventory(profile.inventory);
    setResult(null);
    setProfileName(profile.name);
    setProfileStatus(`Loaded "${profile.name}".`);
  };
  const deleteProfile = () => {
    if (!selectedProfile) return;
    const next = profiles.filter((p) => p.name !== selectedProfile);
    writeProfiles(next);
    setProfiles(next);
    setProfileStatus(`Deleted "${selectedProfile}".`);
    setSelectedProfile('');
  };

  const nearMiss = useMemo(() => (result ? nearMissAnalysis(result, inventory) : []), [result, inventory]);

  return (
    <section className="hgo-shell">
      <div className="hgo-preview-banner" role="note">
        <strong>Preview — game data pending verification.</strong> No freely-reusable source was found for this game&apos;s Hero Gear costs (XP, Forgehammers, Mithril, Mythic Gear). Every cost below is a placeholder — the tool shows structure and workflow only, never a fabricated number.
      </div>

      <div className="hgo-inputs">
        <div className="hgo-panel-head">
          <div><h2>Set your target</h2><p>Choose each piece&apos;s current and target level, Imbuement tier, and Mythic status.</p></div>
        </div>

        <h3>Build profiles (saved in this browser)</h3>
        <div className="hgo-profiles">
          <input type="text" placeholder="Profile name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          <button type="button" className="hgo-quiet" onClick={saveProfile}>Save as profile</button>
          <select aria-label="Saved profiles" value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)}>
            <option value="">Select a saved profile…</option>
            {profiles.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button type="button" className="hgo-quiet" onClick={loadProfile} disabled={!selectedProfile}>Load</button>
          <button type="button" className="hgo-quiet hgo-danger" onClick={deleteProfile} disabled={!selectedProfile}>Delete</button>
        </div>
        {profileStatus && <p className="hgo-hint">{profileStatus}</p>}

        <h3>Gear pieces</h3>
        <div className="hgo-piece-table">
          <div className="hgo-piece-row hgo-piece-head"><span>Piece</span><span>Level (current → target)</span><span>Imbuement (current → target)</span><span>Mythic</span></div>
          {selections.map((selection) => {
            const meta = HERO_GEAR_PIECES.find((p) => p.id === selection.id);
            return (
              <div className="hgo-piece-row" key={selection.id}>
                <span><b>{meta.label}</b></span>
                <span className="hgo-pair">
                  <LevelSelect value={selection.level.current} options={HERO_GEAR_LEVELS} onChange={(v) => setLevel(selection.id, 'current', v)} label={`${meta.label} current level`} />
                  <LevelSelect value={selection.level.target} options={HERO_GEAR_LEVELS} min={selection.level.current} onChange={(v) => setLevel(selection.id, 'target', v)} label={`${meta.label} target level`} />
                </span>
                <span className="hgo-pair">
                  <LevelSelect value={selection.imbuement.current} options={HERO_GEAR_IMBUEMENT_TIERS} onChange={(v) => setImbuement(selection.id, 'current', v)} label={`${meta.label} current imbuement`} />
                  <LevelSelect value={selection.imbuement.target} options={HERO_GEAR_IMBUEMENT_TIERS} min={selection.imbuement.current} onChange={(v) => setImbuement(selection.id, 'target', v)} label={`${meta.label} target imbuement`} />
                </span>
                <span className="hgo-mythic">
                  <label><input type="checkbox" checked={selection.mythic.current} onChange={(e) => setMythic(selection.id, 'current', e.target.checked)} /> Owned</label>
                  <label><input type="checkbox" checked={selection.mythic.target} disabled={selection.mythic.current} onChange={(e) => setMythic(selection.id, 'target', e.target.checked)} /> Target</label>
                </span>
              </div>
            );
          })}
        </div>

        <h3>Resources you already have</h3>
        <div className="hgo-fields">
          {HERO_GEAR_RESOURCES.map((key) => (
            <label key={key}>{HERO_GEAR_RESOURCE_LABELS[key]}<input type="number" min="0" step="1" value={inventory[key]} onChange={(e) => updateInventory(key, e.target.value)} /></label>
          ))}
        </div>

        <div className="hgo-actions">
          <button className="hgo-calculate" type="button" onClick={calculate}>Calculate upgrade plan</button>
          <button className="hgo-quiet" type="button" onClick={reset}>Reset</button>
        </div>
      </div>

      <aside className="hgo-results" aria-live="polite">
        <div className="hgo-results-title"><span className="k-mark">Calculated result</span><h2>Upgrade plan</h2></div>
        {!result && <div className="hgo-empty"><span>◇</span><h2>Your upgrade plan appears here</h2><p>Choose current and target states for each piece, then calculate.</p></div>}
        {result && !result.hasAnyStep && (
          <div className="hgo-empty hgo-covered"><span>✓</span><h2>No upgrades needed</h2><p>Every piece is already at or above its target.</p></div>
        )}
        {result && result.hasAnyStep && <>
          {result.hasPendingData && (
            <p className="hgo-callout hgo-callout-preview">Preview / data pending: real Hero Gear costs haven&apos;t been sourced yet, so totals marked &quot;Pending&quot; below are not fabricated numbers — they&apos;ll compute automatically once real costs are added to the game data file.</p>
          )}
          <div className="hgo-tableWrap">
            <table>
              <caption>Materials needed for the full plan</caption>
              <thead><tr><th>Resource</th><th>Required</th><th>Owned</th><th>Still needed</th></tr></thead>
              <tbody>
                {HERO_GEAR_RESOURCES.map((key) => (
                  <tr key={key}>
                    <th>{HERO_GEAR_RESOURCE_LABELS[key]}</th>
                    <td>{result.totals[key] == null ? <em>Pending</em> : fmt(result.totals[key])}</td>
                    <td>{fmt(inventory[key])}</td>
                    <td className={result.shortfall[key] == null ? '' : result.shortfall[key] ? 'hgo-shortfall' : 'hgo-covered-cell'}>{result.shortfall[key] == null ? <em>Pending</em> : fmt(result.shortfall[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="hgo-section-title">Near-miss analysis</h3>
          <p className="hgo-hint">Each piece&apos;s single next upgrade step, ranked by how close you are once real costs are available.</p>
          <ul className="hgo-nearmiss">
            {nearMiss.map((note, index) => {
              const meta = HERO_GEAR_PIECES.find((p) => p.id === note.pieceId);
              return (
                <li key={`${note.pieceId}-${note.track}-${index}`}>
                  <b>{meta.label}</b> · {note.track} track needs {HERO_GEAR_RESOURCE_LABELS[note.resource]}
                  {note.known ? <> — <strong>{fmt(note.remaining)} more needed</strong></> : <em> — pending real data</em>}
                </li>
              );
            })}
            {nearMiss.length === 0 && <li><em>No pending upgrades to analyze.</em></li>}
          </ul>
        </>}
      </aside>

      <style jsx>{`
        .hgo-shell{display:grid;grid-template-columns:minmax(360px,1.15fr) minmax(340px,.85fr);gap:20px;align-items:start;font-family:var(--font-body);color:var(--parchment)}
        .hgo-preview-banner{grid-column:1/-1;padding:14px 18px;border:1px solid rgba(226,138,95,.45);border-left:3px solid #e28a5f;border-radius:var(--radius-md);background:rgba(226,138,95,.08);color:#f0c2a4;font-size:12.5px;line-height:1.6}
        .hgo-preview-banner strong{color:#f5d3bb}
        .hgo-inputs,.hgo-results{border:1px solid var(--edge-strong);border-radius:var(--radius-lg);background:rgba(9,10,18,.86);padding:22px}
        .hgo-inputs{position:sticky;top:20px}
        .hgo-panel-head{padding-bottom:16px;border-bottom:1px solid var(--edge);margin-bottom:16px}
        .hgo-panel-head h2,.hgo-empty h2,.hgo-results-title h2{margin:0;color:var(--parchment);font-size:20px;text-transform:none;letter-spacing:0}
        .hgo-panel-head p{margin:5px 0 0;color:var(--parchment-dim);font-size:13px;line-height:1.5}
        .hgo-inputs h3{margin:20px 0 10px;color:var(--brass-bright);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
        .hgo-profiles{display:flex;gap:8px;flex-wrap:wrap}
        .hgo-profiles input[type=text]{flex:1;min-width:140px;padding:9px 10px;background:#11141e;border:1px solid var(--edge-strong);color:var(--parchment);border-radius:6px;font-size:12px}
        .hgo-profiles select{flex:1;min-width:160px;padding:9px 10px;background:#11141e;border:1px solid var(--edge-strong);color:var(--parchment);border-radius:6px;font-size:12px}
        .hgo-quiet{border:1px solid rgba(201,164,78,.35);background:transparent;color:var(--brass);border-radius:6px;padding:9px 12px;cursor:pointer;font-size:12px}
        .hgo-quiet:disabled{opacity:.4;cursor:not-allowed}
        .hgo-danger{border-color:rgba(226,138,95,.45);color:#e28a5f}
        .hgo-hint{margin:8px 2px 0;color:var(--t-secondary);font-size:11px;line-height:1.5}
        .hgo-piece-table{border:1px solid var(--edge)}
        .hgo-piece-row{display:grid;grid-template-columns:1fr 1.4fr 1.4fr .9fr;gap:10px;align-items:center;padding:9px 10px;border-bottom:1px solid var(--edge)}
        .hgo-piece-row:last-child{border-bottom:0}
        .hgo-piece-head{color:var(--t-secondary);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .hgo-piece-row b{color:var(--parchment);font-size:12px}
        .hgo-pair{display:flex;gap:6px}
        .hgo-piece-row select{width:100%;min-width:0;padding:7px 8px;background:#11141e;border:1px solid var(--edge-strong);color:var(--parchment);font-size:11px;border-radius:6px}
        .hgo-mythic{display:flex;flex-direction:column;gap:4px}
        .hgo-mythic label{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--parchment-dim)}
        .hgo-fields{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .hgo-fields label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:var(--parchment-dim)}
        .hgo-fields input{padding:8px 9px;background:#11141e;border:1px solid var(--edge-strong);color:var(--parchment);border-radius:6px;font-family:var(--font-body);font-size:12px}
        .hgo-actions{display:flex;gap:10px;margin-top:20px}
        .hgo-calculate{flex:1;border:1px solid var(--gold-hot);border-radius:var(--radius-md);padding:12px 16px;background:var(--gold-aged);color:#171108;font-weight:900;cursor:pointer}
        .hgo-calculate:hover{background:var(--gold-hot)}
        .hgo-results-title{padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--edge)}
        .hgo-empty{min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}
        .hgo-empty>span{font-size:36px;color:var(--brass)}
        .hgo-empty p{max-width:40ch;color:var(--parchment-dim);font-size:13px}
        .hgo-covered>span{color:#a8cc96}
        .hgo-callout{padding:12px 14px;border:1px solid rgba(201,164,78,.4);border-left:3px solid var(--gold-hot);border-radius:8px;background:rgba(201,164,78,.08);color:#f0d9a0;font-size:12px;line-height:1.6;margin:0 0 14px}
        .hgo-callout-preview{border-color:rgba(226,138,95,.45);border-left-color:#e28a5f;background:rgba(226,138,95,.08);color:#f0c2a4}
        .hgo-tableWrap{overflow:auto}
        .hgo-results table{width:100%;border-collapse:collapse;font-size:12px}
        .hgo-results caption{text-align:left;color:var(--t-secondary);padding:0 0 10px}
        .hgo-results th,.hgo-results td{padding:9px 10px;border-bottom:1px solid var(--edge);text-align:right;white-space:nowrap}
        .hgo-results th:first-child{text-align:left}
        .hgo-results thead th{color:var(--t-secondary);font-size:10px;text-transform:uppercase;font-weight:600}
        .hgo-results tbody th{font-weight:500;color:var(--parchment)}
        .hgo-results em{color:var(--t-secondary);font-style:normal;font-size:11px}
        .hgo-shortfall{color:#f2cb82;font-weight:700;font-family:var(--font-mono)}
        .hgo-covered-cell{color:#9fcaa5;font-family:var(--font-mono)}
        .hgo-section-title{margin:22px 0 4px;color:var(--brass-bright);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
        .hgo-nearmiss{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
        .hgo-nearmiss li{padding:10px 12px;border:1px solid var(--edge);border-radius:8px;background:rgba(255,255,255,.02);font-size:12px;color:var(--parchment-dim)}
        .hgo-nearmiss strong{color:var(--gold-hot);font-family:var(--font-mono)}
        @media(max-width:980px){.hgo-shell{grid-template-columns:1fr}.hgo-inputs{position:static}}
        @media(max-width:640px){.hgo-inputs,.hgo-results{padding:16px}.hgo-piece-row{grid-template-columns:1fr}.hgo-fields{grid-template-columns:1fr 1fr}.hgo-actions{flex-direction:column}.hgo-profiles{flex-direction:column}.hgo-profiles input,.hgo-profiles select{width:100%}}
      `}</style>
    </section>
  );
}

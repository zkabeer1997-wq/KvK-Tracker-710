'use client';

import { useMemo, useState } from 'react';
import { PETS } from './petData';
import styles from './page.module.css';

function fmt(value) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Number(value) || 0));
}

function totalRange(profile, from, to) {
  const out = { food: 0, manuals: 0, potions: 0, medallions: 0, advancements: 0 };
  for (let level = Number(from) + 1; level <= Number(to); level += 1) {
    const entry = profile.find((item) => item.level === level);
    if (!entry) continue;
    out.food += entry.food;
    out.manuals += entry.manuals;
    out.potions += entry.potions;
    out.medallions += entry.medallions;
    if (level % 10 === 0) out.advancements += 1;
  }
  return out;
}

export default function PetCalculator() {
  const [petKey, setPetKey] = useState('giant-rhino');
  const pet = PETS.find((item) => item.key === petKey) || PETS[0];
  const maxLevel = pet.profile[pet.profile.length - 1].level;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);
  const [owned, setOwned] = useState({ food: 0, manuals: 0, potions: 0, medallions: 0 });

  function changePet(key) {
    const next = PETS.find((item) => item.key === key) || PETS[0];
    const nextMax = next.profile[next.profile.length - 1].level;
    setPetKey(key);
    setFrom((current) => Math.min(current, nextMax - 1));
    setTo((current) => Math.min(Math.max(current, 2), nextMax));
  }

  const safeFrom = Math.min(Number(from), maxLevel - 1);
  const safeTo = Math.max(safeFrom + 1, Math.min(Number(to), maxLevel));
  const totals = useMemo(() => totalRange(pet.profile, safeFrom, safeTo), [pet, safeFrom, safeTo]);

  const resources = [
    ['food', 'Pet Food'],
    ['manuals', 'Growth Manuals'],
    ['potions', 'Nutrient Potions'],
    ['medallions', 'Promotion Medallions'],
  ];

  return (
    <section className={styles.calculator}>
      <header className={styles.header}>
        <span className="k-mark">Pet Progression</span>
        <h1 className="k-display">Pets Upgrade Calculator</h1>
        <p className="k-narrative">Plan Pet Food and advancement materials from any current level to a target level. No pet-ranking or upgrade-priority logic is applied.</p>
      </header>

      <div className={styles.panel}>
        <div className={styles.grid}>
          <label>
            <span>Pet</span>
            <select value={petKey} onChange={(event) => changePet(event.target.value)}>
              {PETS.map((item) => <option key={item.key} value={item.key}>{item.name} · Gen {item.generation}</option>)}
            </select>
          </label>
          <label>
            <span>Current level</span>
            <select value={safeFrom} onChange={(event) => {
              const value = Number(event.target.value);
              setFrom(value);
              if (safeTo <= value) setTo(value + 1);
            }}>
              {pet.profile.slice(0, -1).map((entry) => <option key={entry.level} value={entry.level}>Level {entry.level}</option>)}
            </select>
          </label>
          <label>
            <span>Target level</span>
            <select value={safeTo} onChange={(event) => setTo(Number(event.target.value))}>
              {pet.profile.filter((entry) => entry.level > safeFrom).map((entry) => <option key={entry.level} value={entry.level}>Level {entry.level}</option>)}
            </select>
          </label>
        </div>

        <div className={styles.inventory}>
          {resources.map(([key, label]) => (
            <label key={key}>
              <span>Owned {label}</span>
              <input type="number" min="0" value={owned[key]} onChange={(event) => setOwned((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
        </div>
      </div>

      <div className={styles.summary}>
        {resources.map(([key, label]) => {
          const need = totals[key];
          const short = Math.max(0, need - Number(owned[key] || 0));
          return (
            <div key={key} className={styles.metric}>
              <span>{label}</span>
              <strong>{fmt(need)}</strong>
              <small>Short {fmt(short)}</small>
            </div>
          );
        })}
        <div className={styles.metric}>
          <span>Advancements crossed</span>
          <strong>{totals.advancements}</strong>
          <small>10-level advancement milestones</small>
        </div>
      </div>

      <div className={styles.breakdown}>
        <h2>Milestones in this push</h2>
        <div className={styles.rows}>
          {pet.profile.filter((entry) => entry.level > safeFrom && entry.level <= safeTo && entry.level % 10 === 0).map((entry) => (
            <div key={entry.level} className={styles.row}>
              <b>Level {entry.level}</b>
              <span>{fmt(entry.manuals)} manuals</span>
              <span>{fmt(entry.potions)} potions</span>
              <span>{fmt(entry.medallions)} medallions</span>
            </div>
          ))}
          {totals.advancements === 0 ? <p>No advancement threshold is crossed in this range.</p> : null}
        </div>
      </div>

      <p className={styles.note}>Generation-specific leveling curves are applied for Gray Wolf (Lv50), other Gen 1 pets (Lv60), Gen 2 (Lv70), Gen 3 (Lv80), and later pets (Lv100). Game values can change after patches; verify unusual breakpoints against the in-game upgrade screen.</p>
    </section>
  );
}

"use client";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CHARM_COSTS } from "../../lib/charmToolData.mjs";
import {
  PHASE2_DATASETS,
  calculatePetProgression,
  planTtgProduction,
  rankCharmUpgrades,
} from "../../lib/progressionPhase2.mjs";
import { useToolPersistence } from "../../lib/useToolPersistence";
import styles from "./Phase2Planner.module.css";

const number = (value) => Math.max(0, Number(value) || 0);
const fmt = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const inventoryKeys = ["food", "manuals", "potions", "medallions"];
const defaultCharms = ["Infantry", "Cavalry", "Archer"].flatMap((type) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${type.toLowerCase()}-${index + 1}`,
    type,
    number: index + 1,
    current: 0,
    target: 0,
  })),
);
const heroPieces = ["Helmet", "Chest", "Gloves", "Boots"];
const governorPieces = ["Helmet", "Chest", "Ring", "Staff", "Pants", "Boots"];

function MissingData({ dataset, children }) {
  return (
    <div className={styles.status}>
      <span aria-hidden="true">◇</span>
      <div>
        <b>Verified dataset required</b>
        <br />
        {children || (
          <>
            Calculation is intentionally blocked. Expected{" "}
            <code>{PHASE2_DATASETS[dataset].expectedShape}</code>.
          </>
        )}
      </div>
    </div>
  );
}
function SaveState({ persistence }) {
  return (
    <p className={styles.save} aria-live="polite">
      {persistence.message}
    </p>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "number",
  children,
  ...props
}) {
  return (
    <label>
      {label}
      {children || (
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              type === "number"
                ? number(event.target.value)
                : event.target.value,
            )
          }
          {...props}
        />
      )}
    </label>
  );
}

export function TtgProductionPlanner({
  importedTrueGold = 0,
  importedTempered = 0,
}) {
  const [inputs, setInputs] = useState({
    trueGold: importedTrueGold,
    temperedTrueGold: 0,
    dailyIncome: 0,
    reserve: 0,
    refinementState: 1,
    completedToday: 0,
    horizonDays: 7,
    requiredTrueGold: importedTrueGold,
    requiredTempered: importedTempered,
    targetDate: "",
    riskMode: "conservative",
    seed: 710,
  });
  const restore = useCallback(
    (saved) => setInputs((current) => ({ ...current, ...saved })),
    [],
  );
  const persistence = useToolPersistence({
    toolKey: "ttg-production",
    schemaVersion: 1,
    inputs,
    restore,
    autoDetect: true,
  });
  const update = (key, value) =>
    setInputs((current) => ({ ...current, [key]: value }));
  const result = useMemo(() => planTtgProduction(inputs, []), [inputs]);
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Inventory and safeguards</h2>
          <div className={styles.grid}>
            <Field
              label="Current True Gold"
              value={inputs.trueGold}
              onChange={(v) => update("trueGold", v)}
            />
            <Field
              label="Current Tempered True Gold"
              value={inputs.temperedTrueGold}
              onChange={(v) => update("temperedTrueGold", v)}
            />
            <Field
              label="Daily True Gold income"
              value={inputs.dailyIncome}
              onChange={(v) => update("dailyIncome", v)}
            />
            <Field
              label="Protected TG reserve"
              value={inputs.reserve}
              onChange={(v) => update("reserve", v)}
            />
            <Field
              label="Refinement state/day"
              value={inputs.refinementState}
              onChange={(v) => update("refinementState", v)}
            />
            <Field
              label="Completed today"
              value={inputs.completedToday}
              onChange={(v) => update("completedToday", v)}
            />
          </div>
        </div>
        <div className={styles.section}>
          <h2>Plan target</h2>
          <div className={styles.grid}>
            <Field
              label="Planning horizon (days)"
              value={inputs.horizonDays}
              onChange={(v) => update("horizonDays", v)}
              min="1"
            />
            <Field
              label="Required True Gold"
              value={inputs.requiredTrueGold}
              onChange={(v) => update("requiredTrueGold", v)}
            />
            <Field
              label="Required Tempered TG"
              value={inputs.requiredTempered}
              onChange={(v) => update("requiredTempered", v)}
            />
            <Field
              label="Target completion date"
              type="date"
              value={inputs.targetDate}
              onChange={(v) => update("targetDate", v)}
            />
            <Field
              label="Risk mode"
              value={inputs.riskMode}
              onChange={(v) => update("riskMode", v)}
            >
              <select
                value={inputs.riskMode}
                onChange={(e) => update("riskMode", e.target.value)}
              >
                <option value="guaranteed">Guaranteed</option>
                <option value="conservative">Conservative</option>
                <option value="expected">Expected</option>
              </select>
            </Field>
            <Field
              label="Reproducible seed"
              value={inputs.seed}
              onChange={(v) => update("seed", v)}
            />
          </div>
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Production schedule</h2>
        {result.status === "missing-data" ? (
          <MissingData dataset="ttg" />
        ) : null}
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span>Imported TG need</span>
            <b>{fmt(inputs.requiredTrueGold)}</b>
          </div>
          <div className={styles.metric}>
            <span>Imported TTG need</span>
            <b>{fmt(inputs.requiredTempered)}</b>
          </div>
        </div>
        <p className={styles.note}>
          Construction and advanced-research requirements remain visible, but no
          refinement rate, probability range, or achievable date is asserted
          until recipes are verified.
        </p>
      </aside>
    </div>
  );
}

export function PetProgressionPlanner() {
  const [inputs, setInputs] = useState({
    pet: "",
    generation: 1,
    currentLevel: 1,
    targetLevel: 1,
    currentAdvancement: 0,
    targetAdvancement: 0,
    budget: 0,
    deadline: "",
    inventory: Object.fromEntries(inventoryKeys.map((key) => [key, 0])),
  });
  const restore = useCallback(
    (saved) =>
      setInputs((current) => ({
        ...current,
        ...saved,
        inventory: { ...current.inventory, ...saved.inventory },
      })),
    [],
  );
  const persistence = useToolPersistence({
    toolKey: "pet-progression",
    schemaVersion: 1,
    inputs,
    restore,
    autoDetect: true,
  });
  const update = (key, value) =>
    setInputs((current) => ({ ...current, [key]: value }));
  const result = useMemo(() => calculatePetProgression(inputs, []), [inputs]);
  const packQuery = new URLSearchParams(
    Object.entries(result.shortfall || {}).map(([key, value]) => [
      key,
      String(value),
    ]),
  ).toString();
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Pet target</h2>
          <div className={styles.grid}>
            <Field
              label="Pet name/type"
              type="text"
              value={inputs.pet}
              onChange={(v) => update("pet", v)}
              placeholder="Select after dataset import"
            />
            <Field
              label="Generation"
              value={inputs.generation}
              onChange={(v) => update("generation", v)}
              min="1"
            />
            <Field
              label="Current level"
              value={inputs.currentLevel}
              onChange={(v) => update("currentLevel", v)}
              min="1"
            />
            <Field
              label="Target level"
              value={inputs.targetLevel}
              onChange={(v) => update("targetLevel", v)}
              min="1"
            />
            <Field
              label="Current advancement"
              value={inputs.currentAdvancement}
              onChange={(v) => update("currentAdvancement", v)}
            />
            <Field
              label="Target advancement"
              value={inputs.targetAdvancement}
              onChange={(v) => update("targetAdvancement", v)}
            />
          </div>
        </div>
        <div className={styles.section}>
          <h2>Current materials</h2>
          <div className={styles.grid}>
            {inventoryKeys.map((key) => (
              <Field
                key={key}
                label={key}
                value={inputs.inventory[key]}
                onChange={(v) =>
                  setInputs((current) => ({
                    ...current,
                    inventory: { ...current.inventory, [key]: v },
                  }))
                }
              />
            ))}
            <Field
              label="Optional budget"
              value={inputs.budget}
              onChange={(v) => update("budget", v)}
            />
            <Field
              label="Optional deadline"
              type="date"
              value={inputs.deadline}
              onChange={(v) => update("deadline", v)}
            />
          </div>
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Progression roadmap</h2>
        <MissingData dataset="pets" />
        <p className={styles.note}>
          The level-by-level roadmap, reachable level, material totals, chest
          equivalents, and remaining shortfall will activate from the same
          verified rows.
        </p>
        <Link
          className={styles.link}
          href={`/tools/pet-pack-optimizer${packQuery ? `?${packQuery}` : ""}`}
        >
          Send shortfall to Pet Pack Optimizer
        </Link>
      </aside>
    </div>
  );
}

export function CharmStatPlanner() {
  const [inputs, setInputs] = useState({
    charms: defaultCharms,
    guides: 0,
    designs: 0,
    troopWeights: { Infantry: 3, Cavalry: 2, Archer: 2 },
    statWeights: { Health: 1, Lethality: 1 },
    focus: {},
    minimumBalance: 0,
  });
  const restore = useCallback(
    (saved) => setInputs((current) => ({ ...current, ...saved })),
    [],
  );
  const persistence = useToolPersistence({
    toolKey: "governor-charm-stats",
    schemaVersion: 1,
    inputs,
    restore,
    autoDetect: true,
  });
  const ranked = useMemo(
    () =>
      rankCharmUpgrades(
        inputs.charms,
        CHARM_COSTS,
        { guides: inputs.guides, designs: inputs.designs },
        { troops: inputs.troopWeights, stats: inputs.statWeights },
        inputs.focus,
      ),
    [inputs],
  );
  const updateCharm = (id, key, value) =>
    setInputs((current) => ({
      ...current,
      charms: current.charms.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
              ...(key === "current" && value > item.target
                ? { target: value }
                : {}),
            }
          : item,
      ),
    }));
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Resources and subjective priorities</h2>
          <div className={styles.grid}>
            <Field
              label="Available Guides"
              value={inputs.guides}
              onChange={(v) => setInputs((c) => ({ ...c, guides: v }))}
            />
            <Field
              label="Available Designs"
              value={inputs.designs}
              onChange={(v) => setInputs((c) => ({ ...c, designs: v }))}
            />
            <Field
              label="Minimum balance constraint"
              value={inputs.minimumBalance}
              onChange={(v) => setInputs((c) => ({ ...c, minimumBalance: v }))}
            />
            {Object.keys(inputs.troopWeights).map((key) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={inputs.troopWeights[key]}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    troopWeights: { ...c.troopWeights, [key]: v },
                  }))
                }
              />
            ))}
            {Object.keys(inputs.statWeights).map((key) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={inputs.statWeights[key]}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    statWeights: { ...c.statWeights, [key]: v },
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className={styles.section}>
          <h2>All 18 charms</h2>
          {inputs.charms.map((charm) => (
            <div className={styles.row} key={charm.id}>
              <strong>
                {charm.type} #{charm.number}
              </strong>
              <Field
                label="Current"
                value={charm.current}
                onChange={(v) =>
                  updateCharm(charm.id, "current", Math.min(22, v))
                }
              />
              <Field
                label="Target"
                value={charm.target}
                onChange={(v) =>
                  updateCharm(
                    charm.id,
                    "target",
                    Math.max(charm.current, Math.min(22, v)),
                  )
                }
              />
              <Field
                label="Stat focus"
                value={inputs.focus[charm.id] || ""}
                onChange={() => {}}
              >
                <select
                  value={inputs.focus[charm.id] || ""}
                  onChange={(e) =>
                    setInputs((c) => ({
                      ...c,
                      focus: { ...c.focus, [charm.id]: e.target.value },
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  <option value="Health">Health</option>
                  <option value="Lethality">Lethality</option>
                </select>
              </Field>
            </div>
          ))}
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Recommended upgrade sequence</h2>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span>Upgrades reachable</span>
            <b>{ranked.upgrades.length}</b>
          </div>
          <div className={styles.metric}>
            <span>Guides / Designs left</span>
            <b>
              {fmt(ranked.remaining.guides)} / {fmt(ranked.remaining.designs)}
            </b>
          </div>
        </div>
        {ranked.upgrades.length ? (
          <ol className={styles.list}>
            {ranked.upgrades.map((item) => (
              <li key={`${item.id}-${item.level}`}>
                {item.type} #{item.number} → level {item.level} · {item.guides}{" "}
                Guides · {item.designs} Designs
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.note}>
            Enter inventory and targets to build an exact material-feasible
            sequence.
          </p>
        )}
        <MissingData dataset="charmStats">
          Material ordering is active from verified charm costs. Before/after
          stat gains and weighted stat efficiency remain blocked until the
          charm-stat table is verified.
        </MissingData>
        <Link className={styles.link} href="/tools/charm-pack-optimizer">
          Build required pack schedule
        </Link>
      </aside>
    </div>
  );
}

function EquipmentRows({ pieces, rows, setRows, hero = false }) {
  return (
    <div className={styles.section}>
      <h2>{hero ? "Twelve hero gear pieces" : "Six Governor Gear pieces"}</h2>
      {rows.map((row, index) => (
        <div className={styles.row} key={row.id}>
          <strong>{row.label}</strong>
          <Field
            label="Rarity / tier"
            type="text"
            value={row.tier}
            onChange={(v) =>
              setRows((current) =>
                current.map((item, i) =>
                  i === index ? { ...item, tier: v } : item,
                ),
              )
            }
          />
          {hero ? (
            <>
              <Field
                label="Enhancement"
                value={row.enhancement}
                onChange={(v) =>
                  setRows((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, enhancement: v } : item,
                    ),
                  )
                }
              />
              <Field
                label="Mastery"
                value={row.mastery}
                onChange={(v) =>
                  setRows((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, mastery: v } : item,
                    ),
                  )
                }
              />
              <Field
                label="Ascension"
                value={row.ascension}
                onChange={(v) =>
                  setRows((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, ascension: v } : item,
                    ),
                  )
                }
              />
              <Field
                label="Imbuement"
                value={row.imbuement}
                onChange={(v) =>
                  setRows((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, imbuement: v } : item,
                    ),
                  )
                }
              />
              <Field
                label="Current stat contribution"
                value={row.currentStat}
                onChange={(v) =>
                  setRows((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, currentStat: v } : item,
                    ),
                  )
                }
              />
            </>
          ) : (
            <Field
              label="Target tier"
              type="text"
              value={row.targetTier}
              onChange={(v) =>
                setRows((current) =>
                  current.map((item, i) =>
                    i === index ? { ...item, targetTier: v } : item,
                  ),
                )
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function HeroGearPlanner() {
  const [rows, setRows] = useState(() =>
    ["Infantry", "Cavalry", "Archer"].flatMap((troop) =>
      heroPieces.map((slot) => ({
        id: `${troop}-${slot}`,
        label: `${troop} ${slot}`,
        tier: "",
        enhancement: 0,
        mastery: 0,
        ascension: 0,
        imbuement: 0,
        currentStat: 0,
      })),
    ),
  );
  const [inputs, setInputs] = useState({
    role: "rally-leader",
    activity: "pvp",
    mode: "inventory",
    xp: 0,
    consumableGear: 0,
    forgehammers: 0,
    mythicPieces: 0,
    mithril: 0,
    safeXpReforging: true,
    troopWeights: { Infantry: 3, Cavalry: 2, Archer: 2 },
    statWeights: { Health: 1, Lethality: 1 },
  });
  const saved = useMemo(() => ({ rows, ...inputs }), [rows, inputs]);
  const restore = useCallback((state) => {
    if (Array.isArray(state.rows)) setRows(state.rows);
    setInputs((c) => ({ ...c, ...state, rows: undefined }));
  }, []);
  const persistence = useToolPersistence({
    toolKey: "hero-gear",
    schemaVersion: 1,
    inputs: saved,
    restore,
    autoDetect: true,
  });
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Planning controls</h2>
          <div className={styles.grid}>
            <Field label="Role" value={inputs.role} onChange={() => {}}>
              <select
                value={inputs.role}
                onChange={(e) =>
                  setInputs((c) => ({ ...c, role: e.target.value }))
                }
              >
                <option value="rally-leader">Rally leader</option>
                <option value="rally-joiner">Rally joiner</option>
              </select>
            </Field>
            <Field label="Profile" value={inputs.activity} onChange={() => {}}>
              <select
                value={inputs.activity}
                onChange={(e) =>
                  setInputs((c) => ({ ...c, activity: e.target.value }))
                }
              >
                <option value="pvp">PvP</option>
                <option value="pve">PvE</option>
              </select>
            </Field>
            <Field label="Mode" value={inputs.mode} onChange={() => {}}>
              <select
                value={inputs.mode}
                onChange={(e) =>
                  setInputs((c) => ({ ...c, mode: e.target.value }))
                }
              >
                <option value="inventory">Available inventory</option>
                <option value="targets">Target planning</option>
              </select>
            </Field>
          </div>
        </div>
        <EquipmentRows hero rows={rows} setRows={setRows} />
        <div className={styles.section}>
          <h2>Editable priority profile</h2>
          <div className={styles.grid}>
            {Object.entries(inputs.troopWeights).map(([key, value]) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={value}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    troopWeights: { ...c.troopWeights, [key]: v },
                  }))
                }
              />
            ))}
            {Object.entries(inputs.statWeights).map(([key, value]) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={value}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    statWeights: { ...c.statWeights, [key]: v },
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className={styles.section}>
          <h2>Available resources</h2>
          <div className={styles.grid}>
            {[
              ["xp", "Enhancement XP"],
              ["consumableGear", "Consumable gear"],
              ["forgehammers", "Forgehammers"],
              ["mythicPieces", "Mythic pieces"],
              ["mithril", "Mithril"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={inputs[key]}
                onChange={(v) => setInputs((c) => ({ ...c, [key]: v }))}
              />
            ))}
          </div>
          <label className={styles.note}>
            <input
              type="checkbox"
              checked={inputs.safeXpReforging}
              onChange={(e) =>
                setInputs((c) => ({ ...c, safeXpReforging: e.target.checked }))
              }
            />{" "}
            Include safe XP reforging. Destructive mastery reforging is never
            recommended.
          </label>
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Upgrade plan</h2>
        <MissingData dataset="heroGear" />
        <p className={styles.note}>
          The saved model already covers rarity, enhancement, mastery, ascension
          and imbuement for all 12 pieces. Ordered steps, before/after stats,
          weighted gain, alternatives and near misses activate only from
          verified rows.
        </p>
      </aside>
    </div>
  );
}

export function GovernorGearPlanner() {
  const [rows, setRows] = useState(() =>
    governorPieces.map((piece) => ({
      id: piece,
      label: piece,
      tier: "",
      targetTier: "",
    })),
  );
  const [inputs, setInputs] = useState({
    mode: "targets",
    satin: 0,
    threads: 0,
    visions: 0,
    balance: 0,
    troopWeights: { Infantry: 3, Cavalry: 2, Archer: 2 },
    statWeights: { Health: 1, Lethality: 1 },
  });
  const saved = useMemo(() => ({ rows, ...inputs }), [rows, inputs]);
  const restore = useCallback((state) => {
    if (Array.isArray(state.rows)) setRows(state.rows);
    setInputs((c) => ({ ...c, ...state, rows: undefined }));
  }, []);
  const persistence = useToolPersistence({
    toolKey: "governor-gear",
    schemaVersion: 1,
    inputs: saved,
    restore,
    autoDetect: true,
  });
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Mode and inventory</h2>
          <div className={styles.grid}>
            <Field
              label="Planning mode"
              value={inputs.mode}
              onChange={() => {}}
            >
              <select
                value={inputs.mode}
                onChange={(e) =>
                  setInputs((c) => ({ ...c, mode: e.target.value }))
                }
              >
                <option value="targets">Target cost planner</option>
                <option value="inventory">Best use of materials</option>
              </select>
            </Field>
            <Field
              label="Satin"
              value={inputs.satin}
              onChange={(v) => setInputs((c) => ({ ...c, satin: v }))}
            />
            <Field
              label="Gilded Threads"
              value={inputs.threads}
              onChange={(v) => setInputs((c) => ({ ...c, threads: v }))}
            />
            <Field
              label="Artisan’s Visions"
              value={inputs.visions}
              onChange={(v) => setInputs((c) => ({ ...c, visions: v }))}
            />
            <Field
              label="Minimum balance"
              value={inputs.balance}
              onChange={(v) => setInputs((c) => ({ ...c, balance: v }))}
            />
          </div>
        </div>
        <EquipmentRows pieces={governorPieces} rows={rows} setRows={setRows} />
        <div className={styles.section}>
          <h2>Editable priority profile</h2>
          <div className={styles.grid}>
            {Object.entries(inputs.troopWeights).map(([key, value]) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={value}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    troopWeights: { ...c.troopWeights, [key]: v },
                  }))
                }
              />
            ))}
            {Object.entries(inputs.statWeights).map(([key, value]) => (
              <Field
                key={key}
                label={`${key} weight`}
                value={value}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    statWeights: { ...c.statWeights, [key]: v },
                  }))
                }
              />
            ))}
          </div>
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Governor Gear plan</h2>
        <MissingData dataset="governorGear" />
        <p className={styles.note}>
          Per-piece costs, stat gains, set bonuses, milestones and
          opportunity-cost ranking will be calculated together after the source
          table is verified. Saved Player Profile/OCR tiers can then populate
          these six rows.
        </p>
      </aside>
    </div>
  );
}

export function MastersPlanner() {
  const [inputs, setInputs] = useState({
    master: "",
    expertLevel: 0,
    relationshipClass: "",
    relationshipProgress: 0,
    talentLevel: 0,
    affinity: 0,
    emblems: 0,
    manuscripts: 0,
    learningSpeed: 0,
    skills: [{ name: "Skill 1", level: 0, partialXp: 0 }],
  });
  const restore = useCallback(
    (saved) => setInputs((current) => ({ ...current, ...saved })),
    [],
  );
  const persistence = useToolPersistence({
    toolKey: "masters",
    schemaVersion: 1,
    inputs,
    restore,
    autoDetect: true,
  });
  const update = (key, value) =>
    setInputs((current) => ({ ...current, [key]: value }));
  return (
    <div className={styles.workspace}>
      <section className={styles.panel}>
        <SaveState persistence={persistence} />
        <div className={styles.section}>
          <h2>Master progression</h2>
          <div className={styles.grid}>
            <Field
              label="Master"
              type="text"
              value={inputs.master}
              onChange={(v) => update("master", v)}
            />
            <Field
              label="Expert level"
              value={inputs.expertLevel}
              onChange={(v) => update("expertLevel", v)}
            />
            <Field
              label="Relationship class"
              type="text"
              value={inputs.relationshipClass}
              onChange={(v) => update("relationshipClass", v)}
            />
            <Field
              label="Relationship progress"
              value={inputs.relationshipProgress}
              onChange={(v) => update("relationshipProgress", v)}
            />
            <Field
              label="Talent level"
              value={inputs.talentLevel}
              onChange={(v) => update("talentLevel", v)}
            />
            <Field
              label="Learning speed (%)"
              value={inputs.learningSpeed}
              onChange={(v) => update("learningSpeed", v)}
            />
          </div>
        </div>
        <div className={styles.section}>
          <h2>Inventory</h2>
          <div className={styles.grid}>
            <Field
              label="Affinity"
              value={inputs.affinity}
              onChange={(v) => update("affinity", v)}
            />
            <Field
              label="Emblems"
              value={inputs.emblems}
              onChange={(v) => update("emblems", v)}
            />
            <Field
              label="Manuscripts"
              value={inputs.manuscripts}
              onChange={(v) => update("manuscripts", v)}
            />
          </div>
        </div>
        <div className={styles.section}>
          <h2>Skills and partially learned XP</h2>
          {inputs.skills.map((skill, index) => (
            <div className={styles.row} key={index}>
              <Field
                label="Skill"
                type="text"
                value={skill.name}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    skills: c.skills.map((item, i) =>
                      i === index ? { ...item, name: v } : item,
                    ),
                  }))
                }
              />
              <Field
                label="Level"
                value={skill.level}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    skills: c.skills.map((item, i) =>
                      i === index ? { ...item, level: v } : item,
                    ),
                  }))
                }
              />
              <Field
                label="Partial XP"
                value={skill.partialXp}
                onChange={(v) =>
                  setInputs((c) => ({
                    ...c,
                    skills: c.skills.map((item, i) =>
                      i === index ? { ...item, partialXp: v } : item,
                    ),
                  }))
                }
              />
            </div>
          ))}
          <button
            className={styles.button}
            type="button"
            onClick={() =>
              setInputs((c) => ({
                ...c,
                skills: [
                  ...c.skills,
                  {
                    name: `Skill ${c.skills.length + 1}`,
                    level: 0,
                    partialXp: 0,
                  },
                ],
              }))
            }
          >
            Add skill
          </button>
        </div>
      </section>
      <aside className={styles.result}>
        <h2>Best next investment</h2>
        <MissingData dataset="masters" />
        <p className={styles.note}>
          Required resources, remaining shortfall, learning time, power and buff
          gains, skill roadmap, and comparisons between Masters remain
          deliberately uncalculated until Master-specific values are verified.
        </p>
      </aside>
    </div>
  );
}

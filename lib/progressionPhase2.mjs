export const PHASE2_DATASETS = Object.freeze({
  ttg: {
    key: "ttg-refinement",
    available: false,
    expectedShape:
      "array of { state, refinementNumber, inputTrueGold, outputMin, outputExpected, outputMax, dailyLimit }",
  },
  pets: {
    key: "pet-progression",
    available: false,
    expectedShape:
      "array of { pet, generation, fromLevel, toLevel, food, manuals, potions, medallions }",
  },
  charmStats: {
    key: "charm-stats",
    available: false,
    expectedShape:
      "array of { troopType, charmNumber, level, health, lethality }",
  },
  heroGear: {
    key: "hero-gear",
    available: false,
    expectedShape:
      "array of { slot, rarity, enhancement, mastery, ascension, imbuement, costs, stats }",
  },
  governorGear: {
    key: "governor-gear",
    available: false,
    expectedShape:
      "array of { piece, tier, satin, threads, visions, stats, setBonus }",
  },
  masters: {
    key: "masters",
    available: false,
    expectedShape:
      "array of { master, expertLevel, relationship, talent, skills, costs, learningSeconds, power, buffs }",
  },
});

export function planTtgProduction(input, recipes = []) {
  if (!Array.isArray(recipes) || recipes.length === 0)
    return { status: "missing-data", schedule: [] };
  const days = Math.max(1, Math.trunc(input.horizonDays || 1));
  let tg = Math.max(0, Number(input.trueGold) || 0);
  let ttg = Math.max(0, Number(input.temperedTrueGold) || 0);
  const reserve = Math.max(0, Number(input.reserve) || 0);
  const income = Math.max(0, Number(input.dailyIncome) || 0);
  const target = Math.max(0, Number(input.requiredTempered) || 0);
  const schedule = [];
  for (let day = 1; day <= days; day += 1) {
    tg += income;
    const recipe =
      recipes.find((item) => item.state === input.refinementState) ||
      recipes[0];
    const limit = Math.max(0, Math.trunc(recipe.dailyLimit || 0));
    const completed =
      day === 1 ? Math.max(0, Math.trunc(input.completedToday || 0)) : 0;
    const availableRuns = Math.max(0, limit - completed);
    const affordableRuns =
      recipe.inputTrueGold > 0
        ? Math.floor(Math.max(0, tg - reserve) / recipe.inputTrueGold)
        : 0;
    const runs = Math.min(availableRuns, affordableRuns);
    tg -= runs * recipe.inputTrueGold;
    const rate =
      input.riskMode === "guaranteed"
        ? recipe.outputMin
        : input.riskMode === "expected"
          ? recipe.outputExpected
          : (recipe.outputMin + recipe.outputExpected) / 2;
    ttg += runs * rate;
    schedule.push({
      day,
      runs,
      trueGoldSpent: runs * recipe.inputTrueGold,
      temperedProduced: runs * rate,
      trueGoldRemaining: tg,
      temperedTotal: ttg,
    });
  }
  const reached = schedule.find((row) => row.temperedTotal >= target);
  return {
    status: reached ? "achievable" : "shortfall",
    earliestDay: reached?.day || null,
    schedule,
    finalTrueGold: tg,
    finalTempered: ttg,
  };
}

export function calculatePetProgression(input, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0)
    return { status: "missing-data", steps: [], totals: {} };
  const selected = rows.filter(
    (row) =>
      row.pet === input.pet &&
      row.generation === input.generation &&
      row.fromLevel >= input.currentLevel &&
      row.toLevel <= input.targetLevel,
  );
  const keys = ["food", "manuals", "potions", "medallions"];
  const totals = Object.fromEntries(
    keys.map((key) => [
      key,
      selected.reduce((sum, row) => sum + (Number(row[key]) || 0), 0),
    ]),
  );
  const shortfall = Object.fromEntries(
    keys.map((key) => [
      key,
      Math.max(0, totals[key] - (Number(input.inventory?.[key]) || 0)),
    ]),
  );
  return {
    status: selected.length ? "complete" : "missing-range",
    steps: selected,
    totals,
    shortfall,
  };
}

export function rankCharmUpgrades(
  charms,
  costs,
  inventory,
  weights,
  focus = {},
) {
  let guides = Math.max(0, Number(inventory.guides) || 0),
    designs = Math.max(0, Number(inventory.designs) || 0);
  const candidates = [];
  for (const charm of charms) {
    for (let level = charm.current + 1; level <= charm.target; level += 1) {
      const cost = costs[level];
      if (!cost) continue;
      const stat = focus[charm.id];
      candidates.push({
        ...charm,
        level,
        guides: cost[0],
        designs: cost[1],
        score:
          (weights.troops?.[charm.type] || 0) *
          (stat ? weights.stats?.[stat] || 0 : 1),
      });
    }
  }
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.guides + a.designs - b.guides - b.designs ||
      a.id.localeCompare(b.id) ||
      a.level - b.level,
  );
  const upgrades = [],
    achieved = {};
  let moved = true;
  while (moved) {
    moved = false;
    for (let index = 0; index < candidates.length; index += 1) {
      const item = candidates[index];
      if (
        item.level !== (achieved[item.id] ?? item.current) + 1 ||
        item.guides > guides ||
        item.designs > designs
      )
        continue;
      guides -= item.guides;
      designs -= item.designs;
      achieved[item.id] = item.level;
      upgrades.push(item);
      candidates.splice(index, 1);
      moved = true;
      break;
    }
  }
  return {
    upgrades,
    remaining: { guides, designs },
    next:
      candidates.find(
        (item) => item.level === (achieved[item.id] ?? item.current) + 1,
      ) || null,
  };
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePetProgression,
  planTtgProduction,
  rankCharmUpgrades,
} from "../lib/progressionPhase2.mjs";

test("TTG planner blocks calculation without verified recipes", () => {
  assert.equal(
    planTtgProduction({ horizonDays: 7 }, []).status,
    "missing-data",
  );
});

test("TTG planner preserves reserve and reports the earliest achievable day", () => {
  const result = planTtgProduction(
    {
      trueGold: 100,
      dailyIncome: 10,
      reserve: 50,
      horizonDays: 3,
      refinementState: 1,
      completedToday: 0,
      requiredTempered: 12,
      riskMode: "guaranteed",
    },
    [
      {
        state: 1,
        inputTrueGold: 20,
        outputMin: 4,
        outputExpected: 5,
        dailyLimit: 2,
      },
    ],
  );
  assert.equal(result.earliestDay, 2);
  assert.ok(result.schedule.every((day) => day.trueGoldRemaining >= 50));
});

test("pet progression totals verified rows and current inventory shortfalls", () => {
  const result = calculatePetProgression(
    {
      pet: "Wolf",
      generation: 1,
      currentLevel: 1,
      targetLevel: 3,
      inventory: { food: 3 },
    },
    [
      { pet: "Wolf", generation: 1, fromLevel: 1, toLevel: 2, food: 5 },
      { pet: "Wolf", generation: 1, fromLevel: 2, toLevel: 3, food: 7 },
    ],
  );
  assert.equal(result.totals.food, 12);
  assert.equal(result.shortfall.food, 9);
});

test("charm ranking honors priorities, inventory, and sequential levels", () => {
  const charms = [
    { id: "i1", type: "Infantry", current: 0, target: 2 },
    { id: "a1", type: "Archer", current: 0, target: 1 },
  ];
  const result = rankCharmUpgrades(
    charms,
    [null, [2, 2], [3, 3]],
    { guides: 4, designs: 4 },
    { troops: { Infantry: 3, Archer: 1 }, stats: {} },
  );
  assert.deepEqual(
    result.upgrades.map((item) => `${item.id}:${item.level}`),
    ["i1:1", "a1:1"],
  );
  assert.equal(result.remaining.guides, 0);
});

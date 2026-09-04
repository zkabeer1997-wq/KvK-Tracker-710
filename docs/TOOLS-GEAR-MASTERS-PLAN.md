# Governor Gear, Hero Gear & Masters tools plan

## Audit finding

The three category pages were empty shells. The first release should cover the recurring decisions players actually make: what an upgrade costs, what inventory is missing, and where scarce progression materials should go.

## Release 1 — built on this branch

1. **Governor Gear Upgrade Planner** — choose current and target tier for each of the six slots, enter Satin, Gilded Threads and Artisan's Vision inventory, and see exact totals and shortfalls through Red T6.
2. **Hero Gear Upgrade Planner** — plan an enhancement checkpoint and Mastery target, enforce the published red-gear Mastery gates, and calculate XP, Forgehammers, Mythic Gear and Mithril shortfalls.
3. **Master Focus Planner** — choose the account goal and receive an ordered Master focus recommendation with a breakpoint-first spending plan.

## Release 2 candidates

- Governor Gear: compare two upgrade routes by stat gain per scarce material; sync all six saved Player Profile gear slots.
- Hero Gear: add a full 12-piece loadout optimizer and weighted Infantry/Cavalry/Archer stat profiles.
- Masters: add exact Affinity, Emblem, Manuscript, learning-time and power calculations once complete level tables for all active Masters can be corroborated.

## Data and guardrails

- Governor Gear requirements use the current Kingshot.net database (58 stages, Green through Red T6).
- Hero Gear uses published cumulative enhancement checkpoints and the exact Mastery formula (`target level × 10` Forgehammers). Red milestone gates and material costs are shown separately.
- The Master tool deliberately recommends focus order rather than inventing incomplete costs. It includes the six Masters listed by the current calculator and labels recommendations as strategy, not game rules.
- All calculators subtract inventory, keep calculation local in the browser, and link their research sources in the interface.

# Kingshot calculator data notes

This implementation is an independent calculator suite. It does not copy source code, written guides, UI layouts, or recommendation/optimization algorithms from third-party calculator sites.

## Functional references reviewed

- https://www.kingshotcalculator.net/
- https://www.kingshotcalculator.net/governor-gear-calculator
- https://www.kingshotcalculator.net/governor-charm-calculator
- https://www.kingshotcalculator.net/pets-upgrade-calculator
- https://www.kingshotcalculator.net/forgehammer-calculator
- https://www.kingshotcalculator.net/forgehammer-set-calculator
- https://www.kingshotcalculator.net/vip-calculator
- https://kingshotoptimizer.com/calculators/
- https://kingshotoptimizer.com/calculators/how-it-works/
- https://kingshotoptimizer.com/calculators/troops/
- https://kingshotoptimizer.com/calculators/hero-shards/
- https://kingshotoptimizer.com/calculators/hero-gear/

The pages above were used to identify calculator categories, expected inputs, and expected output types only. Optimizer/recommendation functions are intentionally excluded.

## Game-data cross-checks

Where practical, values were cross-checked against public community references and the MIT-licensed KingShot-Helper project:

- https://github.com/ko9ma7/KingShot-Helper
- Hero XP: current community level table through level 80
- Hero shards: 1,065 total shards from 0 to fully completed 5-star ascension
- Hero widgets: 275 widgets total from exclusive gear level 0 to 10
- Mastery forging: 2,100 Forgehammers and 55 Mythic Gear from mastery 0 to 20 per gear piece
- Governor Charms: level 1 through 22 material progression
- Governor Gear: current progression stages through Red T6 3-star
- Troops: T1 through T11 resource, time, power, and event-point values

## Validation benchmarks

- Governor Gear, one piece from Not Crafted through Red T6 3-star: 9,967,500 Satin; 99,680 Gilded Threads; 20,305 Artisan's Vision.
- Governor Charm, one charm from level 0 through 22: 10,880 Charm Guides; 19,200 Charm Designs.
- Hero XP, level 1 through 80: 23,641,790 XP.
- Hero shards, 0 stars through completed 5 stars: 1,065 shards.
- Hero widgets, level 0 through 10: 275 widgets.
- Hero Gear Mastery, level 0 through 20: 2,100 Forgehammers and 55 Mythic Gear per piece.

Game values can change after patches. The in-game upgrade screen remains the final authority.

export const VALUE_TIERS = {
  IB: { label: 'Instant Buy', rank: 0 },
  C: { label: 'Consider', rank: 1 },
  A: { label: 'Avoid', rank: 2 },
  U: { label: 'Unranked', rank: 3 },
};

export const SHOP_ITEMS = [
  { key: 'triton', name: 'Triton Shard', essence: 20, reward: 1, unit: 'shard', max: 1075, tier: 'U' },
  { key: 'sophia', name: 'Sophia Shard', essence: 20, reward: 1, unit: 'shard', max: 1075, tier: 'U' },
  { key: 'yang', name: 'Yang Shard', essence: 20, reward: 1, unit: 'shard', max: 1075, tier: 'U' },
  { key: 'mythic-gear', name: 'Mythic Gold Hero Gear', essence: 1000, reward: 1, unit: 'piece', max: 2, tier: 'U' },
  { key: 'hero-chests', name: 'Hero Gear Random Chests', essence: 200, reward: 24, unit: 'chests', max: 100, tier: 'A', comparison: 125 },
  { key: 'forgehammers', name: 'Forgehammers', essence: 200, reward: 24, unit: 'hammers', max: 40, tier: 'U' },
  { key: 'mithril', name: 'Mithril', essence: 160, reward: 1, unit: 'Mithril', max: 25, tier: 'IB', comparison: 80 },
  { key: 'visions', name: "Artisan's Vision", essence: 40, reward: 18, unit: 'visions', max: 100, tier: 'C', comparison: 106 },
  { key: 'threads', name: 'Gilded Thread', essence: 40, reward: 90, unit: 'threads', max: 100, tier: 'IB', comparison: 96 },
  { key: 'satin', name: 'Satin', essence: 40, reward: 9000, unit: 'Satin', max: 100, tier: 'IB', comparison: 96 },
  { key: 'designs', name: 'Charm Designs', essence: 80, reward: 28, unit: 'designs', max: 100, tier: 'C', comparison: 114 },
  { key: 'guides', name: 'Charm Guides', essence: 80, reward: 28, unit: 'guides', max: 100, tier: 'C', comparison: 114 },
  { key: 'pet-food', name: 'Pet Food', essence: 40, reward: 3000, unit: 'food', max: 50, tier: 'IB', comparison: 100 },
  { key: 'pet-chests', name: 'Pet Advancement Chests', essence: 80, reward: 4, unit: 'chests', max: 50, tier: 'A', comparison: 180 },
  { key: 'pet-refinement', name: 'Advanced Pet Refinement', essence: 80, reward: 1, unit: 'refinement', max: 50, tier: 'A', comparison: 240 },
  { key: 'truegold', name: 'Truegold', essence: 40, reward: 16, unit: 'pieces', max: 50, tier: 'IB', comparison: 84 },
];

export const VALUE_REFERENCE = [
  { name: 'Mithril', comparison: 80, tier: 'IB' },
  { name: 'Truegold', comparison: 84, tier: 'IB' },
  { name: 'Gilded Thread', comparison: 96, tier: 'IB' },
  { name: 'Satin', comparison: 96, tier: 'IB' },
  { name: 'Pet Food', comparison: 100, tier: 'IB' },
  { name: '1h Research Speedup', comparison: 78, tier: 'IB', unavailable: true },
  { name: "Artisan's Vision", comparison: 106, tier: 'C' },
  { name: 'Charm Design', comparison: 114, tier: 'C' },
  { name: 'Charm Guide', comparison: 114, tier: 'C' },
  { name: 'Lucky Hero Gear Chests', comparison: 125, tier: 'A' },
  { name: 'Pet Advancement Chest', comparison: 180, tier: 'A' },
  { name: 'Advanced Taming Marks', comparison: 240, tier: 'A' },
  { name: '1h General Speedup', comparison: 128, tier: 'A', unavailable: true },
  { name: '1h Training Speedup', comparison: 120, tier: 'A', unavailable: true },
].sort((a, b) => VALUE_TIERS[a.tier].rank - VALUE_TIERS[b.tier].rank || a.comparison - b.comparison);

export const PACKS = [
  { key: 'daily-300', name: 'Daily Caravan Pack', essence: 300, cents: 499, defaultMax: 1, daily: true },
  { key: '200', name: '200 Essence Pack', essence: 200, cents: 499, defaultMax: 20 },
  { key: '400', name: '400 Essence Pack', essence: 400, cents: 999, defaultMax: 20 },
  { key: '800', name: '800 Essence Pack', essence: 800, cents: 1999, defaultMax: 20 },
  { key: '2000', name: '2,000 Essence Pack', essence: 2000, cents: 4999, defaultMax: 20 },
  { key: '4000', name: '4,000 Essence Pack', essence: 4000, cents: 9999, defaultMax: 20 },
];

export function optimizeEssencePacks(requiredEssence, limits) {
  const target = Math.max(0, Math.ceil(Number(requiredEssence) || 0));
  if (target === 0) return { costCents: 0, essence: 0, overage: 0, count: 0, quantities: Object.fromEntries(PACKS.map((pack) => [pack.key, 0])) };

  const unit = 20;
  const maxUnits = PACKS.reduce((sum, pack) => sum + (pack.essence / unit) * Math.max(0, Number(limits[pack.key]) || 0), 0);
  const targetUnits = Math.ceil(target / unit);
  if (targetUnits > maxUnits) return null;

  let states = new Map([[0, { costCents: 0, count: 0, quantities: Array(PACKS.length).fill(0) }]]);
  PACKS.forEach((pack, packIndex) => {
    const next = new Map();
    const maximum = Math.max(0, Math.floor(Number(limits[pack.key]) || 0));
    for (const [currentUnits, state] of states) {
      for (let quantity = 0; quantity <= maximum; quantity += 1) {
        const amount = currentUnits + quantity * (pack.essence / unit);
        const candidate = {
          costCents: state.costCents + quantity * pack.cents,
          count: state.count + quantity,
          quantities: state.quantities.map((value, index) => index === packIndex ? value + quantity : value),
        };
        const existing = next.get(amount);
        if (!existing || candidate.costCents < existing.costCents || (candidate.costCents === existing.costCents && candidate.count < existing.count)) next.set(amount, candidate);
      }
    }
    states = next;
  });

  let best = null;
  for (const [amountUnits, state] of states) {
    if (amountUnits < targetUnits) continue;
    const candidate = { ...state, amountUnits };
    if (!best || candidate.costCents < best.costCents || (candidate.costCents === best.costCents && candidate.amountUnits < best.amountUnits) || (candidate.costCents === best.costCents && candidate.amountUnits === best.amountUnits && candidate.count < best.count)) best = candidate;
  }
  if (!best) return null;
  const essence = best.amountUnits * unit;
  return {
    costCents: best.costCents,
    essence,
    overage: essence - target,
    count: best.count,
    quantities: Object.fromEntries(PACKS.map((pack, index) => [pack.key, best.quantities[index]])),
  };
}

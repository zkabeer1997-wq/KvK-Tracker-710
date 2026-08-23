// Shared Charms and Governor Gear dropdown options.

export const CHARM_LEVEL_OPTIONS = Array.from(
  { length: 22 },
  (_, index) => `Level ${index + 1}`,
);

function gearTierOptions(color, tierCount) {
  const options = [];
  for (let tier = 0; tier < tierCount; tier += 1) {
    const base = tier === 0 ? color : `${color} T${tier}`;
    options.push(base, `${base} ★`, `${base} ★★`, `${base} ★★★`);
  }
  return options;
}

export const GOVERNOR_GEAR_OPTIONS = [
  'Green',
  'Green 1 star',
  'Blue',
  'Blue 1 star',
  'Blue 2 stars',
  'Blue 3 stars',
  'Purple',
  'Purple 1 star',
  'Purple 2 stars',
  'Purple 3 stars',
  'Purple T1',
  'Purple T1 1 star',
  'Purple T1 2 stars',
  'Purple T1 3 stars',
  ...gearTierOptions('Gold', 4),
  ...gearTierOptions('Red', 7),
];

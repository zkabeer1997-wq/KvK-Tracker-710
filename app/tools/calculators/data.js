export const GOVERNOR_SLOTS = [
  { key: 'infantry-coat', troop: 'Infantry', label: 'Coat' },
  { key: 'infantry-pants', troop: 'Infantry', label: 'Pants' },
  { key: 'cavalry-cap', troop: 'Cavalry', label: 'Cap' },
  { key: 'cavalry-watch', troop: 'Cavalry', label: 'Watch' },
  { key: 'archer-belt', troop: 'Archer', label: 'Belt' },
  { key: 'archer-weapon', troop: 'Archer', label: 'Weapon' },
];

export const GOVERNOR_GEAR_STAGES = [
  { label: 'Not Crafted', satin: 0, threads: 0, visions: 0 },
  { label: 'Green', satin: 1500, threads: 15, visions: 0 },
  { label: 'Green 1 star', satin: 3800, threads: 40, visions: 0 },
  { label: 'Blue', satin: 7000, threads: 70, visions: 0 },
  { label: 'Blue 1 star', satin: 9700, threads: 95, visions: 0 },
  { label: 'Blue 2 stars', satin: 1000, threads: 10, visions: 45 },
  { label: 'Blue 3 stars', satin: 1000, threads: 10, visions: 50 },
  { label: 'Purple', satin: 1500, threads: 15, visions: 60 },
  { label: 'Purple 1 star', satin: 1500, threads: 15, visions: 70 },
  { label: 'Purple 2 stars', satin: 6500, threads: 65, visions: 40 },
  { label: 'Purple 3 stars', satin: 8000, threads: 80, visions: 50 },
  { label: 'Purple T1', satin: 10000, threads: 95, visions: 60 },
  { label: 'Purple T1 1 star', satin: 11000, threads: 110, visions: 70 },
  { label: 'Purple T1 2 stars', satin: 13000, threads: 130, visions: 85 },
  { label: 'Purple T1 3 stars', satin: 15000, threads: 160, visions: 100 },
  { label: 'Gold', satin: 22000, threads: 220, visions: 40 },
  { label: 'Gold 1 star', satin: 23000, threads: 230, visions: 40 },
  { label: 'Gold 2 stars', satin: 25000, threads: 250, visions: 45 },
  { label: 'Gold 3 stars', satin: 26000, threads: 260, visions: 45 },
  { label: 'Gold T1', satin: 28000, threads: 280, visions: 45 },
  { label: 'Gold T1 1 star', satin: 30000, threads: 300, visions: 55 },
  { label: 'Gold T1 2 stars', satin: 32000, threads: 320, visions: 55 },
  { label: 'Gold T1 3 stars', satin: 35000, threads: 340, visions: 55 },
  { label: 'Gold T2', satin: 38000, threads: 360, visions: 55 },
  { label: 'Gold T2 1 star', satin: 43000, threads: 430, visions: 75 },
  { label: 'Gold T2 2 stars', satin: 45000, threads: 460, visions: 80 },
  { label: 'Gold T2 3 stars', satin: 48000, threads: 500, visions: 85 },
  { label: 'Gold T3', satin: 60000, threads: 600, visions: 120 },
  { label: 'Gold T3 1 star', satin: 70000, threads: 700, visions: 140 },
  { label: 'Gold T3 2 stars', satin: 80000, threads: 800, visions: 160 },
  { label: 'Gold T3 3 stars', satin: 90000, threads: 900, visions: 180 },
  { label: 'Red', satin: 108000, threads: 1080, visions: 220 },
  { label: 'Red 1 star', satin: 114000, threads: 1140, visions: 230 },
  { label: 'Red 2 stars', satin: 121000, threads: 1210, visions: 240 },
  { label: 'Red 3 stars', satin: 128000, threads: 1280, visions: 250 },
  { label: 'Red T1', satin: 154000, threads: 1540, visions: 300 },
  { label: 'Red T1 1 star', satin: 163000, threads: 1630, visions: 320 },
  { label: 'Red T1 2 stars', satin: 173000, threads: 1730, visions: 340 },
  { label: 'Red T1 3 stars', satin: 183000, threads: 1830, visions: 360 },
  { label: 'Red T2', satin: 220000, threads: 2200, visions: 430 },
  { label: 'Red T2 1 star', satin: 233000, threads: 2330, visions: 460 },
  { label: 'Red T2 2 stars', satin: 247000, threads: 2470, visions: 490 },
  { label: 'Red T2 3 stars', satin: 264000, threads: 2640, visions: 520 },
  { label: 'Red T3', satin: 288000, threads: 2880, visions: 570 },
  { label: 'Red T3 1 star', satin: 302000, threads: 3020, visions: 600 },
  { label: 'Red T3 2 stars', satin: 317000, threads: 3170, visions: 630 },
  { label: 'Red T3 3 stars', satin: 333000, threads: 3330, visions: 660 },
  { label: 'Red T4', satin: 358000, threads: 3580, visions: 720 },
  { label: 'Red T4 1 star', satin: 384000, threads: 3840, visions: 770 },
  { label: 'Red T4 2 stars', satin: 403000, threads: 4030, visions: 810 },
  { label: 'Red T4 3 stars', satin: 423000, threads: 4230, visions: 850 },
  { label: 'Red T5', satin: 451000, threads: 4510, visions: 910 },
  { label: 'Red T5 1 star', satin: 479000, threads: 4790, visions: 970 },
  { label: 'Red T5 2 stars', satin: 507000, threads: 5070, visions: 1030 },
  { label: 'Red T5 3 stars', satin: 535000, threads: 5350, visions: 1090 },
  { label: 'Red T6', satin: 548000, threads: 5480, visions: 1110 },
  { label: 'Red T6 1 star', satin: 565000, threads: 5650, visions: 1140 },
  { label: 'Red T6 2 stars', satin: 582000, threads: 5820, visions: 1170 },
  { label: 'Red T6 3 stars', satin: 599000, threads: 5990, visions: 1210 },
];

export const CHARM_LEVELS = [
  { level: 0, guides: 0, designs: 0, stat: 0 },
  { level: 1, guides: 5, designs: 5, stat: 9 },
  { level: 2, guides: 40, designs: 15, stat: 12 },
  { level: 3, guides: 60, designs: 40, stat: 16 },
  { level: 4, guides: 80, designs: 100, stat: 19 },
  { level: 5, guides: 100, designs: 200, stat: 25 },
  { level: 6, guides: 120, designs: 300, stat: 30 },
  { level: 7, guides: 140, designs: 400, stat: 35 },
  { level: 8, guides: 200, designs: 400, stat: 40 },
  { level: 9, guides: 300, designs: 400, stat: 45 },
  { level: 10, guides: 420, designs: 420, stat: 50 },
  { level: 11, guides: 560, designs: 420, stat: 55 },
  { level: 12, guides: 580, designs: 600, stat: 59 },
  { level: 13, guides: 610, designs: 780, stat: 63 },
  { level: 14, guides: 645, designs: 960, stat: 67 },
  { level: 15, guides: 685, designs: 1140, stat: 71 },
  { level: 16, guides: 730, designs: 1320, stat: 75 },
  { level: 17, guides: 780, designs: 1500, stat: 79 },
  { level: 18, guides: 835, designs: 1680, stat: 83 },
  { level: 19, guides: 895, designs: 1860, stat: 87 },
  { level: 20, guides: 960, designs: 2040, stat: 91 },
  { level: 21, guides: 1030, designs: 2220, stat: 95 },
  { level: 22, guides: 1105, designs: 2400, stat: 99 },
];

export const HERO_XP_PER_LEVEL = [
  0, 0, 480, 690, 920, 1200, 1500, 1800, 2200, 2600, 3100,
  3800, 4200, 5100, 5700, 6800, 7800, 8900, 10000, 12000, 13000,
  14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 24000,
  26000, 28000, 30000, 32000, 36000, 40000, 44000, 48000, 52000, 58000,
  64000, 70000, 76000, 82000, 90000, 98000, 100000, 110000, 120000, 130000,
  140000, 150000, 160000, 170000, 190000, 210000, 230000, 250000, 270000, 300000,
  330000, 360000, 390000, 420000, 470000, 520000, 570000, 620000, 670000, 770000,
  870000, 970000, 1000000, 1100000, 1300000, 1500000, 1700000, 1900000, 2100000, 2400000,
];

export function townCenterForHeroLevel(level) {
  if (level <= 20) return 4;
  if (level <= 22) return 10;
  if (level <= 25) return 11;
  if (level <= 28) return 12;
  if (level <= 31) return 13;
  if (level <= 34) return 14;
  if (level <= 37) return 15;
  if (level <= 40) return 16;
  if (level <= 43) return 17;
  if (level <= 46) return 18;
  if (level <= 49) return 19;
  if (level <= 54) return 20;
  if (level <= 59) return 21;
  if (level <= 64) return 22;
  if (level <= 69) return 23;
  if (level <= 74) return 24;
  if (level <= 79) return 25;
  return 26;
}

export const WIDGET_COSTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const shardStars = [
  { star: 1, tiers: [1, 1, 2, 2, 2, 2] },
  { star: 2, tiers: [5, 5, 5, 5, 5, 15] },
  { star: 3, tiers: [15, 15, 15, 15, 15, 40] },
  { star: 4, tiers: [40, 40, 40, 40, 40, 100] },
  { star: 5, tiers: [100, 100, 100, 100, 100, 100] },
];

export const HERO_SHARD_STEPS = [
  { label: '0 stars', cost: 0 },
  ...shardStars.flatMap(({ star, tiers }) => tiers.map((cost, index) => ({
    label: `${star} star${star === 1 ? '' : 's'} · ${index + 1}/6`,
    cost,
  }))),
];

export const MASTERY_LEVELS = Array.from({ length: 21 }, (_, level) => ({
  level,
  hammers: level === 0 ? 0 : level * 10,
  mythicGear: level <= 10 ? 0 : level - 10,
}));

export const HERO_GEAR_MILESTONES = [
  [0, 0], [1, 10], [2, 25], [3, 45], [4, 70], [5, 100], [6, 135], [7, 175], [8, 220], [9, 270], [10, 325],
  [15, 675], [20, 1150], [25, 1750], [30, 2480], [35, 3430], [40, 4640], [45, 6290], [50, 8440], [55, 11090], [60, 14250],
  [65, 18100], [70, 22710], [75, 28260], [80, 34820], [85, 42570], [90, 51570], [95, 61820], [100, 73320], [105, 83620],
  [110, 97620], [115, 112870], [120, 125970], [125, 143720], [130, 162720], [135, 182970], [140, 200070], [145, 222820],
  [150, 246820], [155, 272070], [160, 293170], [165, 321670], [170, 352670], [175, 386170], [180, 414770], [185, 453270],
  [190, 494270], [195, 537770], [200, 574370],
].map(([level, cumulativeXp]) => ({ level, cumulativeXp }));

export const RED_GEAR_BLOCKS = [
  { from: 100, to: 120, mithril: 10, mythicGear: 3 },
  { from: 120, to: 140, mithril: 20, mythicGear: 5 },
  { from: 140, to: 160, mithril: 30, mythicGear: 5 },
  { from: 160, to: 180, mithril: 40, mythicGear: 10 },
  { from: 180, to: 200, mithril: 50, mythicGear: 10 },
];

export const TROOP_DATA = {
  infantry: [
    null,
    { tier: 1, bread: 36, wood: 27, stone: 7, iron: 2, seconds: 12, power: 3, kvk: 3, hog: 90, sg: 1 },
    { tier: 2, bread: 58, wood: 44, stone: 10, iron: 3, seconds: 17, power: 4, kvk: 4, hog: 120, sg: 2 },
    { tier: 3, bread: 92, wood: 69, stone: 17, iron: 4, seconds: 24, power: 6, kvk: 5, hog: 180, sg: 3 },
    { tier: 4, bread: 120, wood: 90, stone: 21, iron: 5, seconds: 32, power: 9, kvk: 8, hog: 265, sg: 5 },
    { tier: 5, bread: 156, wood: 117, stone: 27, iron: 6, seconds: 44, power: 13, kvk: 12, hog: 385, sg: 7 },
    { tier: 6, bread: 186, wood: 140, stone: 33, iron: 7, seconds: 60, power: 20, kvk: 18, hog: 595, sg: 11 },
    { tier: 7, bread: 279, wood: 210, stone: 49, iron: 11, seconds: 83, power: 28, kvk: 25, hog: 830, sg: 16 },
    { tier: 8, bread: 558, wood: 419, stone: 98, iron: 21, seconds: 113, power: 38, kvk: 35, hog: 1130, sg: 23 },
    { tier: 9, bread: 1394, wood: 1046, stone: 244, iron: 51, seconds: 131, power: 50, kvk: 45, hog: 1485, sg: 30 },
    { tier: 10, bread: 2788, wood: 2091, stone: 488, iron: 102, seconds: 152, power: 66, kvk: 60, hog: 1960, sg: 39 },
    { tier: 11, bread: 6970, wood: 5228, stone: 1220, iron: 253, seconds: 180, power: 114, kvk: 75, hog: 0, sg: 49 },
  ],
  cavalry: [
    null,
    { tier: 1, bread: 32, wood: 30, stone: 7, iron: 2, seconds: 12, power: 3, kvk: 3, hog: 90, sg: 1 },
    { tier: 2, bread: 51, wood: 48, stone: 10, iron: 3, seconds: 17, power: 4, kvk: 4, hog: 120, sg: 2 },
    { tier: 3, bread: 81, wood: 76, stone: 16, iron: 4, seconds: 24, power: 6, kvk: 5, hog: 180, sg: 3 },
    { tier: 4, bread: 105, wood: 99, stone: 21, iron: 5, seconds: 32, power: 9, kvk: 8, hog: 265, sg: 5 },
    { tier: 5, bread: 136, wood: 129, stone: 27, iron: 7, seconds: 44, power: 13, kvk: 12, hog: 385, sg: 7 },
    { tier: 6, bread: 163, wood: 154, stone: 32, iron: 8, seconds: 60, power: 20, kvk: 18, hog: 595, sg: 11 },
    { tier: 7, bread: 244, wood: 231, stone: 48, iron: 11, seconds: 83, power: 28, kvk: 25, hog: 830, sg: 16 },
    { tier: 8, bread: 488, wood: 461, stone: 95, iron: 22, seconds: 113, power: 38, kvk: 35, hog: 1130, sg: 23 },
    { tier: 9, bread: 1220, wood: 1151, stone: 237, iron: 55, seconds: 131, power: 50, kvk: 45, hog: 1485, sg: 30 },
    { tier: 10, bread: 2440, wood: 2301, stone: 474, iron: 109, seconds: 152, power: 66, kvk: 60, hog: 1960, sg: 39 },
    { tier: 11, bread: 6099, wood: 5751, stone: 1185, iron: 271, seconds: 180, power: 114, kvk: 75, hog: 0, sg: 49 },
  ],
  archer: [
    null,
    { tier: 1, bread: 23, wood: 34, stone: 6, iron: 2, seconds: 12, power: 3, kvk: 3, hog: 90, sg: 1 },
    { tier: 2, bread: 36, wood: 54, stone: 9, iron: 4, seconds: 17, power: 4, kvk: 4, hog: 120, sg: 2 },
    { tier: 3, bread: 58, wood: 86, stone: 15, iron: 5, seconds: 24, power: 6, kvk: 5, hog: 180, sg: 3 },
    { tier: 4, bread: 75, wood: 111, stone: 19, iron: 6, seconds: 32, power: 9, kvk: 8, hog: 265, sg: 5 },
    { tier: 5, bread: 97, wood: 144, stone: 24, iron: 8, seconds: 44, power: 13, kvk: 12, hog: 385, sg: 7 },
    { tier: 6, bread: 117, wood: 173, stone: 29, iron: 10, seconds: 60, power: 20, kvk: 18, hog: 595, sg: 11 },
    { tier: 7, bread: 175, wood: 258, stone: 44, iron: 14, seconds: 83, power: 28, kvk: 25, hog: 830, sg: 16 },
    { tier: 8, bread: 349, wood: 516, stone: 88, iron: 29, seconds: 113, power: 38, kvk: 35, hog: 1130, sg: 23 },
    { tier: 9, bread: 873, wood: 1289, stone: 219, iron: 72, seconds: 131, power: 50, kvk: 45, hog: 1485, sg: 30 },
    { tier: 10, bread: 1745, wood: 2578, stone: 438, iron: 144, seconds: 152, power: 66, kvk: 60, hog: 1960, sg: 39 },
    { tier: 11, bread: 4357, wood: 6448, stone: 1081, iron: 349, seconds: 180, power: 114, kvk: 75, hog: 0, sg: 49 },
  ],
};

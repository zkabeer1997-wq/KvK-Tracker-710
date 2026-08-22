const row = (level, food, manuals = 0, potions = 0, medallions = 0) => ({ level, food, manuals, potions, medallions });

const grayWolf = [
  row(1,0),row(2,150),row(3,161),row(4,171),row(5,182),row(6,193),row(7,203),row(8,214),row(9,224),row(10,235,15),
  row(11,250),row(12,266),row(13,281),row(14,297),row(15,312),row(16,328),row(17,343),row(18,359),row(19,374),row(20,390,30),
  row(21,410),row(22,431),row(23,452),row(24,473),row(25,494),row(26,516),row(27,537),row(28,558),row(29,579),row(30,600,45,10),
  row(31,630),row(32,661),row(33,692),row(34,723),row(35,754),row(36,786),row(37,817),row(38,848),row(39,879),row(40,910,60,20),
  row(41,950),row(42,991),row(43,1032),row(44,1073),row(45,1114),row(46,1156),row(47,1197),row(48,1238),row(49,1279),row(50,1320,90,30,10),
];

const gen1 = [
  row(1,0),row(2,200),row(3,221),row(4,243),row(5,264),row(6,285),row(7,306),row(8,328),row(9,349),row(10,370,20),
  row(11,400),row(12,431),row(13,462),row(14,493),row(15,524),row(16,556),row(17,587),row(18,618),row(19,649),row(20,680,40),
  row(21,720),row(22,762),row(23,804),row(24,847),row(25,889),row(26,931),row(27,973),row(28,1016),row(29,1058),row(30,1100,60,10),
  row(31,1160),row(32,1222),row(33,1284),row(34,1347),row(35,1409),row(36,1471),row(37,1533),row(38,1596),row(39,1658),row(40,1720,90,20),
  row(41,1800),row(42,1882),row(43,1964),row(44,2047),row(45,2129),row(46,2211),row(47,2293),row(48,2376),row(49,2458),row(50,2540,130,20,10),
  row(51,2640),row(52,2742),row(53,2844),row(54,2947),row(55,3049),row(56,3151),row(57,3253),row(58,3356),row(59,3458),row(60,3560,175,50,20),
];

const gen2 = [
  row(1,0),row(2,300),row(3,332),row(4,364),row(5,396),row(6,428),row(7,459),row(8,491),row(9,523),row(10,555,25),
  row(11,600),row(12,647),row(13,693),row(14,740),row(15,787),row(16,833),row(17,880),row(18,927),row(19,973),row(20,1020,50),
  row(21,1080),row(22,1143),row(23,1207),row(24,1270),row(25,1333),row(26,1397),row(27,1460),row(28,1523),row(29,1587),row(30,1650,75,10),
  row(31,1740),row(32,1833),row(33,1927),row(34,2020),row(35,2113),row(36,2207),row(37,2300),row(38,2393),row(39,2487),row(40,2580,100,20),
  row(41,2700),row(42,2823),row(43,2947),row(44,3070),row(45,3193),row(46,3317),row(47,3440),row(48,3563),row(49,3687),row(50,3810,155,30,10),
  row(51,3960),row(52,4113),row(53,4267),row(54,4420),row(55,4573),row(56,4727),row(57,4880),row(58,5033),row(59,5187),row(60,5340,200,50,20),
  row(61,5520),row(62,5700),row(63,5880),row(64,6060),row(65,6240),row(66,6420),row(67,6600),row(68,6780),row(69,6960),row(70,7140,255,80,40),
];

const gen3 = [
  row(1,0),row(2,400),row(3,443),row(4,485),row(5,528),row(6,570),row(7,613),row(8,655),row(9,698),row(10,740,30),
  row(11,800),row(12,862),row(13,924),row(14,987),row(15,1049),row(16,1111),row(17,1173),row(18,1236),row(19,1298),row(20,1360,60),
  row(21,1440),row(22,1524),row(23,1609),row(24,1693),row(25,1778),row(26,1862),row(27,1947),row(28,2031),row(29,2116),row(30,2200,95,10),
  row(31,2320),row(32,2444),row(33,2569),row(34,2693),row(35,2818),row(36,2942),row(37,3067),row(38,3191),row(39,3316),row(40,3440,125,20),
  row(41,3600),row(42,3764),row(43,3929),row(44,4093),row(45,4258),row(46,4422),row(47,4587),row(48,4751),row(49,4916),row(50,5080,190,30,10),
  row(51,5280),row(52,5484),row(53,5689),row(54,5893),row(55,6098),row(56,6302),row(57,6507),row(58,6711),row(59,6916),row(60,7120,250,50,20),
  row(61,7360),row(62,7600),row(63,7840),row(64,8080),row(65,8320),row(66,8560),row(67,8800),row(68,9040),row(69,9280),row(70,9520,310,80,40),
  row(71,9760),row(72,10009),row(73,10258),row(74,10507),row(75,10756),row(76,11004),row(77,11253),row(78,11502),row(79,11751),row(80,12000,380,100,60),
];

const late = [
  row(1,0),row(2,500),row(3,553),row(4,606),row(5,659),row(6,713),row(7,766),row(8,819),row(9,872),row(10,925,35),
  row(11,1000),row(12,1078),row(13,1156),row(14,1233),row(15,1311),row(16,1389),row(17,1467),row(18,1544),row(19,1622),row(20,1700,70),
  row(21,1800),row(22,1906),row(23,2011),row(24,2117),row(25,2222),row(26,2328),row(27,2433),row(28,2539),row(29,2644),row(30,2750,110,15),
  row(31,2900),row(32,3056),row(33,3211),row(34,3367),row(35,3522),row(36,3678),row(37,3833),row(38,3989),row(39,4144),row(40,4300,145,35),
  row(41,4500),row(42,4706),row(43,4911),row(44,5117),row(45,5322),row(46,5528),row(47,5733),row(48,5939),row(49,6144),row(50,6350,220,50,10),
  row(51,6600),row(52,6856),row(53,7111),row(54,7367),row(55,7622),row(56,7878),row(57,8133),row(58,8389),row(59,8644),row(60,8900,290,65,20),
  row(61,9200),row(62,9500),row(63,9800),row(64,10100),row(65,10400),row(66,10700),row(67,11000),row(68,11300),row(69,11600),row(70,11900,365,85,40),
  row(71,12200),row(72,12511),row(73,12822),row(74,13133),row(75,13444),row(76,13756),row(77,14067),row(78,14378),row(79,14689),row(80,15000,440,100,60),
  row(81,15400),row(82,15800),row(83,16200),row(84,16600),row(85,17000),row(86,17400),row(87,17800),row(88,18200),row(89,18600),row(90,19000,585,115,80),
  row(91,19400),row(92,19811),row(93,20222),row(94,20633),row(95,21044),row(96,21456),row(97,21867),row(98,22278),row(99,22689),row(100,23100,730,135,100),
];

export const PETS = [
  { key: 'gray-wolf', name: 'Gray Wolf', generation: 1, profile: grayWolf },
  { key: 'lynx', name: 'Lynx', generation: 1, profile: gen1 },
  { key: 'bison', name: 'Bison', generation: 1, profile: gen1 },
  { key: 'cheetah', name: 'Cheetah', generation: 2, profile: gen2 },
  { key: 'moose', name: 'Moose', generation: 2, profile: gen2 },
  { key: 'lion', name: 'Lion', generation: 3, profile: gen3 },
  { key: 'grizzly-bear', name: 'Grizzly Bear', generation: 3, profile: gen3 },
  { key: 'giant-rhino', name: 'Giant Rhino', generation: 4, profile: late },
  { key: 'mighty-bison', name: 'Mighty Bison', generation: 4, profile: late },
  { key: 'alpha-black-panther', name: 'Alpha Black Panther', generation: 5, profile: late },
  { key: 'great-moose', name: 'Great Moose', generation: 5, profile: late },
  { key: 'ironclad-war-elephant', name: 'Ironclad War Elephant', generation: 6, profile: late },
  { key: 'regal-white-lion', name: 'Regal White Lion', generation: 6, profile: late },
  { key: 'ironclad-war-bear', name: 'Ironclad War Bear', generation: 7, profile: late },
];

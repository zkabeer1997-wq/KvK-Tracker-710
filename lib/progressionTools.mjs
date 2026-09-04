export const GOVERNOR_GEAR_LEVELS = [
  ['Green',1500,15,0,224400,9.35,2],['Green 1 star',3800,40,0,306000,12.75,2.5],
  ['Blue',7000,70,0,408000,17,3],['Blue 1 star',9700,95,0,510000,21.25,3.5],['Blue 2 stars',1000,10,45,612000,25.5,4],['Blue 3 stars',1000,10,50,714000,29.75,4.5],
  ['Purple',1500,15,60,816000,34,5],['Purple 1 star',1500,15,70,885360,36.89,5],['Purple 2 stars',6500,65,40,954720,39.78,5],['Purple 3 stars',8000,80,50,1024080,42.67,5],
  ['Purple T1',10000,95,60,1093440,45.56,6],['Purple T1 1 star',11000,110,70,1162800,48.45,6],['Purple T1 2 stars',13000,130,85,1232160,51.34,6],['Purple T1 3 stars',15000,160,100,1301520,54.23,6],
  ...[
    ['Gold',[22000,23000,25000,26000],[220,230,250,260],[40,40,45,45],[1362720,1423920,1485120,1546320],[56.78,59.33,61.88,64.43],7],
    ['Gold T1',[28000,30000,32000,35000],[280,300,320,340],[45,55,55,55],[1607520,1668720,1729920,1791120],[66.98,69.53,72.08,74.63],8],
    ['Gold T2',[38000,43000,45000,48000],[390,430,460,500],[55,75,80,85],[1852320,1913520,1974720,2040000],[77.18,79.73,82.28,84.83],9],
    ['Gold T3',[60000,70000,80000,90000],[600,700,800,900],[120,140,160,180],[2097120,2158320,2219520,2280000],[87.38,89.93,92.48,95],10],
    ['Red',[108000,114000,121000,128000],[1080,1140,1210,1280],[220,230,240,250],[2340000,2400000,2460000,2520000],[97.5,100,102.5,105],12],
    ['Red T1',[154000,163000,173000,183000],[1540,1630,1730,1830],[300,320,340,360],[2580000,2640000,2700000,2760000],[107.5,110,112.5,115],14],
    ['Red T2',[220000,233000,247000,264000],[2200,2330,2470,2640],[430,460,490,520],[2820000,2880000,2940000,3000000],[117.5,120,122.5,125],16.5],
    ['Red T3',[288000,302000,317000,333000],[2880,3020,3170,3330],[570,600,630,660],[3066000,3132000,3198000,3264000],[127.75,130.5,133.25,136],19.5],
    ['Red T4',[358000,384000,403000,423000],[3580,3840,4030,4230],[720,770,810,850],[3330000,3396000,3462000,3528000],[138.75,141.5,144.25,147],23],
    ['Red T5',[451000,479000,507000,535000],[4510,4790,5070,5350],[910,970,1030,1090],[3600000,3672000,3744000,3816000],[150,153,156,159],26.5],
    ['Red T6',[548000,565000,582000,599000],[5480,5650,5820,5990],[1110,1140,1170,1210],[3888000,3960000,4032000,4104000],[162,165,168,171],30],
  ].flatMap(([tier,satin,threads,visions,power,stat,setBonus])=>satin.map((value,index)=>[
    index ? `${tier} ${index} star${index === 1 ? '' : 's'}` : tier,value,threads[index],visions[index],power[index],stat[index],setBonus,
  ])),
].map(([label,satin,threads,visions,power,stat,setBonus],index)=>({index,label,satin,threads,visions,power,stat,setBonus}));

export const HERO_XP_CHECKPOINTS = [
  [0,0],[1,10],[2,25],[3,45],[4,70],[5,100],[6,135],[7,175],[8,220],[9,270],[10,325],
  [15,675],[20,1150],[25,1750],[30,2480],[35,3430],[40,4640],[45,6290],[50,8440],[55,11090],[60,14250],
  [65,18100],[70,22710],[75,28260],[80,34820],[85,42570],[90,51570],[95,61820],[100,73320],[105,83620],
  [110,97620],[115,112870],[120,125970],[125,143720],[130,162720],[135,182970],[140,200070],[145,222820],
  [150,246820],[155,272070],[160,293170],[165,321670],[170,352670],[175,386170],[180,414770],[185,453270],
  [190,494270],[195,537770],[200,574370],
].map(([level,cumulative])=>({level,cumulative}));

export const HERO_MILESTONE_COSTS = {
  101:{mastery:10,mythic:2,mithril:0},120:{mastery:11,mythic:3,mithril:10},140:{mastery:12,mythic:5,mithril:20},
  160:{mastery:13,mythic:5,mithril:30},180:{mastery:14,mythic:10,mithril:40},200:{mastery:15,mythic:10,mithril:50},
};

export function sumGovernorGear(from,to,count=1){
  const rows=GOVERNOR_GEAR_LEVELS.slice(Math.max(0,from+1),Math.max(0,to+1));
  return rows.reduce((a,row)=>({satin:a.satin+row.satin*count,threads:a.threads+row.threads*count,visions:a.visions+row.visions*count}),{satin:0,threads:0,visions:0});
}

export function heroGearCost(fromLevel,toLevel,fromMastery,toMastery){
  const from=HERO_XP_CHECKPOINTS.find(x=>x.level===fromLevel)?.cumulative||0;
  const to=HERO_XP_CHECKPOINTS.find(x=>x.level===toLevel)?.cumulative||0;
  const hammers=Array.from({length:Math.max(0,toMastery-fromMastery)},(_,i)=>(fromMastery+i+1)*10).reduce((a,b)=>a+b,0);
  const masteryMythic=Array.from({length:Math.max(0,toMastery-fromMastery)},(_,i)=>Math.max(0,fromMastery+i+1-10)).reduce((a,b)=>a+b,0);
  const milestones=Object.entries(HERO_MILESTONE_COSTS).filter(([level])=>Number(level)>fromLevel&&Number(level)<=toLevel);
  return {xp:Math.max(0,to-from),hammers,mythic:masteryMythic+milestones.reduce((a,[,v])=>a+v.mythic,0),mithril:milestones.reduce((a,[,v])=>a+v.mithril,0)};
}

export const MASTER_PROFILES = [
  {name:'Pan',role:'Growth & development',best:['growth','balanced'],reason:'The broadest everyday value for construction tempo, stamina and account growth.'},
  {name:'Valora',role:'Bear Hunt specialist',best:['bear','gear'],reason:'The clearest focus for Bear Hunt output and recurring Hero Gear materials.'},
  {name:'Roman',role:'Arena specialist',best:['arena'],reason:'Best aligned to accounts prioritizing Arena performance.'},
  {name:'Cassia',role:'Battle specialist',best:['pvp'],reason:'The strongest direct match for a combat-first investment plan.'},
  {name:'Guinevere',role:'Holy Sword specialist',best:['swordland'],reason:'Best aligned to Swordland and Holy Sword performance.'},
  {name:'Wilson',role:'Royal Herald',best:['balanced'],reason:'A secondary utility path after the account’s primary breakpoint is secured.'},
];

export function rankMasters(goal){
  return [...MASTER_PROFILES].sort((a,b)=>Number(b.best.includes(goal))-Number(a.best.includes(goal)));
}

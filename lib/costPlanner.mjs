export const RESOURCE_LABELS={bread:'Bread',wood:'Wood',stone:'Stone',iron:'Iron',gold:'Gold',truegold:'True Gold',temperedTruegold:'Tempered True Gold',truegold_dust:'True Gold Dust'};
export const RESOURCES=Object.keys(RESOURCE_LABELS);
export function numberValue(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,n):0;}
export function levelLabel(level){return level==='0'?'Not started':level.startsWith('TG')?level.replace(/^TG\s*/, 'TG '):level.startsWith('30-')?`Level 30 → TG 1 · step ${level.slice(3)}`:`Level ${level}`;}
export function duration(seconds){const s=Math.ceil(numberValue(seconds));return [Math.floor(s/86400)+'d',Math.floor(s%86400/3600)+'h',Math.floor(s%3600/60)+'m',s%60+'s'].filter(x=>!x.startsWith('0')).slice(0,3).join(' ')||'0s';}
export function constructionModifiers(m={}){
 return {speed:numberValue(m.speed)+numberValue(m.wolf)+(m.minister?(m.highKing?15:10):0)+(m.groundworks?10:0)+(m.kvk?5:0),reduction:Math.min(5,Math.floor(numberValue(m.saul)))*3,timeFactor:m.doubleTime ? 0.8 : 1};
}
const empty=()=>Object.fromEntries(RESOURCES.map(k=>[k,0]));
function normalize(s){return String(s).toLowerCase().replace(/\s+/g,' ').trim();}
function requirementTarget(items,item,text,construction){
 const match=text.match(/^(.*?)\s+(?:Lv\.?\s*|Level\s*)(\d+)$/i)||text.match(/^(.*?)\s+(TG\s*\d+(?:-\d+)?)$/i);
 const name=normalize(match?match[1]:text).replace(/^tc$/,'town center');
 const candidates=items.filter(i=>normalize(i.name)===name);
 const target=candidates.find(i=>i.category===item.category)||candidates[0];
 if(!target)return null;
 const desired=match?(match[2].startsWith('TG')?match[2].replace(/\s+/g,''):match[2]):target.levels[0].level;
 const level=target.levels.find(l=>l.level.replace(/\s+/g,'')===desired);
 return level?{id:target.id,level:level.level}:null;
}
export function calculateCosts(dataset,{selections=[],currentLevels={},includePrerequisites=true,inventory={},modifiers={},kind='research'}={}){
 const items=dataset.items,map=new Map(items.map(i=>[i.id,i])),construction=kind==='construction';
 const current={...currentLevels},targets=new Map(),tasks=new Map(),visiting=new Set(),warnings=new Set(),buildingRequirements=new Map();
 for(const s of selections){const item=map.get(s.id);if(!item)throw Error('Choose a valid item.');const a=s.current??current[s.id]??'0',b=s.target;const from=a==='0'?-1:item.levels.findIndex(l=>l.level===a),to=item.levels.findIndex(l=>l.level===b);if(from< -1||to<0||(a!=='0'&&from<0)||to<from)throw Error(`Check the current and target levels for ${item.name}.`);current[s.id]=a;targets.set(s.id,Math.max(targets.get(s.id)??-1,to));}
 function add(id,toIndex){
  const item=map.get(id),from=current[id]&&current[id]!=='0'?item.levels.findIndex(l=>l.level===current[id]):-1;
  for(let index=from+1;index<=toIndex;index++){
   const row=item.levels[index];if(row.seconds==null)warnings.add(`Time unavailable: ${item.name} ${levelLabel(row.level)}. Total time excludes this step.`);const key=`${id}:${row.level}`;if(tasks.has(key))continue;
   if(visiting.has(key)){warnings.add(`Check prerequisite cycle at ${item.name} ${levelLabel(row.level)}.`);continue;}
   visiting.add(key);
   const requirements=[...(row.requirements||[])];
   if(construction&&row.townCenter){for(const t of String(row.townCenter).split(','))requirements.push(/^\d+$/.test(t.trim())?`Town Center Lv. ${t.trim()}`:t.trim());}
   for(const text of requirements){
    if(!construction&&/^(War Academy|Academy) Lv\.?/i.test(text)){
     const m=text.match(/^(.*?) Lv\.?\s*(\d+)/i);if(m)buildingRequirements.set(m[1],Math.max(buildingRequirements.get(m[1])||0,Number(m[2])));continue;
    }
    const dep=requirementTarget(items,item,text,construction);
    if(!dep){warnings.add(`Not included in totals: ${text}.`);continue;}
    const depItem=map.get(dep.id),needed=depItem.levels.findIndex(l=>l.level===dep.level),have=depItem.levels.findIndex(l=>l.level===current[dep.id]);
    if(have>=needed)continue;
    if(includePrerequisites)add(dep.id,needed);
    else warnings.add(`Required: ${depItem.name} ${levelLabel(dep.level)}. Prerequisite costs are excluded.`);
   }
   visiting.delete(key);
   if(!tasks.has(key))tasks.set(key,{...row,id,key,name:item.name,category:item.category,prerequisite:!targets.has(id)||index>targets.get(id)});
  }
 }
 for(const [id,target] of targets)add(id,target);
 const adjusted=construction?constructionModifiers(modifiers):{speed:numberValue(modifiers.speed),reduction:0,timeFactor:1};
 const totals=empty(),baseTotals=empty();let seconds=0,baseSeconds=0,power=0;
 const steps=[...tasks.values()].map(step=>{
  const costs=empty();for(const k of RESOURCES){const base=numberValue(step.costs[k]);baseTotals[k]+=base;costs[k]=Math.ceil(base*(construction&&['bread','wood','stone','iron'].includes(k)?1-adjusted.reduction/100:1));totals[k]+=costs[k];}
  const time=Math.ceil(numberValue(step.seconds)/(1+adjusted.speed/100)*adjusted.timeFactor);seconds+=time;baseSeconds+=numberValue(step.seconds);
  let gain=numberValue(step.power);
  if(construction){const item=map.get(step.id),index=item.levels.findIndex(l=>l.level===step.level);gain=step.power==null?0:Math.max(0,gain-numberValue(item.levels[index-1]?.power));}
  power+=gain;return {...step,costs,adjustedSeconds:time,powerGain:gain};
 });
 return {steps,totals,baseTotals,seconds,baseSeconds,power,warnings:[...warnings],buildingRequirements:[...buildingRequirements].map(([name,level])=>name==='War Academy'?`War Academy TG ${(level-30)/5}`:`${name} Level ${level}`),shortfall:Object.fromEntries(RESOURCES.map(k=>[k,Math.max(0,totals[k]-numberValue(inventory[k]))])),unverified:steps.some(s=>s.verified===false)};
}
export function calculateReach(dataset,options){
 if(options.selections?.length!==1)throw Error('Reach mode supports one target at a time.');
 const s=options.selections[0],item=dataset.items.find(i=>i.id===s.id);if(!item)throw Error('Choose an item.');
 const start=item.levels.findIndex(l=>l.level===s.current),limit=item.levels.findIndex(l=>l.level===s.target);
 let level=s.current,plan=calculateCosts(dataset,{...options,selections:[]});
 calculateCosts(dataset,options); // Validate the requested range before searching.
 for(let i=start+1;i<=limit;i++){
  const next=calculateCosts(dataset,{...options,selections:[{...s,target:item.levels[i].level}]});
  if(RESOURCES.some(k=>next.totals[k]>numberValue(options.inventory?.[k])))break;
  level=item.levels[i].level;plan=next;
 }
 return {...plan,reachedLevel:level};
}
export function exportPlanCsv(result){
 const rows=[['Item','Category','Target level','Prerequisite',...RESOURCES.map(k=>RESOURCE_LABELS[k]),'Base seconds','Adjusted seconds'],...result.steps.map(s=>[s.name,s.category,s.level,s.prerequisite?'Yes':'No',...RESOURCES.map(k=>s.costs[k]),s.seconds,s.adjustedSeconds]),['TOTAL','','','',...RESOURCES.map(k=>result.totals[k]),result.baseSeconds,result.seconds]];
 return rows.map(r=>r.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'" ).replaceAll('"','""')+'"').join(',')).join('\r\n');
}

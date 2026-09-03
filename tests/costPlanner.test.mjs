import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {calculateCosts,calculateReach,constructionModifiers,exportPlanCsv} from '../lib/costPlanner.mjs';
const load=key=>JSON.parse(readFileSync(new URL(`../lib/data/${key}.json`,import.meta.url)));
const academy=load('academy'),war=load('war-academy'),advanced=load('advanced-research'),buildings=load('construction');
const item=(d,name)=>d.items.find(i=>i.name===name);
const selection=(id,current,target)=>({id,current,target});
test('datasets contain complete unique level records and nonnegative costs',()=>{
 for(const [d,count,levels] of [[academy,191,720],[war,30,264],[advanced,92,1010],[buildings,15,796]]){
  assert.equal(d.items.length,count);assert.equal(d.items.reduce((sum,i)=>sum+i.levels.length,0),levels);assert.equal(new Set(d.items.map(i=>i.id)).size,count);
  for(const i of d.items){assert.equal(new Set(i.levels.map(l=>l.level)).size,i.levels.length,i.id);for(const l of i.levels){assert.ok(l.seconds===null || (typeof l.seconds==='number'&&l.seconds>=0));for(const v of Object.values(l.costs))assert.ok(v==null||(Number.isFinite(v)&&v>=0));}}
 }
});
test('Academy exact level range matches published Tooling Up I totals',()=>{
 const id=item(academy,'Tooling Up I').id;
 const result=calculateCosts(academy,{selections:[selection(id,'0','3')]});
 assert.equal(result.totals.gold,860);assert.equal(result.totals.bread,14500);assert.equal(result.totals.stone,2890);assert.equal(result.totals.iron,710);assert.equal(result.seconds,150);assert.equal(result.power,6500);
 const partial=calculateCosts(academy,{selections:[selection(id,'1','3')],modifiers:{speed:100},inventory:{gold:100}});
 assert.equal(partial.totals.gold,700);assert.equal(partial.seconds,74);assert.equal(partial.shortfall.gold,600);assert.deepEqual(partial.buildingRequirements,['Academy Level 3']);
});
test('prerequisites deduplicate shared research and respect completed levels',()=>{
 const tooling=item(academy,'Tooling Up I'),ward=item(academy,'Ward Expansion I'),camp=item(academy,'Camp Expansion I');
 const result=calculateCosts(academy,{selections:[selection(ward.id,'0','1'),selection(camp.id,'0','1')]});
 assert.equal(new Set(result.steps.map(s=>s.key)).size,result.steps.length);assert.ok(result.steps.some(s=>s.id===tooling.id));
 const completed=calculateCosts(academy,{selections:[selection(ward.id,'0','1')],currentLevels:{[tooling.id]:'3'}});assert.ok(!completed.steps.some(s=>s.id===tooling.id));
 const excluded=calculateCosts(academy,{selections:[selection(ward.id,'0','1')],includePrerequisites:false});assert.equal(excluded.steps.length,1);assert.ok(excluded.warnings.length);
});
test('War Academy uses the correct troop branch and exact dust totals',()=>{
 const battalion=war.items.find(i=>i.name==='Truegold Battalion'&&i.category==='Infantry');
 const result=calculateCosts(war,{selections:[selection(battalion.id,'0','5')]});
 assert.equal(result.totals.truegold_dust,258);assert.equal(result.totals.gold,80000);assert.ok(result.steps.every(s=>s.category==='Infantry'));assert.deepEqual(result.buildingRequirements,['War Academy TG 1']);
});
test('advanced research includes Tempered True Gold and excludes already completed levels',()=>{
 const target=advanced.items.find(i=>i.levels.some(l=>l.costs.temperedTruegold>0)),last=target.levels.at(-1),prior=target.levels.at(-2);
 const r=calculateCosts(advanced,{selections:[selection(target.id,prior.level,last.level)],includePrerequisites:false});
 assert.equal(r.steps.length,1);assert.equal(r.totals.temperedTruegold,last.costs.temperedTruegold||0);assert.equal(r.totals.truegold_dust,last.costs.truegold_dust||0);
});
test('construction includes each TG substep; buffs reduce only the intended resources and time',()=>{
 const tc=item(buildings,'Town Center');
 const r=calculateCosts(buildings,{kind:'construction',selections:[selection(tc.id,'30','TG 1')],includePrerequisites:false,modifiers:{speed:100,saul:5,doubleTime:true}});
 assert.equal(r.steps.length,5);
 for(const s of r.steps){const raw=tc.levels.find(l=>l.level===s.level);assert.equal(s.costs.wood,Math.ceil((raw.costs.wood||0)*.85));assert.equal(s.costs.truegold,raw.costs.truegold||0);assert.equal(s.adjustedSeconds,Math.ceil(raw.seconds/2*.8));}
 assert.deepEqual(constructionModifiers({speed:50,wolf:10,minister:true,highKing:true,groundworks:true,kvk:true,doubleTime:true,saul:5}),{speed:90,reduction:15,timeFactor:.8});
});
test('construction prerequisite totals include known buildings and disclose missing data',()=>{
 const r=calculateCosts(buildings,{kind:'construction',selections:[selection('town-center','1','3')]});
 assert.ok(r.steps.some(s=>s.id==='sawmill'));assert.ok(r.warnings.some(w=>w.includes('House 1')));assert.equal(new Set(r.steps.map(s=>s.key)).size,r.steps.length);
 const full=calculateCosts(buildings,{kind:'construction',selections:buildings.items.map(i=>selection(i.id,'0',i.levels.at(-1).level))});
 assert.equal(full.steps.length,796);assert.ok(!full.warnings.some(w=>w.includes('cycle')));
});
test('reach mode stops at the exact affordable boundary and returns zeros when nothing is affordable',()=>{
 const id=item(academy,'Tooling Up I').id,opts={selections:[selection(id,'0','3')],inventory:{gold:160,bread:2700,wood:2700,stone:540,iron:130}};
 const r=calculateReach(academy,opts);assert.equal(r.reachedLevel,'1');assert.equal(r.steps.length,1);
 const none=calculateReach(academy,{...opts,inventory:{}});assert.equal(none.reachedLevel,'0');assert.equal(none.seconds,0);assert.equal(none.baseSeconds,0);assert.equal(none.steps.length,0);assert.equal(none.totals.gold,0);
 assert.throws(()=>calculateReach(academy,{...opts,selections:[...opts.selections,...opts.selections]}),/one target/);
 assert.throws(()=>calculateCosts(academy,{selections:[selection(id,'3','1')]}),/current and target/);
 assert.match(exportPlanCsv(r),/"TOTAL"/);assert.match(exportPlanCsv(r),/"Gold"/);
});

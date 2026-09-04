import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GOVERNOR_GEAR_LEVELS,heroGearCost,masterProgressionCost,rankMasters,sumGovernorGear} from '../lib/progressionTools.mjs';
const masters=JSON.parse(fs.readFileSync(new URL('../lib/data/masters.json',import.meta.url))).masters;

test('governor gear includes the complete 58-stage progression',()=>assert.equal(GOVERNOR_GEAR_LEVELS.length,58));
test('governor gear sums exclusive current through inclusive target',()=>assert.deepEqual(sumGovernorGear(0,2,1),{satin:10800,threads:110,visions:0}));
test('governor gear no-gear start includes Green crafting cost',()=>assert.deepEqual(sumGovernorGear(-1,0,1),{satin:1500,threads:15,visions:0}));
test('governor gear full published path has exact totals',()=>assert.deepEqual(sumGovernorGear(-1,57,1),{satin:9967500,threads:99710,visions:20305}));
test('hero checkpoint and mastery costs are cumulative',()=>assert.deepEqual(heroGearCost(0,100,0,10),{xp:73320,hammers:550,mythic:0,mithril:0}));
test('red ascension and mastery costs include required materials',()=>assert.deepEqual(heroGearCost(100,120,10,11),{xp:52650,hammers:110,mythic:6,mithril:10}));
test('hero gear full path includes every imbuement and mastery cost',()=>assert.deepEqual(heroGearCost(0,200,0,20),{xp:574370,hammers:2100,mythic:90,mithril:150}));
test('master recommendations follow the selected goal',()=>assert.equal(rankMasters('bear')[0].name,'Valora'));
test('Valora max plan matches the published calculator fixture',()=>{
 const master=masters.valora,skills=Object.fromEntries(master.skills.map(skill=>[skill.key,{from:0,to:skill.maxLevel}]));
 assert.deepEqual(masterProgressionCost(master,{fromLevel:1,toLevel:100,fromClass:1,toClass:11,skills}),{affinity:171690,emblems:275,manuscripts:21150,learningXp:1509917,power:1627240});
});

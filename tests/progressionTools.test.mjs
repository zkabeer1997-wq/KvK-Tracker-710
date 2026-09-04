import test from 'node:test';
import assert from 'node:assert/strict';
import {GOVERNOR_GEAR_LEVELS,heroGearCost,rankMasters,sumGovernorGear} from '../lib/progressionTools.mjs';

test('governor gear includes the complete 58-stage progression',()=>assert.equal(GOVERNOR_GEAR_LEVELS.length,58));
test('governor gear sums exclusive current through inclusive target',()=>assert.deepEqual(sumGovernorGear(0,2,1),{satin:10800,threads:110,visions:0}));
test('hero checkpoint and mastery costs are cumulative',()=>assert.deepEqual(heroGearCost(0,100,0,10),{xp:73320,hammers:550,mythic:0,mithril:0}));
test('red ascension and mastery costs include required materials',()=>assert.deepEqual(heroGearCost(100,120,10,11),{xp:52650,hammers:110,mythic:6,mithril:10}));
test('master recommendations follow the selected goal',()=>assert.equal(rankMasters('bear')[0].name,'Valora'));

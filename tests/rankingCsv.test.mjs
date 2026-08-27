import assert from 'node:assert/strict';
import { parseRankingCsv, computeRankingDeltas } from '../lib/rankingCsv.js';

// Header row detected and skipped.
{
  const { rows, errors } = parseRankingCsv('rank,name,value\n1,Alice,9000\n2,Bob,8500');
  assert.equal(errors.length, 0);
  assert.deepEqual(rows, [
    { rank: 1, name: 'Alice', value: 9000 },
    { rank: 2, name: 'Bob', value: 8500 },
  ]);
}

// No header row, out-of-order input gets sorted by rank.
{
  const { rows, errors } = parseRankingCsv('2,Bob,8500\n1,Alice,9000');
  assert.equal(errors.length, 0);
  assert.equal(rows[0].name, 'Alice');
  assert.equal(rows[1].name, 'Bob');
  assert.equal(rows[1].value, 8500);
}

// Value column is optional.
{
  const { rows, errors } = parseRankingCsv('1,Alice\n2,Bob');
  assert.equal(errors.length, 0);
  assert.equal(rows[0].value, null);
}

// Bad rank and missing name are reported per-line, not fatal to the whole parse.
{
  const { rows, errors } = parseRankingCsv('1,Alice,9000\nnope,Bob,8500\n3,,7000');
  assert.equal(rows.length, 1);
  assert.equal(errors.length, 2);
}

// Blank lines are ignored.
{
  const { rows } = parseRankingCsv('\n1,Alice,9000\n\n2,Bob,8500\n');
  assert.equal(rows.length, 2);
}

// Trend deltas: matched by name, positive when rank improves (lower number).
{
  const previous = [
    { rank: 1, name: 'Alice', value: 9000 },
    { rank: 2, name: 'Bob', value: 8500 },
    { rank: 3, name: 'Cara', value: 8000 },
  ];
  const current = [
    { rank: 1, name: 'Bob', value: 9200 },
    { rank: 2, name: 'Alice', value: 9000 },
    { rank: 3, name: 'Dee', value: 7500 },
  ];
  const withDeltas = computeRankingDeltas(current, previous);
  assert.equal(withDeltas.find((r) => r.name === 'Bob').delta, 1); // moved up from 2 to 1
  assert.equal(withDeltas.find((r) => r.name === 'Alice').delta, -1); // fell from 1 to 2
  assert.equal(withDeltas.find((r) => r.name === 'Dee').delta, null); // new entry
}

console.log('rankingCsv tests passed');

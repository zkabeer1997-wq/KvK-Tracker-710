import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const configPath = require.resolve('../next.config.js');

async function readCspFor(nodeEnv) {
  process.env.NODE_ENV = nodeEnv;
  delete require.cache[configPath];
  const config = require(configPath);
  const entries = await config.headers();
  return entries[0].headers.find((header) => header.key === 'Content-Security-Policy').value;
}

test('CSP permits React development diagnostics without weakening production', async () => {
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    const developmentCsp = await readCspFor('development');
    const productionCsp = await readCspFor('production');

    assert.match(developmentCsp, /script-src[^;]*'unsafe-eval'/);
    assert.doesNotMatch(productionCsp, /'unsafe-eval'/);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    delete require.cache[configPath];
  }
});

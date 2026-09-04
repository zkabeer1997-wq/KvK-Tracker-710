import assert from 'node:assert/strict';
import test from 'node:test';

import { detectWebGL } from '../components/kingdom/world/gateCapabilities.js';

function withBrowserGlobals(windowValue, documentValue, callback) {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = windowValue;
  globalThis.document = documentValue;

  try {
    callback();
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
}

test('rejects WebGL 1 because the installed Three.js renderer requires WebGL 2', () => {
  withBrowserGlobals(
    { WebGLRenderingContext: function WebGLRenderingContext() {} },
    { createElement: () => ({ getContext: () => ({}) }) },
    () => assert.equal(detectWebGL(), false),
  );
});

test('returns false when the browser refuses to create a WebGL 2 context', () => {
  withBrowserGlobals(
    { WebGL2RenderingContext: function WebGL2RenderingContext() {} },
    { createElement: () => ({ getContext: () => null }) },
    () => assert.equal(detectWebGL(), false),
  );
});

test('accepts WebGL 2 without deliberately losing the new context', () => {
  let extensionRequested = false;
  withBrowserGlobals(
    { WebGL2RenderingContext: function WebGL2RenderingContext() {} },
    {
      createElement: () => ({
        getContext: (name) => name === 'webgl2'
          ? { getExtension: () => { extensionRequested = true; } }
          : null,
      }),
    },
    () => {
      assert.equal(detectWebGL(), true);
      assert.equal(extensionRequested, false);
    },
  );
});

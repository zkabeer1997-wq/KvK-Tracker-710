import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerHooks } from 'node:module';
import { mintAdminToken } from '../lib/adminAuth.js';
import { guideCategories } from '../lib/guideValidation.mjs';

// Exercise actual handlers with a controlled database/storage boundary.
const state = { result: {}, writes: [], paths: [], uploads: [] };
globalThis.__guideTest = state;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('/lib/adminSupabase')) return { url: 'test:database', shortCircuit: true };
    if (specifier === 'next/cache') return { url: 'test:cache', shortCircuit: true };
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    if (specifier.endsWith('/lib/adminAuth')) return nextResolve(`${specifier}.js`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'test:database') return { format: 'module', shortCircuit: true, source: 'export const createAdminSupabaseClient = () => globalThis.__guideTest.client;' };
    if (url === 'test:cache') return { format: 'module', shortCircuit: true, source: 'export const revalidatePath = (...args) => globalThis.__guideTest.paths.push(args);' };
    return nextLoad(url, context);
  },
});
const chain = {
  update(value) { state.writes.push(value); return this; },
  insert(value) { state.writes.push(value); return this; },
  eq(key, value) { state.target = [key, value]; return this; },
  select() { return this; },
  async single() { return state.result; },
  async maybeSingle() { return state.result; },
};
state.client = {
  from() { return chain; },
  storage: { from() { return {
    async upload(...args) { state.uploads.push(args); return { error: null }; },
    getPublicUrl(path) { return { data: { publicUrl: `https://storage.example/${path}` } }; },
  }; } },
};
const { PUT } = await import('../app/api/admin-guides/[slug]/route.js');
const { POST: categoryPost } = await import('../app/api/admin-guide-categories/route.js');
const { POST: photoPost } = await import('../app/api/admin-guide-images/route.js');
process.env.ADMIN_PASSWORD = 'guide-editor-test-only';
const token = await mintAdminToken();
function request(body, authenticated = true) {
  return { cookies: { get: () => authenticated ? { value: token } : undefined }, json: async () => body, formData: async () => body };
}
const guide = { slug: 'renamed-guide', title: 'Updated title', description: 'Updated description', category: 'New Category', body: '## Guide\n\n![Formation](https://example.com/photo.png)', position: 10, is_published: true };
const params = { params: Promise.resolve({ slug: 'old-guide' }) };

test('all mutation endpoints reject an unauthenticated caller', async () => {
  const before = state.writes.length;
  for (const handler of [PUT, categoryPost, photoPost]) assert.equal((await handler(request({}, false), params)).status, 401);
  assert.equal(state.writes.length, before);
  assert.equal(state.uploads.length, 0);
});
test('saving renames the existing row and invalidates old and new public URLs', async () => {
  state.result = { data: guide, error: null };
  const response = await PUT(request(guide), params);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).guide, guide);
  assert.deepEqual(state.target, ['slug', 'old-guide']);
  assert.equal(state.writes.at(-1).description, guide.description);
  assert.equal(state.writes.at(-1).body, guide.body);
  for (const path of ['/guides', '/guides/old-guide', '/guides/renamed-guide']) assert.ok(state.paths.some(p => p[0] === path));
});
test('slug collisions and removed guides return actionable errors', async () => {
  state.result = { data: null, error: { code: '23505' } };
  assert.equal((await PUT(request(guide), params)).status, 409);
  state.result = { data: null, error: null };
  assert.equal((await PUT(request(guide), params)).status, 404);
});
test('invalid slugs and oversized text never reach the database', async () => {
  const before = state.writes.length;
  for (const payload of [{ ...guide, slug: '../admin' }, { ...guide, body: 'x'.repeat(120001) }, { ...guide, title: '' }]) {
    assert.equal((await PUT(request(payload), params)).status, 400);
  }
  assert.equal(state.writes.length, before);
});
test('standalone categories save and trigger a public directory refresh', async () => {
  state.result = { data: { name: 'Pets' }, error: null };
  assert.equal((await categoryPost(request({ name: ' Pets ' }))).status, 201);
  assert.equal(state.writes.at(-1).name, 'Pets');
  assert.deepEqual(guideCategories([{ category: 'Battle Guide' }], [{ name: 'Pets' }, { name: 'Battle Guide' }]), ['Battle Guide', 'Pets']);
});
test('image validation rejects oversized or disguised files before storage', async () => {
  for (const file of [new File(['not a PNG'], 'fake.png', { type: 'image/png' }), new File([new Uint8Array(3145729)], 'big.jpg', { type: 'image/jpeg' })]) {
    const form = new FormData(); form.set('file', file);
    assert.ok([413, 415].includes((await photoPost(request(form))).status));
  }
  assert.equal(state.uploads.length, 0);
});
test('valid photo uploads get unique image paths and a usable public URL', async () => {
  const form = new FormData();
  form.set('file', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN3sAAAAASUVORK5CYII=', 'base64')], 'photo.png', { type: 'image/png' }));
  const response = await photoPost(request(form));
  assert.equal(response.status, 201);
  assert.match((await response.json()).url, /^https:\/\/storage\.example\/[\w-]+\.png$/);
  assert.equal(state.uploads[0][2].upsert, false);
});

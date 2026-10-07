import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { previewStorageScript, writeCatalog } from '../scripts/pages-catalog.mjs';

test('version catalog escapes commit text and distinguishes unavailable builds', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'myoffice-catalog-test-'));
  const sha = 'a'.repeat(40);
  try {
    await writeCatalog(directory, [
      { sha, title: '<script>alert("bad")</script>', date: '2026-10-07T12:00:00Z', status: 'ready' },
      { sha: 'b'.repeat(40), title: 'Initial commit', date: '2026-10-06T12:00:00Z', status: 'unavailable' },
    ], sha, '/MyOffice/', 'neillhidden/MyOffice');
    const html = await readFile(path.join(directory, 'versoes/index.html'), 'utf8');
    assert.ok(!html.includes('<script>alert'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes(`href="${sha}/"`));
    assert.ok(!html.includes(`href="${'b'.repeat(40)}/"`));
    assert.ok(html.includes('Pré-visualização indisponível'));
    const manifest = JSON.parse(await readFile(path.join(directory, 'versions.json'), 'utf8'));
    assert.equal(manifest.currentSha, sha);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('storage bootstrap accepts full commit IDs only', () => {
  assert.throws(() => previewStorageScript("</script>"));
  assert.throws(() => previewStorageScript('abc123'));
  assert.ok(previewStorageScript('c'.repeat(40)).includes('myoffice_preview_'));
});

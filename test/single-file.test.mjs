// The one-file copy made by tools/single-file.mjs:  node --test test/single-file.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the one-file copy fits a phone screen and says it is UTF-8', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bloodlines-'));
  try {
    const out = join(dir, 'bloodlines.html');
    execFileSync(process.execPath, [join(root, 'tools/single-file.mjs'), out]);
    const html = readFileSync(out, 'utf8');
    assert.match(html, /^<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

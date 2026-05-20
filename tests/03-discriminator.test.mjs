// T3 — Discriminator unit tests
// For each fixture under tests/fixtures/<source>/, detectSourceType returns the expected type.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectSourceType } from '../scripts/discriminator.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const cases = [
  { dir: 'claude-design',   expected: 'claude-design', shape: 'flat' },
  { dir: 'figma',           expected: 'figma',         shape: 'flat' },
  { dir: 'v0',              expected: 'v0',            shape: 'flat' },
  { dir: 'lovable',         expected: 'lovable',       shape: 'flat' },
  { dir: 'webflow',         expected: 'webflow',       shape: 'flat' },
  { dir: 'screenshot-only', expected: 'screenshot-only', shape: 'flat' },
  { dir: 'generic',         expected: 'generic-html',  shape: 'flat' },
  { dir: 'iter-paper-v2',   expected: 'paper',         shape: 'iter', signal: /source-meta v2/ },
];

for (const c of cases) {
  test(`discriminator: ${c.dir} → ${c.expected} (${c.shape})`, () => {
    const result = detectSourceType(join(FIXTURES, c.dir));
    assert.equal(result.type, c.expected, `expected type ${c.expected}, got ${result.type} (signal: ${result.signal})`);
    assert.equal(result.shape, c.shape, `expected shape ${c.shape}, got ${result.shape}`);
    if (c.signal) assert.match(result.signal, c.signal);
  });
}

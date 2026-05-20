// T14 — Extractor Gate 5a short-circuit content audit
// When sourceShape === 'iter', the extractor must NOT parse review.html —
// it should copy the pre-extracted JSX from the source-snapshot/jsx/ folder.
// HTML extraction is the lossiest gate when fed Claude Design output, so
// short-circuiting it is the biggest quality win of the iter pipeline.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX_PATH = join(ROOT, 'agents/canvas-to-code-extractor.md');

function loadExtractor() {
  return readFileSync(EX_PATH, 'utf8');
}

test('extractor declares a Gate 5a iter short-circuit section', () => {
  const content = loadExtractor();
  assert.match(content, /short-circuit/i, 'extractor must declare a short-circuit path');
  assert.match(content, /sourceShape\s*===?\s*"iter"/i, 'extractor must gate the short-circuit on sourceShape');
});

test('extractor reads status.json before deciding which path to run', () => {
  const content = loadExtractor();
  assert.match(content, /\.design-to-code\/state\/[^/]*\/status\.json/i);
});

test('extractor copies pre-extracted JSX from source-snapshot', () => {
  const content = loadExtractor();
  assert.match(content, /source-snapshot\/jsx/);
  assert.match(content, /\/tmp\/<feature>-template\.tsx/);
});

test('extractor frontmatter grants Write + Bash so it can copy the file', () => {
  const content = loadExtractor();
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'extractor has frontmatter');
  const tools = m[1].match(/^tools:\s*(.*)$/m)?.[1] || '';
  assert.match(tools, /Write/);
  assert.match(tools, /Bash/);
});

test('flat-shape decoder paths still documented (no regression)', () => {
  const content = loadExtractor();
  for (const decoder of ['Claude Design', 'Figma', 'V0', 'Webflow', 'Screenshot-only']) {
    assert.ok(content.includes(decoder), `extractor must still document ${decoder} decoder`);
  }
});

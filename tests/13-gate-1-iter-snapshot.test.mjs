// T13 — Gate 1 iter snapshot content audit
// The PM agent's prompt must contain the iter-shape branch with the snapshot
// procedure. If someone deletes this section, the bridge silently falls back
// to today's flat-shape Gate 1 and loses the iter contract.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PM_PATH = join(ROOT, 'agents/canvas-to-code-pm.md');

function loadPm() {
  return readFileSync(PM_PATH, 'utf8');
}

test('PM agent branches Gate 1 on sourceShape', () => {
  const content = loadPm();
  assert.match(content, /sourceShape\s*===?\s*"iter"/i, 'PM must branch on sourceShape for Gate 1');
});

test('PM agent describes the source-snapshot target directory', () => {
  const content = loadPm();
  assert.ok(
    content.includes('source-snapshot'),
    'PM must mention the source-snapshot directory under .canvas-to-code/state/<feature>/',
  );
});

test('PM agent verifies the seven v2 required fields at Gate 1', () => {
  const content = loadPm();
  for (const field of ['metaVersion', 'source', 'feature', 'subpage', 'targetRoute', 'jsxPath', 'primaryScreenshot']) {
    assert.ok(content.includes(field), `Gate 1 must mention required v2 field: ${field}`);
  }
});

test('PM agent fails loudly when metaVersion is missing or unsupported', () => {
  const content = loadPm();
  assert.match(content, /metaVersion\b[\s\S]{0,200}backfill/i, 'PM must point at producer skill for backfill on unsupported metaVersion');
});

test("PM agent's flat-shape Gate 1 branch still runs review.html + screenshots check", () => {
  const content = loadPm();
  assert.match(content, /sourceShape\s*===?\s*"flat"/i, 'PM must retain the flat-shape Gate 1 branch');
  assert.match(content, /review\.html/i);
  assert.match(content, /screenshots\//i);
});

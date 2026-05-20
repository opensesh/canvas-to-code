// T15 — Gate 0 picker content audit
// The default-path guided discovery menu must surface iter folders as
// pickable options alongside active features and loose materials. Selecting
// an iter must auto-fill Gate 0 from source-meta.yaml — otherwise the iter
// contract is wasted.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

test('PM agent describes a unified discovery menu (active + iter + loose)', () => {
  const pm = read('agents/canvas-to-code-pm.md');
  assert.match(pm, /Active feature/i);
  assert.match(pm, /Iter folder/i);
  assert.match(pm, /Loose materials/i);
});

test('PM agent scans for v2 iter folders with metaVersion: 2', () => {
  const pm = read('agents/canvas-to-code-pm.md');
  assert.match(pm, /metaVersion[:\s]+2/);
  assert.match(pm, /iter-\*/, 'PM must scan iter-* directory pattern');
});

test('PM agent auto-fills Gate 0 from iter source-meta on selection', () => {
  const pm = read('agents/canvas-to-code-pm.md');
  for (const field of ['feature', 'subpage', 'targetRoute', 'sourceShape', 'sourceIterPath']) {
    assert.ok(pm.includes(field), `picker route must set ${field}`);
  }
  assert.match(pm, /sourceShape:\s*"iter"|sourceShape\s*=\s*"iter"|sourceShape:\s*'iter'/);
});

test('start command surfaces the unified menu in its docs', () => {
  const start = read('commands/start.md');
  assert.match(start, /Iter folders \(v2\)/i);
  assert.match(start, /Import from external/i);
  assert.match(start, /Start blank/i);
});

test('PM agent collapses menu when .claude-design/ is empty', () => {
  const pm = read('agents/canvas-to-code-pm.md');
  // The PM must explicitly handle the empty/absent case (fall through to
  // external + blank options).
  assert.match(pm, /empty[\s\S]{0,200}external|External[\s\S]{0,200}blank/i);
});

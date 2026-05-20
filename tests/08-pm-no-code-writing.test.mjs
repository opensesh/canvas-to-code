// T8 — PM no-code-writing audit
// We can't run a live agent in CI, so this is a content audit of the agent file:
// the PM's system prompt must contain anchor phrases proving the rule is encoded.

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

test('PM agent file exists', () => {
  const content = loadPm();
  assert.ok(content.length > 100);
});

test('PM agent declares "never writes feature code" in its description or body', () => {
  const content = loadPm().toLowerCase();
  assert.ok(
    content.includes('never writes feature code') ||
      content.includes("never write feature code") ||
      content.includes("doesn't write feature code"),
    'PM agent must declare no-code-writing as a core rule',
  );
});

test('PM agent explains decline-and-offer behavior', () => {
  const content = loadPm().toLowerCase();
  assert.ok(
    content.includes('decline') || content.includes('refuse'),
    'PM agent must describe declining/refusing code requests',
  );
});

test('PM agent scopes Write/Edit tools to non-production paths', () => {
  const content = loadPm();
  // Must mention the scoping (state file, .claude-design/, docs/spikes)
  assert.ok(content.includes('.canvas-to-code/state'), 'PM must mention scoping Write to state dir');
  assert.ok(content.includes('docs/spikes/design-system'), 'PM must mention scoping Write to spike docs');
});

test('PM frontmatter declares Write+Edit (still allowed for scoped writes)', () => {
  const content = loadPm();
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'has frontmatter');
  const tools = m[1].match(/^tools:\s*(.*)$/m)?.[1] || '';
  assert.match(tools, /Write/);
  assert.match(tools, /Edit/);
  // Note: scoping is enforced by system prompt, not by tool removal — the agent
  // needs Write to update status.json. The hard rule is in the body.
});

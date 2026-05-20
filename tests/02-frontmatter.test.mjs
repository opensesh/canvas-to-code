// T2 — Frontmatter validation
// Every command has description + allowed-tools + optional argument-hint.
// Every agent has name + description + model ∈ {opus,sonnet,haiku} + tools.
// Every skill has description.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (mm) fields[mm[1]] = mm[2].trim();
  }
  return fields;
}

test('every command has description + allowed-tools', () => {
  const dir = join(ROOT, 'commands');
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const fm = parseFrontmatter(join(dir, f));
    assert.ok(fm, `${f}: no frontmatter`);
    assert.ok(fm.description?.length > 10, `${f}: description missing or too short`);
    assert.ok(fm['allowed-tools']?.length > 0, `${f}: allowed-tools missing`);
  }
});

test('every agent has name + description + model + tools', () => {
  const dir = join(ROOT, 'agents');
  const validModels = ['opus', 'sonnet', 'haiku'];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const fm = parseFrontmatter(join(dir, f));
    assert.ok(fm, `${f}: no frontmatter`);
    assert.ok(fm.name?.startsWith('canvas-to-code-'), `${f}: name missing or wrong prefix`);
    assert.ok(fm.description?.length > 10, `${f}: description missing`);
    assert.ok(validModels.includes(fm.model), `${f}: model ${fm.model} not in ${validModels.join(',')}`);
    assert.ok(fm.tools?.length > 0, `${f}: tools missing`);
  }
});

test('every skill has name + description', () => {
  const dir = join(ROOT, 'skills');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const fm = parseFrontmatter(join(dir, f));
    assert.ok(fm, `${f}: no frontmatter`);
    assert.ok(fm.name?.startsWith('canvas-to-code-'), `${f}: name missing or wrong prefix`);
    assert.ok(fm.description?.length > 20, `${f}: description missing or too short`);
  }
});

test('PM agent uses opus, mapper/planner/extractor use opus, auditor/reviewer use sonnet', () => {
  const expected = {
    'canvas-to-code-pm.md':        'opus',
    'canvas-to-code-mapper.md':    'opus',
    'canvas-to-code-extractor.md': 'opus',
    'canvas-to-code-planner.md':   'opus',
    'canvas-to-code-auditor.md':   'sonnet',
    'canvas-to-code-reviewer.md':  'sonnet',
  };
  for (const [file, model] of Object.entries(expected)) {
    const fm = parseFrontmatter(join(ROOT, 'agents', file));
    assert.equal(fm.model, model, `${file}: expected model ${model}, got ${fm.model}`);
  }
});

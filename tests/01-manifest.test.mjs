// T1 — Manifest validation
// plugin.json parses; every command/agent/skill/hook file it implicitly declares
// (via the directory convention) exists at the declared path.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('plugin.json parses and has required fields', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(manifest.name, 'canvas-to-code');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok(manifest.description?.length > 20, 'description is meaningful');
  assert.ok(manifest.author?.name, 'has author.name');
  assert.match(manifest.repository, /github\.com\/opensesh\/canvas-to-code/);
});

test('marketplace.json parses and points at the renamed repo', () => {
  const m = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.equal(m.name, 'canvas-to-code-marketplace');
  assert.equal(m.plugins[0].name, 'canvas-to-code');
  assert.equal(m.plugins[0].source.repo, 'opensesh/canvas-to-code');
});

test('commands/ exists with 3 files at the flat top level', () => {
  const cmdDir = join(ROOT, 'commands');
  assert.ok(existsSync(cmdDir), 'commands dir exists');
  const files = readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
  assert.equal(files.length, 3, `expected 3 commands, got ${files.length}: ${files.join(', ')}`);
  const expected = ['start', 'dashboard', 'assets'];
  for (const name of expected) {
    assert.ok(files.includes(`${name}.md`), `missing command: ${name}.md`);
  }
  // No subdirectories under commands/ — a nested layer would create a doubled
  // slash-command namespace and break the picker.
  const subdirs = readdirSync(cmdDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert.equal(subdirs.length, 0, `commands/ must be flat; found subdirs: ${subdirs.map((d) => d.name).join(', ')}`);
});

test('agents/ exists with 7 canvas-to-code-* subagents', () => {
  const agentDir = join(ROOT, 'agents');
  const files = readdirSync(agentDir).filter((f) => f.endsWith('.md'));
  assert.equal(files.length, 7);
  const expected = ['pm', 'extractor', 'auditor', 'mapper', 'planner', 'reviewer', 'data-binder'];
  for (const name of expected) {
    assert.ok(files.includes(`canvas-to-code-${name}.md`), `missing agent: canvas-to-code-${name}.md`);
  }
  // Every agent filename must start with canvas-to-code- (positive guard
  // replaces the earlier negative check against the legacy prefix).
  for (const f of files) {
    assert.ok(f.startsWith('canvas-to-code-'), `agent ${f} must use the canvas-to-code- prefix`);
  }
});

test('skills/ exists with 3 canvas-to-code-* skills', () => {
  const dir = join(ROOT, 'skills');
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.equal(files.length, 3);
  for (const name of ['canvas-to-code-guardrails.md', 'canvas-to-code-vocabulary.md', 'canvas-to-code-source-shapes.md']) {
    assert.ok(files.includes(name), `missing skill: ${name}`);
  }
  for (const f of files) {
    assert.ok(f.startsWith('canvas-to-code-'), `skill ${f} must use the canvas-to-code- prefix`);
  }
});

test('hooks/ exists with 2 executable shell scripts', () => {
  const dir = join(ROOT, 'hooks');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sh'));
  assert.equal(files.length, 2);
  for (const f of files) {
    const path = join(dir, f);
    const mode = statSync(path).mode;
    // owner-execute bit (0o100) must be set
    assert.ok((mode & 0o100) !== 0, `${f} must be executable`);
  }
});

test('templates/ has 7 templates + 11 gate-failures + 2 example configs', () => {
  const dir = join(ROOT, 'templates');
  const expected = ['plan.md', 'slice-pr-body.md', 'swap-pr-body.md', 'retro-section.md', 'designer-handoff.md', 'spike.md', 'dashboard.md', 'config.example.yaml', 'token-map.example.yaml'];
  for (const f of expected) {
    assert.ok(existsSync(join(dir, f)), `missing template: ${f}`);
  }
  const gateFailures = readdirSync(join(dir, 'gate-failures')).filter((f) => f.endsWith('.md'));
  assert.equal(gateFailures.length, 11);
  for (let i = 0; i <= 10; i++) {
    assert.ok(gateFailures.some((f) => f.startsWith(`${i}-`)), `missing gate-failure for gate ${i}`);
  }
});

test('scripts/ has 4 helper modules', () => {
  const dir = join(ROOT, 'scripts');
  for (const name of ['discriminator.mjs', 'status-machine.mjs', 'render-dashboard.mjs', 'check-guardrails.mjs']) {
    assert.ok(existsSync(join(dir, name)), `missing script: ${name}`);
  }
});

test('examples/brand-hub/ has fixture + goldens', () => {
  const dir = join(ROOT, 'examples/brand-hub');
  assert.ok(existsSync(join(dir, 'review.html')));
  assert.ok(existsSync(join(dir, 'expected-mapper-output.json')));
  assert.ok(existsSync(join(dir, 'expected-status.json')));
});

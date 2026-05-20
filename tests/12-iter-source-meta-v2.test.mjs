// T12 — Source-meta v2 schema
// The v2 contract is the handshake between producer skills (e.g. paper-design)
// and the canvas-to-code bridge. The iter fixture MUST carry every required
// field — if it loses one, every consumer that uses an iter folder breaks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSimpleYaml } from '../scripts/discriminator.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const META_PATH = join(FIXTURES, 'iter-paper-v2', 'source-meta.yaml');

const REQUIRED_V2 = ['metaVersion', 'source', 'feature', 'subpage', 'targetRoute', 'jsxPath', 'primaryScreenshot'];
const VALID_SOURCES = ['paper', 'claude-design', 'figma', 'v0', 'lovable', 'webflow', 'screenshot-only', 'generic-html'];

test('iter fixture source-meta.yaml parses', () => {
  const yaml = parseSimpleYaml(readFileSync(META_PATH, 'utf8'));
  assert.ok(Object.keys(yaml).length > 0);
});

test('iter fixture has every v2 required field', () => {
  const yaml = parseSimpleYaml(readFileSync(META_PATH, 'utf8'));
  for (const key of REQUIRED_V2) {
    assert.ok(yaml[key], `missing required v2 field: ${key}`);
    assert.notEqual(String(yaml[key]).trim(), '', `empty required v2 field: ${key}`);
  }
});

test('iter fixture declares metaVersion: 2', () => {
  const yaml = parseSimpleYaml(readFileSync(META_PATH, 'utf8'));
  assert.equal(String(yaml.metaVersion), '2');
});

test('iter fixture source is in the canonical enum', () => {
  const yaml = parseSimpleYaml(readFileSync(META_PATH, 'utf8'));
  assert.ok(VALID_SOURCES.includes(yaml.source), `source '${yaml.source}' not in ${VALID_SOURCES.join('|')}`);
});

test('iter fixture targetRoute follows the convention', () => {
  // /<feature> when subpage=home, otherwise /<feature>/<subpage>
  const yaml = parseSimpleYaml(readFileSync(META_PATH, 'utf8'));
  const expected = yaml.subpage === 'home' ? `/${yaml.feature}` : `/${yaml.feature}/${yaml.subpage}`;
  assert.equal(yaml.targetRoute, expected);
});

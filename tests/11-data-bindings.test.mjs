// T11 — Data-binder output schema test
// The golden examples/brand-hub/expected-data-bindings.json parses,
// matches the dataBindings schema, and the rollup matches entries[]
// dataSource counts. Mirrors T4's shape-validation style.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = join(ROOT, 'examples/brand-hub/expected-data-bindings.json');

const VALID_DATA_SOURCES = ['backend', 'mock', 'none'];
const VALID_CONFIDENCE = ['high', 'medium', 'low'];
const VALID_FILE_KINDS = ['mock', 'schema', 'type'];

test('golden file parses', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  assert.ok(data);
});

test('golden has required top-level fields', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  assert.ok(data.rollup);
  assert.equal(typeof data.rollup.backend, 'number');
  assert.equal(typeof data.rollup.mock, 'number');
  assert.equal(typeof data.rollup.none, 'number');
  assert.equal(typeof data.lowConfidenceCount, 'number');
  assert.ok(Array.isArray(data.entries));
  assert.ok(Array.isArray(data.filesToWrite));
});

test('every entry has valid dataSource / confidence', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const entry of data.entries) {
    assert.ok(entry.unitLabel?.length > 0, `entry missing unitLabel: ${JSON.stringify(entry)}`);
    assert.ok(entry.targetPath?.length > 0, `entry missing targetPath: ${entry.unitLabel}`);
    assert.ok(VALID_DATA_SOURCES.includes(entry.dataSource), `entry ${entry.unitLabel}: invalid dataSource ${entry.dataSource}`);
    assert.ok(VALID_CONFIDENCE.includes(entry.confidence), `entry ${entry.unitLabel}: invalid confidence ${entry.confidence}`);
  }
});

test('backend entries declare a backendService (not null)', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const entry of data.entries.filter((e) => e.dataSource === 'backend')) {
    assert.ok(entry.backendService?.length > 0, `backend entry ${entry.unitLabel} missing backendService`);
    assert.equal(entry.mockFile, null, `backend entry ${entry.unitLabel} should have null mockFile`);
    assert.equal(entry.schemaFile, null, `backend entry ${entry.unitLabel} should have null schemaFile`);
    assert.equal(entry.typeFile, null, `backend entry ${entry.unitLabel} should have null typeFile`);
  }
});

test('mock entries declare a full mock/schema/type triple (non-null)', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const entry of data.entries.filter((e) => e.dataSource === 'mock')) {
    assert.ok(entry.mockFile?.length > 0, `mock entry ${entry.unitLabel} missing mockFile`);
    assert.ok(entry.schemaFile?.length > 0, `mock entry ${entry.unitLabel} missing schemaFile`);
    assert.ok(entry.typeFile?.length > 0, `mock entry ${entry.unitLabel} missing typeFile`);
    assert.equal(entry.backendService, null, `mock entry ${entry.unitLabel} should have null backendService`);
    assert.ok(entry.mockFile.startsWith('data/'), `mock entry ${entry.unitLabel}: mockFile must live under data/`);
    assert.ok(entry.schemaFile.startsWith('data/'), `mock entry ${entry.unitLabel}: schemaFile must live under data/`);
    assert.ok(entry.typeFile.startsWith('types/mocks/'), `mock entry ${entry.unitLabel}: typeFile must live under types/mocks/`);
  }
});

test('none entries have all data-source fields null', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const entry of data.entries.filter((e) => e.dataSource === 'none')) {
    assert.equal(entry.backendService, null, `none entry ${entry.unitLabel} should have null backendService`);
    assert.equal(entry.backendHook, null, `none entry ${entry.unitLabel} should have null backendHook`);
    assert.equal(entry.mockFile, null, `none entry ${entry.unitLabel} should have null mockFile`);
    assert.equal(entry.schemaFile, null, `none entry ${entry.unitLabel} should have null schemaFile`);
    assert.equal(entry.typeFile, null, `none entry ${entry.unitLabel} should have null typeFile`);
  }
});

test('rollup matches entries[] dataSource counts', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const ds of VALID_DATA_SOURCES) {
    const actual = data.entries.filter((e) => e.dataSource === ds).length;
    assert.equal(data.rollup[ds], actual, `rollup.${ds} mismatch: declared=${data.rollup[ds]}, actual=${actual}`);
  }
});

test('rollup sums to entries.length', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const total = data.rollup.backend + data.rollup.mock + data.rollup.none;
  assert.equal(total, data.entries.length, `rollup total (${total}) must equal entries.length (${data.entries.length})`);
});

test('lowConfidenceCount matches entries with confidence=low', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const actualLow = data.entries.filter((e) => e.confidence === 'low').length;
  assert.equal(data.lowConfidenceCount, actualLow);
});

test('filesToWrite covers every mock entry triple', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const declared = new Set(data.filesToWrite.map((f) => f.path));
  for (const entry of data.entries.filter((e) => e.dataSource === 'mock')) {
    assert.ok(declared.has(entry.mockFile), `filesToWrite missing mockFile for ${entry.unitLabel}: ${entry.mockFile}`);
    assert.ok(declared.has(entry.schemaFile), `filesToWrite missing schemaFile for ${entry.unitLabel}: ${entry.schemaFile}`);
    assert.ok(declared.has(entry.typeFile), `filesToWrite missing typeFile for ${entry.unitLabel}: ${entry.typeFile}`);
  }
});

test('filesToWrite entries have a valid kind', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const f of data.filesToWrite) {
    assert.ok(VALID_FILE_KINDS.includes(f.kind), `filesToWrite entry has invalid kind: ${f.kind} (${f.path})`);
    if (f.kind === 'mock')   assert.match(f.path, /\.mock\.json$/);
    if (f.kind === 'schema') assert.match(f.path, /\.schema\.json$/);
    if (f.kind === 'type')   assert.match(f.path, /^types\/mocks\/.+\.ts$/);
  }
});

test('mock entry file paths match the hierarchical data/<page>/<subpage> convention', () => {
  const data = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const entry of data.entries.filter((e) => e.dataSource === 'mock')) {
    const expectedMock = entry.subpage
      ? `data/${entry.page}/${entry.subpage}.mock.json`
      : `data/${entry.page}/index.mock.json`;
    assert.equal(entry.mockFile, expectedMock, `mock entry ${entry.unitLabel}: mockFile must be ${expectedMock}, got ${entry.mockFile}`);
    const expectedType = entry.subpage
      ? `types/mocks/${entry.page}-${entry.subpage}.ts`
      : `types/mocks/${entry.page}.ts`;
    assert.equal(entry.typeFile, expectedType, `mock entry ${entry.unitLabel}: typeFile must be ${expectedType}, got ${entry.typeFile}`);
  }
});

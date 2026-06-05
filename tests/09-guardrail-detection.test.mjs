// T9 — Guardrail detection
// Given the synthetic violations.diff, check-guardrails detects every rule.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGuardrails, aggregate } from '../scripts/check-guardrails.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIFF_PATH = join(ROOT, 'tests/fixtures/guardrail-violations.diff');

test('checkGuardrails returns at least one finding per active rule', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const findings = checkGuardrails(diff);
  const counts = aggregate(findings);

  // Each of the active rules in the fixture must fire at least once.
  assert.ok(counts['devProps'] >= 1, `devProps: ${counts['devProps']}`);
  assert.ok(counts['border-2'] >= 1, `border-2: ${counts['border-2']}`);
  assert.ok(counts['ring-2'] >= 1, `ring-2: ${counts['ring-2']}`);
  assert.ok(counts['raw-hex'] >= 1, `raw-hex: ${counts['raw-hex']}`);
  assert.ok(counts['style-1-vars'] >= 1, `style-1-vars: ${counts['style-1-vars']}`);
  assert.ok(counts['array-index-keys'] >= 1, `array-index-keys: ${counts['array-index-keys']}`);
  assert.ok(counts['pages-import-base'] >= 1, `pages-import-base: ${counts['pages-import-base']}`);
});

test('pages-import-base fires for a page importing base/ but not for a custom/shared wrapper', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const findings = checkGuardrails(diff);
  const pib = findings.filter((f) => f.rule === 'pages-import-base');
  // Only the app/ page importing base/ trips it — the custom/shared/ wrapper is exempt.
  assert.equal(pib.length, 1, `expected 1 pages-import-base, got ${pib.length}: ${JSON.stringify(pib)}`);
  assert.match(pib[0].file, /app\/\(dashboard\)\/example\/page\.tsx$/);
});

test('array-index-keys is the most-frequent violation in the fixture (8 instances)', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const counts = aggregate(checkGuardrails(diff));
  assert.equal(counts['array-index-keys'], 8, `expected 8 array-index-keys, got ${counts['array-index-keys']}`);
});

test('ring-2 fires exactly 2 times', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const counts = aggregate(checkGuardrails(diff));
  assert.equal(counts['ring-2'], 2);
});

test('devProps name-mismatch fires when function name and devProps string differ', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const findings = checkGuardrails(diff);
  const dp = findings.filter((f) => f.rule === 'devProps');
  assert.ok(dp.length >= 1);
  assert.match(dp[0].content, /name mismatch/);
});

test('findings include file:line citations', () => {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const findings = checkGuardrails(diff);
  for (const f of findings) {
    assert.ok(f.file?.length > 0, 'has file');
    assert.equal(typeof f.line, 'number');
    assert.ok(f.line > 0, 'has positive line number');
  }
});

test('empty diff produces no findings', () => {
  const findings = checkGuardrails('');
  assert.equal(findings.length, 0);
});

test('clean diff (no violations) produces no findings', () => {
  const cleanDiff = `diff --git a/x.tsx b/x.tsx
new file mode 100644
--- /dev/null
+++ b/x.tsx
@@ -0,0 +1,5 @@
+import { devProps } from '@/lib/utils/dev-props';
+
+export function Good() {
+  return <div {...devProps('Good')} className="bg-bg-primary border border-border-secondary" />;
+}
`;
  const findings = checkGuardrails(cleanDiff);
  assert.equal(findings.length, 0, `clean diff produced findings: ${JSON.stringify(findings)}`);
});

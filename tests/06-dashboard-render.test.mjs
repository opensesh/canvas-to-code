// T6 — Dashboard render
// Feed two synthetic status.json files (one complete, one mid-slice). Assert the
// markdown output contains: aggregate block, per-feature table with PR cross-refs,
// component +/− diff for each feature.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDashboard } from '../scripts/render-dashboard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadStatuses() {
  return [
    JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/dashboard/complete.status.json'), 'utf8')),
    JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/dashboard/midflight.status.json'), 'utf8')),
  ];
}

test('header is present', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /Canvas-to-Code — Dashboard/);
});

test('cumulative block lists features bridged: 2', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /Features bridged:\s+2/);
});

test('cumulative total slices merged is the sum across features (6 + 3 = 9)', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /Total slices merged:\s+9/);
});

test('cumulative reuse-ratio is between 0 and 100', () => {
  const md = renderDashboard(loadStatuses());
  const m = md.match(/Reuse ratio:\s+(\d+)%/);
  assert.ok(m, 'reuse ratio line found');
  const ratio = parseInt(m[1], 10);
  assert.ok(ratio >= 0 && ratio <= 100, `ratio ${ratio} out of range`);
});

test('per-feature table includes both features with PR ranges', () => {
  const md = renderDashboard(loadStatuses());
  // brand-hub-hifi: PRs #314–#319
  assert.match(md, /brand-hub-hifi[\s\S]*#314.*#319/);
  // spaces-redesign: PRs #341–#343
  assert.match(md, /spaces-redesign[\s\S]*#341.*#343/);
});

test('per-feature table includes +/− diff for both features', () => {
  const md = renderDashboard(loadStatuses());
  // brand-hub-hifi: 24 new / 23 reused (per the Brand Hub golden)
  assert.match(md, /brand-hub-hifi[\s\S]*\+24 \/ −23/);
  // spaces-redesign: 9 new / 18 reused (per the mid-flight fixture)
  assert.match(md, /spaces-redesign[\s\S]*\+9 \/ −18/);
});

test('per-feature component diff section is rendered', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /### brand-hub-hifi/);
  assert.match(md, /### spaces-redesign/);
  assert.match(md, /\+ 8 new custom-shared/);
  assert.match(md, /\+ 12 new custom-page/);
  assert.match(md, /\+ 3 net-new/);
  assert.match(md, /− 19 reused base/);
});

test('mid-flight feature shows slice fraction', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /spaces-redesign\s*\|\s*slice \(3\/5\)/);
});

test('complete feature shows status `complete`', () => {
  const md = renderDashboard(loadStatuses());
  assert.match(md, /brand-hub-hifi\s*\|\s*complete/);
});

test('per-feature table includes Backend / Mock column populated for features with dataBindings', () => {
  const md = renderDashboard(loadStatuses());
  // complete.status.json has dataBindings: rollup.backend=4, mock=4 -> cell "4 / 4"
  assert.match(md, /brand-hub-hifi[\s\S]*\+24 \/ −23 \| 4 \/ 4/);
});

test('per-feature table renders Backend / Mock as — when dataBindings missing (graceful fallback)', () => {
  const md = renderDashboard(loadStatuses());
  // midflight.status.json has no dataBindings -> cell "—"
  assert.match(md, /spaces-redesign[\s\S]*\+9 \/ −18 \| —/);
});

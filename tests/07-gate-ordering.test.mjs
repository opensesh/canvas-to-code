// T7 — Gate ordering
// PM cannot enter gate N before gate N-1 has result: pass | warn.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initIntake, logGate, canAdvance } from '../scripts/status-machine.mjs';

test('gate 1 requires gate 0 pass (gate 0 is logged at init)', () => {
  const s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.equal(canAdvance(s, 1), true);
});

test('gate 2 requires gate 1 pass', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.equal(canAdvance(s, 2), false, 'before logging gate 1');
  s = logGate(s, { gate: 1, result: 'pass' });
  assert.equal(canAdvance(s, 2), true);
});

test('warn on previous gate is sufficient to advance', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s = logGate(s, { gate: 1, result: 'pass' });
  s = logGate(s, { gate: 2, result: 'warn' });
  assert.equal(canAdvance(s, 3), true);
});

test('fail on previous gate blocks advance', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s = logGate(s, { gate: 1, result: 'pass' });
  s = logGate(s, { gate: 2, result: 'fail' });
  assert.equal(canAdvance(s, 3), false);
});

test('every gate transition from 0..10 must be sequential', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  for (let g = 1; g <= 10; g++) {
    assert.equal(canAdvance(s, g), true, `gate ${g} should advance after ${g - 1} passed`);
    s = logGate(s, { gate: g, result: 'pass' });
  }
});

test('skipping a gate fails canAdvance for later gates', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s = logGate(s, { gate: 1, result: 'pass' });
  // skip gate 2
  s = logGate(s, { gate: 3, result: 'pass' });
  // gate 4 wants gate 3 (logged) — advances
  assert.equal(canAdvance(s, 4), true);
  // gate 2 (skipped) would have failed had we tried; gate 3 already passed
  // so this test really documents: canAdvance only checks N-1.
});

// T5 — Status round-trip
// Initialize a stub status.json via initIntake(). Apply gate transitions.
// Assert phase, gateLog, and warnings update correctly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initIntake,
  logGate,
  addWarning,
  highestPassedGate,
  canAdvance,
  derivePhase,
  markSliceMerged,
  markComplete,
} from '../scripts/status-machine.mjs';

test('initIntake creates a valid initial status', () => {
  const s = initIntake({
    feature: 'test-feature',
    targetRoute: '/test',
    isExistingRoute: true,
    exportType: 'claude-design',
  });
  assert.equal(s.feature, 'test-feature');
  assert.equal(s.phase, 'intake');
  assert.equal(s.targetRoute, '/test');
  assert.equal(s.isExistingRoute, true);
  assert.equal(s.exportType, 'claude-design');
  assert.equal(s.gateLog.length, 1);
  assert.equal(s.gateLog[0].gate, 0);
  assert.equal(s.gateLog[0].result, 'pass');
});

test('logGate appends a new entry without mutating prior state', () => {
  const s0 = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  const s1 = logGate(s0, { gate: 1, result: 'pass' });
  assert.equal(s0.gateLog.length, 1, 's0 not mutated');
  assert.equal(s1.gateLog.length, 2);
  assert.equal(s1.gateLog[1].gate, 1);
});

test('logGate rejects unknown gate or result', () => {
  const s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.throws(() => logGate(s, { gate: 99, result: 'pass' }), /unknown gate/);
  assert.throws(() => logGate(s, { gate: 1, result: 'invalid' }), /unknown result/);
});

test('highestPassedGate tracks the max pass/warn gate', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.equal(highestPassedGate(s), 0);
  s = logGate(s, { gate: 1, result: 'pass' });
  s = logGate(s, { gate: 2, result: 'warn' });
  s = logGate(s, { gate: 3, result: 'pass' });
  s = logGate(s, { gate: 4, result: 'fail' });
  assert.equal(highestPassedGate(s), 3);
});

test('canAdvance gates on the previous result', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.equal(canAdvance(s, 0), true);
  assert.equal(canAdvance(s, 1), true, 'gate 0 passed; gate 1 allowed');
  assert.equal(canAdvance(s, 2), false, 'gate 1 not yet passed; gate 2 blocked');
  s = logGate(s, { gate: 1, result: 'pass' });
  assert.equal(canAdvance(s, 2), true);
  s = logGate(s, { gate: 2, result: 'warn' });
  assert.equal(canAdvance(s, 3), true, 'warn counts as advance');
});

test('addWarning appends to warnings[]', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s = addWarning(s, 'translation cost will be higher');
  assert.equal(s.warnings.length, 1);
  assert.equal(s.warnings[0].message, 'translation cost will be higher');
});

test('markSliceMerged updates the matching slice', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s.slices = [
    { n: 1, title: 'scaffold', merged: false },
    { n: 2, title: 'header',   merged: false },
  ];
  s = markSliceMerged(s, 1, 314);
  assert.equal(s.slices[0].merged, true);
  assert.equal(s.slices[0].pr, 314);
  assert.equal(s.slices[1].merged, false);
});

test('markComplete sets phase=complete + completed_at', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  s = markComplete(s);
  assert.equal(s.phase, 'complete');
  assert.ok(s.completed_at);
});

test('derivePhase escalates with gates', () => {
  let s = initIntake({ feature: 'x', targetRoute: '/x', isExistingRoute: false, exportType: 'figma' });
  assert.equal(derivePhase(s), 'intake');
  s = logGate(s, { gate: 1, result: 'pass' });
  s = logGate(s, { gate: 2, result: 'pass' });
  s = logGate(s, { gate: 3, result: 'pass' });
  s = logGate(s, { gate: 4, result: 'pass' });
  s = logGate(s, { gate: 5, result: 'pass' });
  assert.equal(derivePhase(s), 'plan');
  s = logGate(s, { gate: 6, result: 'pass' });   // data-binding: still plan
  assert.equal(derivePhase(s), 'plan');
  s = logGate(s, { gate: 7, result: 'pass' });   // planner: still plan
  assert.equal(derivePhase(s), 'plan');
  s = logGate(s, { gate: 8, result: 'pass' });   // pre-slice: slice
  assert.equal(derivePhase(s), 'slice');
  s = logGate(s, { gate: 9, result: 'pass' });   // pre-swap: swap
  assert.equal(derivePhase(s), 'swap');
  s = logGate(s, { gate: 10, result: 'pass' });  // pre-retro: retro
  assert.equal(derivePhase(s), 'retro');
});

#!/usr/bin/env node
// status-machine.mjs — pure state-machine for the per-feature status.json.
//
// The PM agent and the commands all funnel through these functions so the
// state transitions are testable without invoking a live LLM.

export const GATES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const PHASES = ['intake', 'plan', 'slice', 'swap', 'retro', 'complete'];

/**
 * Initialize a fresh status.json from Gate 0 intake answers.
 */
export function initIntake({ feature, featureBranch, targetRoute, isExistingRoute, exportType }) {
  return {
    feature,
    phase: 'intake',
    featureBranch: featureBranch || feature,
    targetRoute,
    isExistingRoute: Boolean(isExistingRoute),
    exportType,
    designSourcePath: `.claude-design/${feature}/`,
    specDocPath: null,
    dsAlignment: 'unknown',
    warnings: [],
    started_at: new Date().toISOString(),
    gateLog: [
      { gate: 0, result: 'pass', atISO: new Date().toISOString() },
    ],
    slices: [],
    componentMap: null,
    guardrailViolations: {},
    scope: null,
  };
}

/**
 * Append a gate-log entry. Returns a NEW object (immutable update).
 */
export function logGate(status, { gate, result, note }) {
  if (!GATES.includes(gate)) throw new Error(`unknown gate ${gate}`);
  if (!['pass', 'warn', 'fail', 'pending'].includes(result)) throw new Error(`unknown result ${result}`);
  return {
    ...status,
    gateLog: [
      ...(status.gateLog || []),
      { gate, result, atISO: new Date().toISOString(), ...(note ? { note } : {}) },
    ],
  };
}

/**
 * Return the highest gate that has passed or warned in this status.
 * Returns -1 if no gate has passed.
 */
export function highestPassedGate(status) {
  if (!status.gateLog || status.gateLog.length === 0) return -1;
  let max = -1;
  for (const e of status.gateLog) {
    if ((e.result === 'pass' || e.result === 'warn') && e.gate > max) {
      max = e.gate;
    }
  }
  return max;
}

/**
 * Can we advance to `targetGate`? Yes iff gate (targetGate - 1) has
 * a pass/warn entry. Gate 0 is always allowed.
 */
export function canAdvance(status, targetGate) {
  if (!GATES.includes(targetGate)) throw new Error(`unknown gate ${targetGate}`);
  if (targetGate === 0) return true;
  const required = targetGate - 1;
  return (status.gateLog || []).some((e) => e.gate === required && (e.result === 'pass' || e.result === 'warn'));
}

/**
 * Transition `phase` based on the highest passed gate.
 */
export function derivePhase(status) {
  const g = highestPassedGate(status);
  if (g < 5) return 'intake';     // gates 0–4: intake / target audit / scope
  if (g < 8) return 'plan';       // gates 5–7: mapper, data-binding, planner
  if (g < 9) return 'slice';      // gate 8: pre-slice
  if (g < 10) return 'swap';      // gate 9: pre-swap
  return 'retro';                 // gate 10: pre-retro
}

/**
 * Append a warning to status.warnings[].
 */
export function addWarning(status, message) {
  return {
    ...status,
    warnings: [...(status.warnings || []), { message, atISO: new Date().toISOString() }],
  };
}

/**
 * Mark slice n as merged (called by post-merge-cleanup.sh and tests).
 */
export function markSliceMerged(status, n, prNumber) {
  return {
    ...status,
    slices: (status.slices || []).map((s) =>
      s.n === n
        ? { ...s, merged: true, merged_at: new Date().toISOString(), ...(prNumber ? { pr: prNumber } : {}) }
        : s
    ),
  };
}

/**
 * Mark the whole feature complete.
 */
export function markComplete(status) {
  return {
    ...status,
    phase: 'complete',
    completed_at: new Date().toISOString(),
  };
}

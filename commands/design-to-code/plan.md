---
description: "Engineer: runs Gates 3–7 end-to-end (target audit → scope → component mapping → data binding → slice plan). Writes plan doc + spike."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
argument-hint: <feature>
---

# /design-to-code:plan — Gates 3–7

Runs the five planning gates against an intake-complete feature. Spawns five subagents in sequence and stitches their output into a single plan doc + a spike entry.

## Prerequisites

- `.design-to-code/state/<feature>/status.json` exists with `phase: intake` complete (Gate 0/1/2 logged).
- `.claude-design/<feature>/review.html` + ≥1 screenshot in `screenshots/`.
- `.design-to-code/config.yaml` + `.design-to-code/token-map.yaml` present at repo root.

## What it does

The PM agent walks Gates 3–7 sequentially:

### Gate 3 — Target surface audit

Spawn `@design-to-code-auditor.md` with the target route from `status.json.targetRoute`. Auditor returns:

- Does the route exist? What does it render?
- Hooks / components / lib used.
- Sub-routes underneath.
- Behaviors to preserve (wizards, modals, redirects).

Output written to `.design-to-code/state/<feature>/audit.md`.

### Gate 4 — Scope confirmation

PM walks the engineer through: routes added/dropped, behaviors to port, chrome decisions. Logs into `status.json.scope`.

### Gate 5 — Component mapping (keystone)

Spawn `@design-to-code-extractor.md` first (HTML → JSX reference at `/tmp/<feature>-template.tsx`), then `@design-to-code-mapper.md` with the extracted JSX + screenshots + the consumer's `components/` tree + `token-map.yaml`.

Mapper produces:

- `componentMap.byTier.{base,ds,custom-shared,custom-page,net-new}.{reused,new}` counts.
- `componentMap.units[]` — every visual unit with tier, target, newOrReused, confidence, notes.
- `componentMap.iconGaps[]` — icons not available in the consumer's vendor icon set.
- A token-map delta (new hex → token entries to add to `.design-to-code/token-map.yaml`).

PM surfaces low-confidence rows + net-new units. Refuses to advance until every flagged row is acknowledged.

### Gate 6 — Data binding

Spawn `@design-to-code-data-binder.md` with the locked `componentMap` and the consumer's `lib/services/`, `hooks/`, and route tree. Data binder classifies each unit:

- **`backend`** — existing service + hook detected; the planner notes which.
- **`mock`** — no backend; the binder proposes a JSON Schema + mock JSON + TS interface triple under `data/<page>/<subpage>/`.
- **`none`** — decorative; no data needed.

Returns `dataBindings.entries[]`, a rollup, and `dataBindings.filesToWrite[]` for the planner to allocate into slices.

PM surfaces every low-confidence entry. Refuses to advance until each is acknowledged or overridden.

### Gate 7 — Slice plan

PM proposes a slice plan using the rhythm from `config.yaml.default_phase_rhythm`. Each slice: title, slug, LOC budget, files (from the mapping), dependencies, verify steps. Slices >550 LOC trigger a split proposal.

## Output

1. `docs/spikes/design-system/<YYYY-MM>/<YYYY-MM-DD>-<feature>-bridge.md` — the canonical spike (planner writes; templates/spike.md).
2. `.design-to-code/state/<feature>/plan.md` — engineer-facing plan doc (planner writes; templates/plan.md).
3. `status.json` updates: `phase: plan`, `componentMap` (including `dataBindings`), `slices[]` (titles + budgets, with mock/schema/type files allocated per slice), gateLog entries 3–7.

## Arguments

- `<feature>` (required) — the slug from intake.

## Failure modes

- Gate 0/1/2 not complete → PM redirects to `/design-to-code:start`.
- Auditor can't find the target route AND `isExistingRoute === true` → PM asks the engineer to confirm spelling or flip to greenfield.
- Mapper produces 0 units → almost certainly an extractor failure; PM surfaces the extractor output for inspection.

## Related commands

- `/design-to-code:validate <feature>` — re-run Gate 5 standalone.
- `/design-to-code:slice 1` — start executing once the plan is locked.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

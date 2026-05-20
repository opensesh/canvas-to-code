---
description: "Work timeline — what's done, what's in progress, when, with PR + doc links."
allowed-tools: Read, Bash
argument-hint: "[--feature <name>] [--json]"
---

# /canvas-to-code:dashboard — Work timeline

Single-pane view of every feature ever bridged. Reads `.design-to-code/state/*/status.json` plus `git log` and `gh pr view` for PR status. No agents — pure aggregation.

## What it shows

**Cross-feature** (no args) — every feature in `.design-to-code/state/`, one row each:

- Feature slug + phase + current gate
- Started · last touched · completed (—  if still in flight)
- Slices: merged / total, with the in-flight slice flagged
- Slice PRs (#numbers + status: open / merged / closed)
- Swap PR (if reached) + status
- Spike doc link · plan doc link
- Component reuse rollup: `+N / −M` (new introduced / reused from DS)

**Single feature** (`--feature <name>`) — adds:

- Full gateLog with ISO timestamps (every Gate 0–10 entry, pass / warn / fail)
- Source shape: `iter` (with `subpage` + iter path) or `flat`
- Per-slice detail: title, branch, files, started_at, merged_at, PR number, LOC
- Component map aggregate by tier (base / ds / custom-shared / custom-page / net-new)
- Guardrail violation totals
- Icon gaps

## Sample (cross-feature)

```
Canvas-to-Code — work timeline
==============================
Features: 3 (1 done · 2 in flight)
Last activity: 2026-05-19 17:42

| Feature          | Phase | Gate | Started    | Last       | Slices | Swap PR | New / Reused |
|------------------|-------|------|------------|------------|--------|---------|--------------|
| brand-hub-hifi   | done  | 10/10| 2026-05-12 | 2026-05-12 | 6 / 6  | #319 ✓  | +24 / −23    |
| spaces-redesign  | slice | 7/10 | 2026-06-04 | 2026-06-12 | 3 / 6  | —       |  +9 / −18    |
| account-shell    | plan  | 7/10 | 2026-06-10 | 2026-06-15 | 0 / 4  | —       |  +5 / −10    |
```

## Sample (--feature spaces-redesign)

```
spaces-redesign — Phase: slice (3 / 6)
======================================
Target: /spaces  (existing)
Source: claude-design  (shape: flat)
Started: 2026-06-04T09:14:08Z
Last touched: 2026-06-12T16:30:51Z
Spike: docs/spikes/design-system/2026-06/2026-06-04-spaces-redesign-bridge.md
Plan:  .design-to-code/state/spaces-redesign/plan.md

Gates:
  ✓ 0  Intake                  2026-06-04T09:14:08Z
  ✓ 1  Materials               2026-06-04T09:17:22Z
  ⚠ 2  DS alignment            2026-06-04T09:19:30Z  (warn: synthetic source)
  ✓ 3  Target audit            2026-06-04T09:42:11Z
  ✓ 4  Scope                   2026-06-04T10:05:44Z
  ✓ 5  Component mapping       2026-06-04T11:18:02Z  (47 units)
  ✓ 6  Data binding            2026-06-04T11:51:09Z
  ✓ 7  Slice plan              2026-06-04T12:14:33Z
  ⏳ 8  Pre-slice (slice 3)     in progress
  ◌ 9  Pre-swap                pending
  ◌ 10 Pre-retro               pending

Slices:
  1 ✓ scaffold + .claude-design convention      #341  150 LOC  merged 2026-06-05
  2 ✓ 3-tab nav + collapsible overview          #342  250 LOC  merged 2026-06-08
  3 ⏳ PillarCard + 8-card grid (mock)           #343  draft    started 2026-06-12
  4 ◌ wire Logo / Colors / Typography
  5 ◌ visual Version History page
  6 ◌ swap to /spaces, delete dropped routes

Component map: 47 units
  base:          19 reused /  0 new
  ds:             4 reused /  1 new
  custom-shared:  0 reused /  8 new
  custom-page:                12 new
  net-new:                     3 new

Guardrails: devProps 4 · border-2 1 · ring-2 2 · raw-hex 0 · array-index-keys 8
Icon gaps: slack, asterisk-4-point
```

## Arguments

- `--feature <name>` — Single-feature view (the detailed form above).
- `--json` — Machine-readable output (the script `scripts/render-dashboard.mjs` consumes this shape).

## Failure modes

- No `.design-to-code/state/` directory → prints the empty-state hint pointing at `/canvas-to-code:start`.
- A `status.json` is malformed → that feature row marked `ERROR`; render continues for the rest.
- `--feature <name>` not found → lists features that do exist.

## Related

- `/canvas-to-code:assets [--feature <name>]` — file inventory (counts by type, paths).
- `/canvas-to-code:start --feature <name>` — resume work on a feature.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

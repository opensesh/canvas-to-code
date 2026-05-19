---
description: "Run Gate 8 preflight + generate slice PR body. Updates status.json.slices[]."
allowed-tools: Read, Write, Edit, Bash, Task
argument-hint: <n>
---

# /design-to-code:slice — Execute one slice

Runs the per-slice preflight (Gate 8) and drafts the PR body for slice `<n>`. Does not write feature code — that's still the engineer.

## Prerequisites

- Plan locked (Gate 7 complete).
- Slice `<n>` declared in `status.json.slices[]`.
- Current branch matches `<feature>-pr-<n>-<slug>` (configurable via `slice_branch_pattern`).

## What it does

### Gate 8 — Pre-slice

PM verifies:

- Prior slice merged into feature branch (or `n === 1` and branch is fresh).
- Working tree clean (or only contains files declared in this slice).
- Current branch name matches the slice's `<feature>-pr-<n>-<slug>` pattern.
- The slice's spec in the plan doc still matches `status.json.slices[n]` (no hand-edit drift).

If any check fails, PM prints what's blocking + remediation steps. Never auto-fixes.

### After Gate 8 passes

1. Pull the slice's declared files from `status.json.slices[n].files` and the plan's component-mapping table.
2. Run `scripts/check-guardrails.mjs` on the working-tree diff. Counts violations into `status.json.guardrailViolations`.
3. Draft the PR body from `templates/slice-pr-body.md`:
   - Summary
   - New files
   - Modified files
   - Test plan (verify steps from the plan)
   - Out of scope
4. Print the PR body for the engineer to paste into `gh pr create` (or persist to a temp file and offer to open the PR directly).
5. Update `status.json.slices[n]` with `started_at`, `branch`, draft PR body path.

## Arguments

- `<n>` (required) — slice number (1-indexed; e.g. `/design-to-code:slice 3`).

## Failure modes

- `<n>` doesn't exist in `slices[]` → PM lists what does exist.
- Working tree dirty with files NOT in the slice spec → PM surfaces them and refuses to advance.
- Branch mismatch → PM tells the engineer the expected name and stops.

## Related

- `/design-to-code:review <pr>` — once the PR is open, validate it against the plan.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

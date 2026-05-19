---
description: "Run Gate 9 preflight + generate the final swap PR body."
allowed-tools: Read, Write, Edit, Bash, Task
---

# /design-to-code:swap — Final swap

The cheap-to-revert PR that moves the parallel route's content into the production route and deletes dropped routes. Runs Gate 9 preflight.

## Prerequisites

- All content slices merged into the feature branch.
- Working tree clean.
- Currently on the feature branch (e.g. `brand-hub-hifi`).

## What it does

### Gate 9 — Pre-swap

PM verifies:

- Every slice declared in `status.json.slices[]` has `merged: true`.
- The behaviour-port checklist from Gate 4 is fully ticked.
- The parallel route still 200s (configurable smoke test).
- Dropped routes are identified and deletion-ready.
- Sub-routes still 200 (regression check).

Each unticked item is surfaced explicitly. PM refuses to advance until they're resolved or explicitly waived.

### After Gate 9 passes

1. Draft the swap PR body from `templates/swap-pr-body.md`:
   - Summary
   - Swap files (parallel → production route)
   - Removed routes
   - Behaviour ports verified
   - Retro highlights (incomplete — fills in `/design-to-code:retro`)
   - Test plan
2. Update `status.json` with `phase: swap`, gateLog entry, swap PR draft path.
3. Print the PR body for the engineer.

## Failure modes

- Any slice not merged → PM lists them.
- Behaviour-port item unchecked → PM asks for confirmation that the behaviour is intentionally being dropped, or for the file:line that ports it.

## Related

- `/design-to-code:retro` — once the swap PR merges, run retro.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

---
description: "Canonical entry — PM agent runs Gate 0 intake (what are you building, materials, source tool). Resumable."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /design-to-code:start — Canonical entry

Walks you through a Design-to-Code Bridge handoff from the very first step. Conversational. Idempotent.

## What it does

1. **Resume check.** If `.design-to-code/state/` contains any feature in flight, ask whether to resume one or start a new feature.
2. **Spawn the PM agent.** `@design-to-code-pm.md` takes the conversation from here, running Gate 0 (Intake):
   - "What are you building?" → feature name + slug.
   - "Is this a new page or an existing one?" → greenfield vs replacement.
   - "What route is it?" → e.g. `/brand-hub`.
   - "Do you have an HTML export + at least one screenshot? Paths?" → materials check.
   - "What design tool — Claude Design, Figma, V0, Lovable, Webflow, screenshot-only, generic-HTML?"
3. **Write state.** PM writes (or updates) `.design-to-code/state/<feature>/status.json` with `phase: intake`, `feature`, `featureBranch`, `targetRoute`, `isExistingRoute`, `exportType`. Adds a Gate 0 entry to `gateLog`.
4. **Move materials.** If the user provided file paths outside `.claude-design/<feature>/`, PM copies them in and writes `source-meta.yaml`.
5. **Auto-route forward.** If Gate 0 passes, PM proceeds to Gate 1 (materials check) automatically. If anything is `later`, PM saves progress and prints a resume hint.

## Failure modes

- **Materials missing** → Gate 1 fails. PM walks the user through capture (`Cmd-Shift-4` for a screenshot, `File → Export → HTML` for the design tool of choice). See `templates/gate-failures/1-materials.md`.
- **Config missing** → PM emits a friendly error pointing at `templates/config.example.yaml` and exits. Re-run after copying the example into `.design-to-code/config.yaml`.

## Re-running

Re-running `/design-to-code:start` mid-flow:

- Reads the most-recently-touched `status.json`.
- Summarises progress ("brand-hub-hifi · intake complete, awaiting materials").
- Asks whether to continue, switch features, or start fresh.

## Related commands

- `/design-to-code:status` — print state for one or all features.
- `/design-to-code:plan <feature>` — once intake is done, go to Gates 3–7.
- `/design-to-code:dashboard` — see every feature ever bridged.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

---
description: "Run the canvas-to-code workflow — guided discovery, auto-resume, or jump to a specific gate."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
argument-hint: "[--feature <name>] [--gate <n>] [--prep] [--pr <num>]"
---

# /canvas-to-code:start — Universal workflow entry

One command, all eleven gates. Spawns `@canvas-to-code-pm.md`, which inspects `.claude-design/` and `.design-to-code/state/`, then routes by flag or by current phase.

## How it dispatches

| Flags | Behavior |
|---|---|
| `--prep <feature>` (or `--feature <name> --prep`) | **Scaffold only.** Creates `.claude-design/<feature>/` + `screenshots/`, `source-meta.yaml` stub, `notes.md` stub. No conversation. Refuses if the folder already exists. |
| `--pr <num>` | **Review a slice PR.** Spawns `@canvas-to-code-reviewer.md` with the PR diff + the slice spec from `status.json.slices[]`. Returns PASS/REVISE with file:line citations. |
| `--gate <n>` | **Jump to gate `n`** (0–10). Re-runs that gate fresh, or for the first time if not yet reached. `--gate 5` is the canonical "re-validate the component mapping" shortcut. |
| `--feature <name>` (alone) | Resolve to that feature and auto-advance from its next pending gate. |
| _(no flags)_ | **Guided discovery.** PM scans `.claude-design/` and presents a menu of what's there (see below). |

## Guided discovery (default path)

When called with no flags, the PM agent presents one unified menu so the user picks where the source comes from. PM never silently advances past Gate 0.

1. **Scan `.claude-design/`** (depth ≤ 5). Categorize:
   - **Active features** — subfolder has `status.json` with `phase ≠ "done"`.
   - **Iter folders (v2)** — `iter-*` directories with `source-meta.yaml` containing `metaVersion: 2`. The producer (e.g. the `paper-design` skill) emits these; the bridge auto-fills feature, subpage, route, and source from the iter's `source-meta.yaml`.
   - **Loose materials** — subfolder with `review.html`, `screenshots/`, or `source-meta.yaml` but no `status.json` and not an iter folder.
   - **Completed features** — `status.json` with `phase = "done"`.

2. **Print one menu**:

   ```
   Welcome to canvas-to-code. Scanning .claude-design/…

   Found:
     Active features
       1. <feature>  (Gate N in progress, last touched <when>)
     Iter folders (v2)
       2. <feature>/<subpage>  <iter-name>  (<source>, <when>)
     Loose materials
       3. <subfolder>/  (review.html, no status.json)
     Completed
       4. <feature>  (done, <date>)

     5. Import from external source (Claude Design, Figma, V0, Lovable, Webflow)
     6. Start blank — I'll walk you through capturing materials

   Reply with a number, or paste a path to an iter folder.
   ```

3. **Route**:
   - **Active feature** → resume at the next pending gate.
   - **Iter folder** (selected by number or pasted as a path) → Gate 0 with `source-meta` auto-fill; `status.json` gets `sourceShape: "iter"` + `sourceIterPath` + `subpage`. Gate 5a will short-circuit the HTML extractor and use the iter's pre-extracted JSX.
   - **Loose materials** → Gate 0 intake using the subfolder name as default slug; `sourceShape: "flat"`.
   - **Import from external** → today's conversational Gate 0 (HTML + screenshot paths, then pick the source tool).
   - **Start blank** → Gate 0 from scratch.

If `.claude-design/` is empty or absent, the menu collapses to options 5 + 6 only.

## What the gates do

| Gate | Name | Driver |
|---|---|---|
| 0 | Intake | PM conversation (feature, route, materials, source tool) |
| 1 | Materials check | PM (verifies `review.html` + ≥1 screenshot for flat shape; snapshots `source-meta.yaml` + JSX + screenshots into `.design-to-code/state/<feature>/source-snapshot/` for iter shape) |
| 2 | DS alignment | PM (verifies `source-meta.yaml`, tokens, lint heuristics) |
| 3 | Target surface audit | `@canvas-to-code-auditor.md` |
| 4 | Scope confirmation | PM conversation |
| 5 | Component mapping **(keystone)** | `@canvas-to-code-extractor.md` → `@canvas-to-code-mapper.md` |
| 6 | Data binding | `@canvas-to-code-data-binder.md` |
| 7 | Slice plan | `@canvas-to-code-planner.md` (writes spike + plan doc) |
| 8 | Pre-slice | PM (per-slice preflight + slice PR body) |
| 9 | Pre-swap | PM (final swap PR body) |
| 10 | Pre-retro | PM (conversational retro, flips spike to `closed`) |

PM auto-advances slice → slice → swap → retro when all prerequisites are met, pausing at any gate that fails or warns-but-blocks.

## State

PM reads and writes `.design-to-code/state/<feature>/status.json`. Every gate transition appends to `gateLog[]` with an ISO timestamp. The dashboard reads from this file.

## Re-running

Re-running `/canvas-to-code:start` mid-flow is always safe. With no flags it shows the discovery summary; with `--feature <name>` it resumes that feature from its next pending gate.

## Failure modes

- **Config missing** — PM emits a friendly error pointing at `templates/config.example.yaml` and exits.
- **`<feature>` doesn't exist** in `.design-to-code/state/` → PM lists what does, then offers to start a new one with that slug.
- **`--gate 5` on a feature with no prior `componentMap`** → PM suggests dropping the flag (run the workflow normally to reach Gate 5 the first time).
- **`--pr <n>` head branch doesn't match `<feature>-pr-<n>-<slug>`** → reviewer warns "running guardrails-only" and continues.
- **`gh` not authenticated** (for `--pr`) → command prints `gh auth status` and exits.

## Related

- `/canvas-to-code:dashboard` — what's been done, what's in progress, when.
- `/canvas-to-code:assets` — file inventory under `.claude-design/<feature>/`.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

# Canvas-to-Code

> Open Session's internal bridge from a design export to BOS-aligned production code. Eleven gates catch off-brand drift before it ships and turn every handoff into a tracked dashboard entry.

[![tests](https://github.com/opensesh/canvas-to-code/actions/workflows/test.yml/badge.svg)](https://github.com/opensesh/canvas-to-code/actions/workflows/test.yml)
[![version](https://img.shields.io/badge/version-0.4.0-blue.svg)](./CHANGELOG.md)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://docs.claude.com/claude-code)

```
┌──────────────────────┐     ┌──────────────────────────────┐     ┌─────────────────────────┐
│   Design             │     │   Conversion                 │     │   Codebase              │
│   ─────────────      │     │   ───────────────            │     │   ─────────────         │
│   Paper (preferred)  │     │   0. Intake                  │     │   app/<route>/          │
│   Claude Design      │     │   1. Materials               │     │   ├─ DS-aligned JSX     │
│   Figma + UUI    ────┼────▶│   2. DS alignment            │────▶│   └─ token-mapped CSS   │
│   V0 / Lovable       │     │   3. Target audit            │     │                         │
│   Webflow            │     │   4. Scope                   │     │   components/           │
│   Screenshot-only    │     │ ◆ 5. Component mapping       │     │   ├─ base/  (UUI reuse) │
│                      │     │ ◇ 6. Data binding + schema   │     │   ├─ ds/    (wrappers)  │
│   review.html        │     │   7. Slice plan              │     │   └─ custom/ (new)      │
│   + screenshot(s)    │     │   8. Pre-slice               │     │                         │
│   or an iter folder  │     │   9. Pre-swap                │     │   data/<page>/<sub>/    │
│   from /paper-design │     │  10. Pre-retro               │     │   ├─ *.schema.json      │
│                      │     │                              │     │   ├─ *.mock.json        │
│                      │     │                              │     │   └─ types/             │
└──────────────────────┘     └──────────────────────────────┘     └─────────────────────────┘
                                ◆ keystone   ◇ contract for the production DB

                                Every run logged in /canvas-to-code:dashboard
                                with PR links and a reuse-vs-net-new diff.
```

---

## What it does

Every design export from every tool is **off-brand in the same ways** — raw hex colors, off-brand fonts, pixel-literal spacing, `ring-2` instead of `shadow-focus-ring`, no token mapping. Manually fixing the same things on every handoff is slow and lossy.

Canvas-to-Code makes the translation deterministic. The PM agent walks each handoff through eleven gates, refuses to advance when one fails, and writes everything back to `.canvas-to-code/state/<feature>/status.json` so you can resume any time.

Two gates do the heavy lifting:

- **Gate 5 — Component mapping (keystone).** Every visual unit in the design gets a tier (`base` / `ds` / `custom-shared` / `custom-page` / `net-new`), a target file path, a reused-or-new flag, and a confidence score. Low-confidence rows block until you acknowledge them. The mapper pushes every unit as high up the reuse stack as it can — reusing a UUI primitive is always cheaper than building a new custom component.
- **Gate 6 — Data binding + schema.** Each unit gets a data source: `backend` (wire to an existing service in `lib/services/`), `mock` (emit a JSON Schema + mock JSON + TypeScript interface under `data/<page>/<subpage>/`), or `none` (decorative). The schemas emitted here are the **durable contract** between design and engineering — they become the basis for the production database schema. Designers iterate against the mock; engineers wire the real hook later without touching layout.

The slice plan that comes out the other side ships in 4–6 small PRs (scaffold → header & nav → cards → wire data → secondary → swap), and `/canvas-to-code:dashboard` aggregates every feature you've ever bridged into one view, with a component +/− diff showing whether reuse is trending up over time.

---

## Who uses it inside BOS

- **Designers** kicking off a handoff. Drop a Paper iter (or an HTML export + screenshot) under `.claude-design/<feature>/`, run `/canvas-to-code:start`, and the PM agent walks you through Gate 0 in plain English. No engineering knowledge required to begin.
- **Engineers** implementing the handoff. `/canvas-to-code:start --feature <name>` auto-advances through Gates 3–7 to produce the component-mapping table, the data-binding plan, and the slice plan. `/canvas-to-code:start --gate 8` runs slice preflight + drafts the PR body.
- **Reviewers.** `/canvas-to-code:start --pr <num>` validates a slice PR against the plan and returns PASS/REVISE with `file:line` citations.
- **Anyone curious about the system's health.** `/canvas-to-code:dashboard` shows every bridged feature, its PRs, its LOC, and the reuse vs. net-new component diff.

---

## The eleven gates

| Gate | Name | Failure mode |
|---|---|---|
| 0 | **Intake** | Five-question conversation with the PM. Saves and exits cleanly if materials aren't ready. |
| 1 | **Materials present** | HTML export + ≥1 screenshot required (or a v2-compliant iter folder). PM walks you through capture if missing. |
| 2 | **DS-alignment of source** | Records translation-cost warning for non-canonical sources (Paper passes; generic HTML doesn't). Warn-only. |
| 3 | **Target surface audit** | Auditor agent reports current route status, behaviors to port, sub-routes. |
| 4 | **Scope confirmation** | Routes added/dropped, behaviors to port, header & nav decisions — all explicit. |
| 5 | **Component mapping** ◆ | The keystone. Every visual unit categorized base/ds/custom-shared/custom-page/net-new with a target path and confidence. Low-confidence rows must be acknowledged. |
| 6 | **Data binding** ◇ | `backend` / `mock` / `none` for every unit. Emits JSON Schema + mock JSON + TS interface under `data/<page>/<subpage>/`. This is the spec the production DB schema is built from. |
| 7 | **Slice plan** | Default rhythm: scaffold → header & nav → cards → wire data → secondary → swap. 150–550 LOC per slice. Mock/schema/type files allocated to the slice that consumes them. |
| 8 | **Pre-slice** | Branch identity, working-tree cleanliness, prior-slice-merged checks before each slice PR. |
| 9 | **Pre-swap** | Behaviour-port checklist verified, parallel route returns 200s, dropped routes deletion-ready. |
| 10 | **Pre-retro** | Swap merged, typecheck + build green on main. |

---

## Quick start

Already installed in BOS. To bring it into another Open Session repo:

```
/plugin marketplace add opensesh/canvas-to-code
/plugin install canvas-to-code@canvas-to-code-marketplace
/canvas-to-code:start
```

The PM agent takes you through Gate 0 and writes everything else.

### Updating

Run the bundled command from any consumer repo — it updates by git SHA, so it works even when a release didn't bump the version field:

```
/canvas-to-code:update          # check + update to latest main
/canvas-to-code:update --check  # dry run: report version/SHA + commits behind
```

Restart the Claude Code session afterward so the refreshed agents/skills load.

The built-in path still works, but `/plugin update` keys off the `version` field and **silently no-ops** when a release ships without a bump (tracked in [#2](https://github.com/opensesh/canvas-to-code/issues/2)):

```
/plugin marketplace update canvas-to-code-marketplace
/plugin update canvas-to-code
```

Every release bumps `.claude-plugin/plugin.json`'s `version` field, enforced by [`version-check.yml`](./.github/workflows/version-check.yml). `/canvas-to-code:update` doesn't depend on that discipline — it's the reliable path.

---

## What lives in the repo

Canvas-to-Code reads and writes a few well-defined paths inside BOS. None of these need manual editing day-to-day — the PM agent fills them in.

### Design sources — `.claude-design/<feature>/`

One folder per feature, committed. Either:

- **Iter shape** (preferred — emitted by `/paper-design`): `<subpage>/paper/iter-NN-<slug>/` with `source-meta.yaml`, `jsx/<page>.tsx`, and `screenshots/`. The iter IS the handoff; no manual promotion step.
- **Flat shape** (any other tool): `review.html` + `screenshots/` + an optional `source-meta.yaml` declaring `source:`.

### Per-feature state — `.canvas-to-code/state/<feature>/status.json`

Gitignored. Holds `phase`, `gateLog[]`, `componentMap`, `dataBindings`, `slices[]`, and lifecycle timestamps. Single source of truth for the dashboard. Forward-compatible — older files backfill silently on first read.

### Emitted code — three places in BOS

- `app/<route>/` — DS-aligned JSX + Tailwind classes (token-mapped, focus-ring fixed, no raw hex).
- `components/base/` · `components/ds/` · `components/custom/` — slotted by the mapper based on tier.
- `data/<page>/<subpage>/` — the Gate 6 triple per mocked unit: `<unit>.schema.json` (the contract), `<unit>.mock.json` (designer-iterable data), `types/<unit>.ts` (typed interface). When the real backend lands, the schema migrates to the production DB layer and the mock is deleted.

### Project config — `.canvas-to-code/`

The BOS instance is already configured. `config.yaml` holds gate severities, slice LOC budget, branch patterns, dashboard output path. `token-map.yaml` holds the hex → semantic-token mappings, font substitutions, and focus-ring pattern that make BOS-aligned output BOS-aligned. Both files are seeded from the templates in this repo and live in the BOS repo, not here.

---

## Command reference

Three commands. Five flags. The PM agent does everything else.

| Command | What it does | Flags |
|---|---|---|
| `/canvas-to-code:start` | Universal workflow. With no flags, scans `.claude-design/` and presents a guided menu (resume an active feature, ingest an iter, or start fresh). With flags, dispatches to a specific mode. | `--feature <name>` · `--gate <0-10>` · `--prep` · `--pr <num>` |
| `/canvas-to-code:dashboard` | Work timeline: what's done, what's in progress, when it happened, PR + doc links, reuse vs. net-new component diff. Cross-feature by default. | `--feature <name>` · `--json` |
| `/canvas-to-code:assets` | File inventory under `.claude-design/<feature>/`: counts by type, paths, presence of standard artifacts. | `--feature <name>` · `--json` |

### Flag cheat sheet

| Flag | Lives on | Purpose |
|---|---|---|
| `--feature <name>` | `start`, `dashboard`, `assets` | Scope to one feature. On `start`, resumes from the next pending gate. |
| `--gate <0-10>` | `start` | Jump to or re-run a specific gate. `--gate 5` re-validates the component mapping; `--gate 6` re-runs data binding; `--gate 8/9/10` runs slice / swap / retro preflight. |
| `--prep` | `start` | Scaffold `.claude-design/<feature>/` only — no conversational intake. |
| `--pr <num>` | `start` | Validate a slice PR against the plan; spawns the reviewer agent. |
| `--json` | `dashboard`, `assets` | Emit machine-readable output. |

---

## Architecture

| Surface | Count | Notes |
|---|---|---|
| **Commands** | 3 | `commands/`: `start`, `dashboard`, `assets`. |
| **Subagents** | 7 | `canvas-to-code-pm` (Opus, the orchestrator) · `-extractor` (Opus) · `-auditor` (Sonnet) · `-mapper` (Opus, keystone) · `-data-binder` (Opus) · `-planner` (Opus) · `-reviewer` (Sonnet). |
| **Skills** | 2 | `canvas-to-code-guardrails` (auto-activates in `.claude-design/` projects) · `canvas-to-code-vocabulary` (tier model + slice rhythm). |
| **Hooks** | 2 | `pre-commit-guardrails.sh` (opt-in hard gate) · `post-merge-cleanup.sh` (opt-in slice-branch + worktree cleanup). |
| **Templates** | 7 + 10 | Plan, slice/swap/retro PR bodies, designer handoff, spike, dashboard; plus 10 per-gate failure messages. |

The PM agent **never writes feature code**. It owns the conversation and the gates; engineers own the production code.

---

## Source shapes

The bridge accepts two source shapes. The Gate 0 picker treats them as peers.

### Iter shape (preferred, emitted by `/paper-design`)

A subfolder ending in `iter-NN-<slug>` with a v2-compliant `source-meta.yaml`. The producer skill emits this shape directly — the iter IS the handoff.

```
.claude-design/<feature>/<subpage>/<tool>/iter-NN-<slug>/
  source-meta.yaml         ← metaVersion: 2 + the seven required fields
  notes.md
  jsx/<page>.tsx           ← pre-extracted JSX
  screenshots/01-*.png
```

When you pick an iter at Gate 0, the bridge snapshots `source-meta.yaml`, the JSX, and the screenshots into `.canvas-to-code/state/<feature>/source-snapshot/` (Gate 1). Gate 5a then short-circuits the HTML extractor and copies the snapshot JSX straight to `/tmp/<feature>-template.tsx` — the lossiest gate in the pipeline becomes a no-op.

#### source-meta v2 schema

The canonical spec lives at [`.claude/skills/paper-design/SKILL.md`](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/SKILL.md) in the BOS repo. Seven required fields:

```yaml
metaVersion: 2
source: paper          # paper | claude-design | figma | v0 | lovable | webflow | screenshot-only | generic-html
feature: brand-hub     # URL path segment 1
subpage: colors        # URL path segment 2, or 'home' if URL is the feature index
targetRoute: /brand-hub/colors
jsxPath: jsx/brand-hub-colors.tsx       # relative to the iter folder
primaryScreenshot: screenshots/01-baseline.png
```

Iters missing `metaVersion: 2` fail Gate 1 loudly and point at the producer skill for backfill.

### Flat shape (any other tool)

A feature subfolder with:

```
.claude-design/<feature>/
  review.html              ← design export (Claude Design, Figma, V0, Lovable, Webflow, generic HTML)
  screenshots/             ← one or more PNGs
  source-meta.yaml         ← declares `source:` when auto-detect is ambiguous
```

The discriminator reads the first 2 KB of `review.html`, returns `{ type, shape: "flat" }`, and the extractor parses HTML → JSX.

### Per-source signatures (flat shape only)

| Source | Discriminator signature | Decoder | Day-1 |
|---|---|---|---|
| Paper | (iter-only — no flat signature) | Iter short-circuit at Gate 5a | ✅ |
| Claude Design | `__bundler/template` script tag with embedded char-dictionary | Bundle decode → flat JSX | ✅ |
| Figma Export-to-Code | `data-figma-*` attrs OR `figma.com` in `<meta>` | Flatten inline styles → JSX, strip Figma class names | ⏳ |
| V0 / Lovable | `.tsx`/`.jsx` extension OR `v0.dev`/`lovable.dev` comment | Pass-through, sanitize imports | ⏳ |
| Webflow | `<link href=".webflow.css">` or `data-wf-*` | Convert HTML+CSS → JSX+Tailwind | ⏳ |
| Screenshot-only | No `review.html`, PNGs in `screenshots/` | No decode — extractor returns "visual-reference only" | ✅ |
| Generic HTML | Default fallback | Treat as V0 case | ✅ |

---

## Status

**v0.4.0 — Iter folders as first-class sources.** The Gate 0 picker scans `.claude-design/` for v2-compliant `iter-*` folders alongside active features and loose materials, then presents one unified menu. Selecting an iter auto-fills Gate 0 from `source-meta.yaml`. Gate 1 snapshots the iter; Gate 5a short-circuits the HTML extractor. `status.json` gains `subpage`, `sourceShape`, and `sourceIterPath` — additive only. Adds `paper` to the source enum (DS-aligned pass at Gate 2). Consumer-repo state directory renamed to `.canvas-to-code/`; PM auto-migrates on first spawn. Flat shape still works unchanged.

**v0.3.0 — Three commands, five flags.** Surface collapsed from 10 commands to 3 (`start`, `dashboard`, `assets`), with five flags (`--feature`, `--gate`, `--prep`, `--pr`, `--json`). `start` opens with a guided discovery scan so the first thing you see is what already exists. `status.json` gains lifecycle timestamps; the PM backfills silently on older files.

Canonical spec: [BOS-3.0 code-bridge spike](https://github.com/opensesh/BOS-3.0/blob/main/docs/spikes/design-system/2026-05/2026-05-12-code-bridge-standardization.md).

---

## Contributing

This plugin is maintained inside Open Session for the BOS codebase. Issues and PRs welcome from the team. The test suite (`node --test tests/*.test.mjs`) must stay green.

---

## Acknowledgements

- [KARIMO](https://github.com/opensesh/KARIMO) — PRD-driven autonomous development; this plugin lifts its PM-agent + status.json + worktree-cleanup patterns.
- [Untitled UI](https://www.untitledui.com/), [React Aria](https://react-spectrum.adobe.com/react-aria/) — the primitive layer that makes BOS's `components/base/` viable.
- [Claude Design](https://www.claude.com/product/claude-design), [Anthropic](https://www.anthropic.com).

---

## License

MIT. See [LICENSE](./LICENSE).

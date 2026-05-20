# Canvas-to-Code

> Translate any design export — HTML + screenshot — into design-system-aligned production code, with eleven explicit gates that catch drift before it ships.

[![tests](https://github.com/opensesh/canvas-to-code/actions/workflows/test.yml/badge.svg)](https://github.com/opensesh/canvas-to-code/actions/workflows/test.yml)
[![version](https://img.shields.io/badge/version-0.3.0-blue.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://docs.claude.com/claude-code)

```
┌──────────────────────┐       ┌──────────────────────────┐       ┌─────────────────────────┐
│   Design tool        │       │   Canvas-to-Code         │       │   Your codebase         │
│   ───────────        │       │   ──────────────         │       │   ──────────────        │
│   Claude Design      │       │                          │       │                         │
│   Figma + UUI    ────┼──────▶│   1. Intake              │──────▶│   DS-aligned code       │
│   V0 / Lovable       │       │   2. Materials           │       │   Token-mapped JSX      │
│   Webflow            │       │   3. DS alignment        │       │   Reusable components   │
│   Screenshot-only    │       │   4. Target audit        │       │                         │
│                      │       │   5. Scope               │       │                         │
│   review.html        │       │   6. Component mapping ◆ │       │   Plus a dashboard      │
│   + screenshot(s)    │       │   7. Slice plan          │       │   tracking reuse vs.    │
│                      │       │   8. Pre-slice           │       │   net-new components    │
│                      │       │   9. Pre-swap            │       │   across every feature  │
│                      │       │  10. Pre-retro           │       │   you ever bridge.      │
└──────────────────────┘       └──────────────────────────┘       └─────────────────────────┘
                                  ◆ = the keystone gate
```

---

## Why it exists

HTML + screenshot from any design tool is **always off-brand in the same ways** — raw hex colors, off-brand fonts, pixel-literal spacing, `ring-2` instead of `shadow-focus-ring`, no design-token mapping. The closer the tool is to your design system (Figma + your component library > Claude Design > V0/Lovable > Webflow > generic HTML), the cheaper the translation. None of them get it free.

Manual translation is lossy and slow. Every engineer reinvents the same hex-to-token mappings, the same focus-ring fixes, the same primitive substitutions. This plugin makes the translation **deterministic, gated, and dashboard-tracked** — so the design system gets stronger every time you ship a feature.

It started inside [Open Session](https://opensession.co)'s Brand OS (BOS) codebase for a redesign of the Brand Hub. Six PRs from `feat: scaffold` to merged-to-main in roughly one working session. The patterns generalized; this plugin is the extraction.

---

## Who it's for

- **Designers initiating a handoff** — drop an HTML export + a screenshot, run `/canvas-to-code:start`, the PM agent walks the intake conversation. No engineering knowledge required to begin.
- **Engineers implementing the handoff** — `/canvas-to-code:start --feature <name>` auto-advances through Gates 3–7 to produce a component-mapping table (every visual unit categorized base/ds/custom/net-new) and a slice plan. `/canvas-to-code:start --gate 8` runs the slice preflight + drafts the PR body for the current slice.
- **Reviewers** — `/canvas-to-code:start --pr <num>` validates a slice PR against the plan's slice spec. Returns PASS/REVISE with file:line citations.
- **Design-system leads** — `/canvas-to-code:dashboard` aggregates every bridged feature into one view: PRs, LOC, timestamps, and a **component +/− diff** showing reuse vs. net-new. Successful runs trend toward higher reuse and fewer net-new components over time.

---

## What it does — the eleven gates

The PM agent walks every handoff through eleven gates and refuses to advance when a gate fails. Resumable any time.

| Gate | Name | Failure mode |
|---|---|---|
| 0 | **Intake** | Conversational five-question intake. Saves and exits cleanly if materials aren't ready. |
| 1 | **Materials present** | HTML export + ≥1 screenshot required. PM walks you through capture if missing. |
| 2 | **DS-alignment of source** | Records translation-cost warning for non-canonical sources. Never blocks. |
| 3 | **Target surface audit** | Auditor agent reports route status, behaviors to port, sub-routes. |
| 4 | **Scope confirmation** | Routes added/dropped, behaviors to port, chrome decisions — all explicit. |
| 5 | **Component mapping** ◆ | The keystone. Every visual unit gets tier + target + new-or-reused + confidence. Low-confidence rows must be acknowledged. |
| 6 | **Data binding** | Classifies each unit as `backend` (wire to existing service), `mock` (emit JSON Schema + mock JSON + TS interface under `data/<page>/<subpage>/`), or `none`. The schema is the durable contract that informs the production DB. |
| 7 | **Slice plan** | Default rhythm: scaffold → chrome → cards → wire data → secondary → swap. 150–550 LOC per slice. Mock/schema/type files allocated to the slice that consumes them. |
| 8 | **Pre-slice** | Branch identity, working-tree cleanliness, prior-slice-merged checks before every `/canvas-to-code:start --gate 8`. |
| 9 | **Pre-swap** | Behaviour-port checklist verified, parallel route 200s, dropped routes deletion-ready. |
| 10 | **Pre-retro** | Swap merged, typecheck + build green on main. |

Gate 5 (component mapping) is what makes everything downstream cheap. Gate 6 (data binding) extends that: every unit also gets a clear answer to "where does this data come from?", and any mocks emitted there become the source of truth for the eventual production DB schema.

---

## Quick start

Inside any Claude Code project:

```
/plugin marketplace add opensesh/canvas-to-code
/plugin install canvas-to-code@canvas-to-code-marketplace
/canvas-to-code:start
```

That's it — the PM agent takes you through Gate 0 and writes everything else.

## Updating

To pull the latest version after a release:

```
/plugin marketplace update canvas-to-code-marketplace
/plugin update canvas-to-code
```

If your Claude Code build doesn't ship `/plugin update`, fall back to:

```
/plugin uninstall canvas-to-code
/plugin install canvas-to-code@canvas-to-code-marketplace
```

Both paths reliably pick up new versions because every release bumps `.claude-plugin/plugin.json`'s `version` field (enforced by [`version-check.yml`](./.github/workflows/version-check.yml) on every PR).

---

## Consumer setup — the two files you own

Project-specific config lives in your repo at `.design-to-code/`. Two files make the bridge yours.

### `.design-to-code/config.yaml`

Gate severities, slice LOC budget, branch patterns, dashboard output path. Copy from [`templates/config.example.yaml`](./templates/config.example.yaml) and adjust.

### `.design-to-code/token-map.yaml`

Your design system's hex → semantic-token mappings, plus font substitutions, focus-ring pattern, disabled-state pattern. **This is the file that makes the bridge yours.** Copy from [`templates/token-map.example.yaml`](./templates/token-map.example.yaml) and seed from your own `brand.css` / design-tokens CSS.

A minimal seed for a Tailwind + CSS-variables stack looks like:

```yaml
version: 1
colors:
  "#0B0B0B": { token: "bg-primary-solid", class: "bg-bg-primary-solid" }
  "#FE5102": { token: "bg-brand-solid",   class: "bg-bg-brand-solid" }
typography:
  display: { class: "font-display" }
  text:    { class: "font-text" }
font_substitutions:
  "Inter":     "font-text"
  "system-ui": "font-text"
focus_ring:  "ring-1 shadow-focus-ring ring-ring-brand"
disabled_bg: "disabled:bg-bg-disabled_subtle"
```

### `.claude-design/<feature>/`

Committed design sources, one folder per feature. Always: `review.html`, a `screenshots/` folder with ≥1 PNG, and `source-meta.yaml` declaring the design tool. Iterating later? Re-run `/canvas-to-code:start` and the PM picks up from `status.json` — the discovery scan offers to resume.

### `.design-to-code/state/<feature>/status.json`

Per-feature state. Gitignored by default. Holds `phase`, `gateLog[]`, `componentMap`, `slices[]`. The single source of truth for the dashboard.

---

## Command reference

Three commands. Five flags. The PM agent does everything else.

| Command | What it does | Flags |
|---|---|---|
| `/canvas-to-code:start` | Universal workflow. With no flags, scans `.claude-design/` and presents a guided menu (resume an active feature, import loose materials, or start fresh). With flags, dispatches to a specific mode. | `--feature <name>` · `--gate <0-10>` · `--prep` · `--pr <num>` |
| `/canvas-to-code:dashboard` | Work timeline: what's done, what's in progress, when it happened, PR + doc links. Cross-feature by default; per-feature with `--feature`. | `--feature <name>` · `--json` |
| `/canvas-to-code:assets` | File inventory under `.claude-design/<feature>/`: counts by type, paths, presence of standard artifacts (review.html, screenshots, source-meta, plan, spike). | `--feature <name>` · `--json` |

### Flag cheat sheet

| Flag | Lives on | Purpose |
|---|---|---|
| `--feature <name>` | `start`, `dashboard`, `assets` | Scope to one feature. On `start`, resumes from the next pending gate. |
| `--gate <0-10>` | `start` | Jump to or re-run a specific gate. `--gate 5` re-validates the component mapping; `--gate 8/9/10` runs slice / swap / retro preflight. |
| `--prep` | `start` | Scaffold `.claude-design/<feature>/` only — no conversational intake. |
| `--pr <num>` | `start` | Validate a slice PR against the plan; spawns the reviewer agent. |
| `--json` | `dashboard`, `assets` | Emit machine-readable output. |

### Upgrading from 0.2.x

The plugin namespace changed (`/design-to-code-bridge:design-to-code:*` → `/canvas-to-code:*`) and 10 commands collapsed to 3. Mapping:

| old | new |
|---|---|
| `/design-to-code:start` | `/canvas-to-code:start` |
| `/design-to-code:prep <f>` | `/canvas-to-code:start --feature <f> --prep` |
| `/design-to-code:plan <f>` | `/canvas-to-code:start --feature <f>` (auto-runs Gates 3–7) |
| `/design-to-code:validate <f>` | `/canvas-to-code:start --feature <f> --gate 5` |
| `/design-to-code:slice <n>` | `/canvas-to-code:start --gate 8` |
| `/design-to-code:swap` | `/canvas-to-code:start --gate 9` |
| `/design-to-code:retro` | `/canvas-to-code:start --gate 10` |
| `/design-to-code:review <pr>` | `/canvas-to-code:start --pr <num>` |
| `/design-to-code:status [<f>]` | `/canvas-to-code:dashboard [--feature <f>]` |
| `/design-to-code:dashboard` | `/canvas-to-code:dashboard` |

Mid-flight features keep working — `status.json` is forward-compatible, and the PM backfills new timestamp fields on first read.

---

## Architecture

| Surface | Count | Notes |
|---|---|---|
| **Commands** | 3 | All under `commands/`: `start`, `dashboard`, `assets`. |
| **Subagents** | 7 | `canvas-to-code-pm` (Opus, the orchestrator) · `-extractor` (Opus) · `-auditor` (Sonnet) · `-mapper` (Opus, keystone) · `-data-binder` (Opus) · `-planner` (Opus) · `-reviewer` (Sonnet). |
| **Skills** | 2 | `canvas-to-code-guardrails` (auto-activates in `.claude-design/` projects) · `canvas-to-code-vocabulary` (base/ds/custom tier model). |
| **Hooks** | 2 | `pre-commit-guardrails.sh` (opt-in hard gate) · `post-merge-cleanup.sh` (opt-in slice-branch + worktree cleanup). |
| **Templates** | 7 + 10 | Plan, slice/swap/retro PR bodies, designer handoff, spike, dashboard; plus 10 per-gate failure messages. |

The PM agent **never writes feature code**. It owns the conversation and the gates; engineers (or you) own the production code.

---

## Source compatibility

Day-1: Claude Design + screenshot-only. Others land when first encountered.

| Source | Discriminator signature | Decoder | Day-1 |
|---|---|---|---|
| Claude Design | `__bundler/template` script tag with embedded char-dictionary | Bundle decode → flat JSX | ✅ |
| Figma Export-to-Code | `data-figma-*` attrs OR `figma.com` in `<meta>` | Flatten inline styles → JSX, strip Figma class names | ⏳ |
| V0 / Lovable | `.tsx`/`.jsx` extension OR `v0.dev`/`lovable.dev` comment | Pass-through, sanitize imports | ⏳ |
| Webflow | `<link href=".webflow.css">` or `data-wf-*` | Convert HTML+CSS → JSX+Tailwind | ⏳ |
| Screenshot-only | No `review.html`, PNGs in `screenshots/` | No decode — extractor returns "visual-reference only" | ✅ |
| Generic HTML | Default fallback | Treat as V0 case | ✅ |

When auto-detect is ambiguous, `.claude-design/<feature>/source-meta.yaml` declares it.

---

## Adapting for other projects / design systems

This plugin originated at [Open Session](https://opensession.co) for the BOS codebase, but the BOS-specific bits live entirely in your `.design-to-code/` config and token map. To adapt:

1. Replace `token-map.yaml` with your DS tokens. The mapper produces token suggestions; the map tells it which suggestions to make.
2. Replace `config.yaml.components_dirs` with your component-folder layout (e.g. `components/`, `packages/ui/`, `src/components/`).
3. Adjust `config.yaml.guardrail_overrides` if your DS conventions diverge from Tailwind + CSS-variable + Style-2 mapped classes.

The gates, the PM flow, and the dashboard work unchanged. You don't fork; you configure.

---

## Status

**v0.3.0 — Canvas-to-Code.** Rebranded from `design-to-code-bridge`. Slash-command surface collapsed from 10 commands to 3 (`start`, `dashboard`, `assets`), with a 5-flag set (`--feature`, `--gate`, `--prep`, `--pr`, `--json`). `start` now opens with a guided discovery scan of `.claude-design/` so the first thing the user sees is what already exists. `status.json` gains lifecycle timestamps (created_at, last_touched_at, completed_at + per-slice merged_at and pr_number); the PM backfills these silently on pre-0.3.0 files. **Breaking change** — see the Upgrading section above.

See the canonical spec: [BOS-3.0 code-bridge spike](https://github.com/opensesh/BOS-3.0/blob/main/docs/spikes/design-system/2026-05/2026-05-12-code-bridge-standardization.md) (`docs/spikes/design-system/2026-05/2026-05-12-code-bridge-standardization.md` in the BOS repo).

---

## Contributing

Issues and PRs welcome. The test suite (`node --test tests/*.test.mjs`) must stay green. Mirrors [KARIMO](https://github.com/opensesh/KARIMO)'s contribution shape.

---

## Acknowledgements

- [KARIMO](https://github.com/opensesh/KARIMO) — PRD-driven autonomous development; this plugin lifts its PM-agent + status.json + worktree-cleanup patterns.
- [Untitled UI](https://www.untitledui.com/), [React Aria](https://react-spectrum.adobe.com/react-aria/) — the primitive layer that makes BOS's `components/base/` viable.
- [Claude Design](https://www.claude.com/product/claude-design), [Anthropic](https://www.anthropic.com).

---

## License

MIT. See [LICENSE](./LICENSE).

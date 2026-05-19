# Design-to-Code Bridge

> Translate any design export — HTML + screenshot — into design-system-aligned production code, with ten explicit gates that catch drift before it ships.

[![tests](https://github.com/opensesh/design-to-code-bridge/actions/workflows/test.yml/badge.svg)](https://github.com/opensesh/design-to-code-bridge/actions/workflows/test.yml)
[![version](https://img.shields.io/badge/version-0.1.0-blue.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://docs.claude.com/claude-code)

```
┌──────────────────────┐       ┌──────────────────────────┐       ┌─────────────────────────┐
│   Design tool        │       │   Design-to-Code Bridge  │       │   Your codebase         │
│   ───────────        │       │   ─────────────────────  │       │   ──────────────        │
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

- **Designers initiating a handoff** — drop an HTML export + a screenshot, run `/design-to-code:start`, the PM agent walks the intake conversation. No engineering knowledge required to begin.
- **Engineers implementing the handoff** — `/design-to-code:plan` produces a component-mapping table (every visual unit categorized base/ds/custom/net-new) and a slice plan. `/design-to-code:slice <n>` runs Gate 8 preflight + drafts the PR body.
- **Reviewers** — `/design-to-code:review <pr>` validates a slice PR against the plan's slice spec. Returns PASS/REVISE with file:line citations.
- **Design-system leads** — `/design-to-code:dashboard` aggregates every bridged feature into one view: PRs, LOC, and a **component +/− diff** showing reuse vs. net-new. Successful runs trend toward higher reuse and fewer net-new components over time.

---

## What it does — the ten gates

The PM agent walks every handoff through ten gates and refuses to advance when a gate fails. Resumable any time.

| Gate | Name | Failure mode |
|---|---|---|
| 0 | **Intake** | Conversational five-question intake. Saves and exits cleanly if materials aren't ready. |
| 1 | **Materials present** | HTML export + ≥1 screenshot required. PM walks you through capture if missing. |
| 2 | **DS-alignment of source** | Records translation-cost warning for non-canonical sources. Never blocks. |
| 3 | **Target surface audit** | Auditor agent reports route status, behaviors to port, sub-routes. |
| 4 | **Scope confirmation** | Routes added/dropped, behaviors to port, chrome decisions — all explicit. |
| 5 | **Component mapping** ◆ | The keystone. Every visual unit gets tier + target + new-or-reused + confidence. Low-confidence rows must be acknowledged. |
| 6 | **Slice plan** | Default rhythm: scaffold → chrome → cards → wire data → secondary → swap. 150–550 LOC per slice. |
| 7 | **Pre-slice** | Branch identity, working-tree cleanliness, prior-slice-merged checks before every `/design-to-code:slice <n>`. |
| 8 | **Pre-swap** | Behaviour-port checklist verified, parallel route 200s, dropped routes deletion-ready. |
| 9 | **Pre-retro** | Swap merged, typecheck + build green on main. |

Gate 5 (component mapping) is what makes everything downstream cheap. It prevents three classes of mid-slice churn: building a custom component a vendor primitive covers, discovering an icon doesn't exist mid-slice, re-discovering raw hex literals one slice at a time.

---

## Quick start

Inside any Claude Code project:

```
/plugin marketplace add opensesh/design-to-code-bridge
/plugin install design-to-code-bridge@opensesh-design-to-code-bridge
/design-to-code:start
```

That's it — the PM agent takes you through Gate 0 and writes everything else.

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

Committed design sources, one folder per feature. Always: `review.html`, a `screenshots/` folder with ≥1 PNG, and `source-meta.yaml` declaring the design tool. Iterating later? Re-run `/design-to-code:start` and the PM picks up from `status.json`.

### `.design-to-code/state/<feature>/status.json`

Per-feature state. Gitignored by default. Holds `phase`, `gateLog[]`, `componentMap`, `slices[]`. The single source of truth for the dashboard.

---

## Command reference

| Command | Persona | What it does |
|---|---|---|
| `/design-to-code:start` | Any | Canonical entry. PM runs Gate 0 (intake) — what are you building, materials check, source tool. Resumable. |
| `/design-to-code:prep <feature>` | Designer | Power-user shortcut — scaffolds `.claude-design/<feature>/` without the conversational interview. |
| `/design-to-code:plan <feature>` | Engineer | Runs Gates 3–6 end-to-end. Writes the plan doc + spike. |
| `/design-to-code:validate <feature>` | Engineer | Re-runs Gate 5 (mapping) standalone. |
| `/design-to-code:slice <n>` | Engineer | Gate 8 preflight + slice PR body. Updates `status.json.slices[]`. |
| `/design-to-code:swap` | Engineer | Gate 9 preflight + swap PR body. |
| `/design-to-code:retro` | Engineer | Gate 10 + PM-led retro interview. |
| `/design-to-code:dashboard` | Any | Cross-feature evaluation view with PR cross-refs and component +/− diff. |
| `/design-to-code:status [<feature>]` | Any | Prints `status.json` summary for one feature or all. |
| `/design-to-code:review <pr>` | Reviewer | Validates a slice PR diff against the plan's slice spec. |

---

## Architecture

| Surface | Count | Notes |
|---|---|---|
| **Commands** | 10 | All under `commands/design-to-code/`. |
| **Subagents** | 6 | `design-to-code-pm` (Opus, the orchestrator) · `-extractor` (Opus) · `-auditor` (Sonnet) · `-mapper` (Opus, keystone) · `-planner` (Opus) · `-reviewer` (Sonnet). |
| **Skills** | 2 | `design-to-code-guardrails` (auto-activates in `.claude-design/` projects) · `design-to-code-vocabulary` (base/ds/custom tier model). |
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

**v0.1.0 — initial scaffold.** Plugin core (PM agent, six subagents, ten commands, two skills, ten gate-failure messages) shipped. CI test suite green (10/10). Synthetic-feature dogfood passes. First real-feature validation pending.

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

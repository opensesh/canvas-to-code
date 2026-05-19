# Design-to-Code Bridge — Rules

Portable rules that define subagent behavior for the Design-to-Code Bridge plugin. These rules apply to every spawn of a `design-to-code-*` agent, regardless of consumer project. Consumer-side overrides live in `.design-to-code/config.yaml`.

---

## Core Philosophy

**"Translate intent, not pixels."**

The bridge takes HTML + screenshot and produces DS-aligned code. Both inputs are always off-brand in some way. The PM agent orchestrates ten gates; the worker agents (extractor, auditor, mapper, planner, reviewer) do focused work behind those gates. **The human is the engineer — agents support, never replace, the implementation.**

---

## Command Context

Agents are spawned by these primary commands:

- `/design-to-code:start` — Spawns `design-to-code-pm` for Gate 0 intake.
- `/design-to-code:plan <feature>` — Spawns `-auditor`, `-extractor`, `-mapper`, `-planner` (Gates 3–6).
- `/design-to-code:validate <feature>` — Re-runs `-mapper` standalone (Gate 5).
- `/design-to-code:slice <n>` — PM runs Gate 8 preflight.
- `/design-to-code:swap` — PM runs Gate 9 preflight.
- `/design-to-code:retro` — PM runs Gate 10 then a conversational retro.
- `/design-to-code:dashboard` — No agent; reads `state/*/status.json` + git + GitHub.
- `/design-to-code:review <pr>` — Spawns `-reviewer`.

Worker agents are never spawned directly; the PM orchestrates.

---

## The Ten Gates

Gates run in strict order. PM refuses to advance to gate N until gate N-1 has `result: pass` or `result: warn` (when configured non-blocking).

| # | Name | Blocking by default? |
|---|---|---|
| 0 | Intake | yes — must complete |
| 1 | Materials present | yes — HTML + ≥1 screenshot required |
| 2 | DS-alignment of source | no — warn-only |
| 3 | Target surface audit | yes |
| 4 | Scope confirmation | yes |
| 5 | Component mapping ◆ | yes — every flagged row must be acknowledged |
| 6 | Slice plan | yes |
| 7 | Pre-slice (per slice) | yes |
| 8 | Pre-swap | yes |
| 9 | Pre-retro | configurable; default warn |

Severity can be overridden per-consumer in `.design-to-code/config.yaml.gate_severities`.

---

## Agent Behavior Rules

### 1. PM Never Writes Feature Code

`design-to-code-pm` orchestrates and gates. **It never edits production code.** Its `Write` and `Edit` tools are scoped — by system prompt — to:

- `.design-to-code/state/<feature>/status.json`
- `.claude-design/<feature>/source-meta.yaml` (when Gate 0 needs to infer it)
- `docs/spikes/design-system/**/*.md` (when retro asks it to)

If asked to write feature code, the PM declines and offers to spawn `design-to-code-planner` (which writes the plan) or to hand off to the engineer.

### 2. The Mapper Verifies Reuse Claims

`design-to-code-mapper` is the keystone agent. The dashboard's component +/− diff depends on the `newOrReused` flag in `componentMap.units[]`. False positives ("reused" but the file doesn't exist yet) destroy the dashboard's signal.

**The mapper MUST `ls` (or Glob) the target path before marking a unit `reused`.** If the path doesn't exist, the unit is `new`.

### 3. Always Read Consumer Config

At spawn time, every agent reads:

1. `.design-to-code/config.yaml` — gate severities, LOC budget, component dirs.
2. `.design-to-code/token-map.yaml` — hex → token mappings.
3. `.design-to-code/state/<feature>/status.json` — phase, gateLog, prior decisions.

Agents that don't find these files emit a friendly error pointing at the `templates/config.example.yaml` setup path.

### 4. Voice & Delivery

- **Do:** Present prompts directly. "Drop your HTML + screenshot." "Generate plan now? [Y/n]"
- **Don't:** Narrate. "Let me ask…" "I'll show you…" "I'm going to…"

Users see what's happening — narration adds tokens without adding clarity. Mirrors KARIMO interviewer voice rules.

### 5. State-File Conventions

`.design-to-code/state/<feature>/status.json` is the per-feature single source of truth. Every gate transition appends a `gateLog` entry:

```json
{
  "gate": 5,
  "result": "pass",
  "atISO": "2026-05-12T18:25:00Z",
  "note": "47 units mapped; 2 low-confidence rows acknowledged"
}
```

`result` ∈ `pass | warn | fail | pending`. The PM treats `warn` as advancing (records the warning); `fail` blocks.

### 6. Idempotency

Re-running `/design-to-code:start` mid-flow MUST resume from the last-completed gate. Read `status.json`, summarise progress, ask what to do next. Don't restart Gate 0 unless explicitly requested.

### 7. Source-Type Discriminator

The extractor runs `scripts/discriminator.mjs` against the first 2 KB of `review.html`. Signatures:

| Source | Signature |
|---|---|
| `claude-design` | `<script type="__bundler/template">` present |
| `figma` | `data-figma-*` attributes OR `figma.com` in `<meta>` |
| `v0` | filename ends `.tsx`/`.jsx` OR `v0.dev` comment in first 2 KB |
| `lovable` | `lovable.dev` comment |
| `webflow` | `<link href=".webflow.css">` OR `data-wf-*` |
| `screenshot-only` | no `review.html` exists in `.claude-design/<feature>/` |
| `generic-html` | default fallback |

When ambiguous, `.claude-design/<feature>/source-meta.yaml` declares `source:` explicitly.

### 8. Branch & Slice Conventions

- Feature branch: `<feature>` (e.g., `brand-hub-hifi`). Created by the engineer, not the plugin.
- Slice branches: `<feature>-pr-<n>-<slug>` (e.g., `brand-hub-hifi-pr-3-pillar-cards`). Default; configurable via `slice_branch_pattern`.
- LOC budget per slice: 150–550. Default `slice_loc_budget: 550`. Mapper proposes splits for any slice exceeding budget.

### 9. Commit Standards

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- Every slice PR's commits are scoped to that slice's declared files (from the mapping).
- Always include `Co-Authored-By:` footer when a Claude agent participates.

### 10. Pre-PR Validation

Before opening a slice PR, the engineer (or the post-merge hook) verifies:

- Working tree clean.
- Current branch matches `<feature>-pr-<n>-<slug>`.
- Plan's slice spec up-to-date in `status.json`.
- Consumer typecheck + lint + build pass (commands configurable in `.design-to-code/config.yaml`).

---

## Source-Materials Contract

The bridge always takes **two** inputs paired together:

| Input | Role | Format |
|---|---|---|
| HTML export | Structural intent — element tree, hierarchy | `review.html` (single file) |
| Screenshot(s) | Visual intent — colors, spacing, weight | PNG(s) in `screenshots/`, numerically prefixed |

Either missing → Gate 1 fails. Screenshot-only is a special case (no `review.html`) that produces a visual-reference-only run; the planner asks more conversational questions to fill the structural gap.

---

## Guardrails (Skill-level reminders)

These are surfaced by the `design-to-code-guardrails` skill while editing files in `app/`, `components/`, or `lib/`. The pre-commit hook can enforce them as a hard gate.

1. `devProps` naming must match the function name exactly.
2. No `border-2` or thicker borders for containers.
3. No `ring-2` — use `ring-1 + shadow-focus-ring`.
4. No raw hex in JSX (except swatch-data structures).
5. Tailwind Style 2 mapped classes only (no `bg-[var(--bg-primary)]`).
6. No array-index keys.
7. Vendor primitive first — check `components/base/` (or your equivalent) before building custom.

Severity is consumer-controlled (`config.yaml.guardrail_severity` ∈ `warn | error`).

---

## Security

- Never commit secrets — design exports occasionally embed API keys in embedded JSON. Extractor strips them when detected.
- Never write to consumer paths outside `.design-to-code/`, `.claude-design/`, `docs/spikes/` without explicit user action.
- Hooks are opt-in; consumer opts in via `.claude/settings.json`.

---

## Loop Awareness

If the same gate fails 3 times with the same error fingerprint, the PM:

1. Surfaces the loop explicitly.
2. Suggests escalation (different design tool, simpler scope, manual override).
3. Records `gateLog[].loops` on the failing entry.

No autonomous escalation — this is a hands-on tool.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge) · License: MIT · Origin: [Open Session](https://opensession.co)*

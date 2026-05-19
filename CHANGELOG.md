# Changelog

All notable changes to the Design-to-Code Bridge plugin are documented here. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-19

### Added

- **Gate 6 — Data binding.** New gate sits between Component mapping (Gate 5) and Slice plan. Classifies every mapped unit as `backend` (wire to an existing service), `mock` (emit a schema + JSON + TS-interface triple under hierarchical `data/<page>/<subpage>/`), or `none` (decorative). Low-confidence rows must be acknowledged before advancing.
- **`design-to-code-data-binder` subagent** — 7th subagent, owns Gate 6. Walks the consumer's `lib/services/`, `hooks/`, and route tree to propose the binding tier per unit and queue mock-file triples for the planner.
- **`templates/gate-failures/6-data-binding.md`** — per-gate failure message template for low-confidence bindings, page/subpage conflicts, and backend overrides.

### Changed

- **Gate renumbering** (breaking change for any consumer reading gate numbers from `status.json`):
  - Slice plan: Gate 6 → Gate 7
  - Pre-slice: Gate 7 → Gate 8
  - Pre-swap: Gate 8 → Gate 9
  - Pre-retro: Gate 9 → Gate 10
- **`templates/gate-failures/9-pre-retro.md` → `10-pre-retro.md`** (renamed).
- **`agents/design-to-code-pm.md`** — updated to reference "eleven gates"; Gate 6 section added between Gate 5 and Gate 7.
- **`DESIGN_TO_CODE_RULES.md`** — expanded to document the data-binding gate and the hierarchical `data/<page>/<subpage>/` convention (~24% growth).

### Notes

- This is a breaking change for any consumer who has frozen `status.json` snapshots from v0.1.0 — gate numbers ≥ 6 have shifted by 1. Run `/design-to-code:start` on existing features to re-validate against the new gate ordering.

## [0.1.0] — 2026-05-12

### Added

- Plugin scaffold: `.claude-plugin/plugin.json` manifest.
- `DESIGN_TO_CODE_RULES.md` — portable rules file for subagent behavior (lifts KARIMO_RULES.md shape).
- 10 commands under `commands/design-to-code/`: `start`, `prep`, `plan`, `validate`, `slice`, `swap`, `retro`, `dashboard`, `status`, `review`.
- 6 subagents: `design-to-code-pm` (Opus, orchestrator), `-extractor` (Opus), `-auditor` (Sonnet), `-mapper` (Opus, keystone), `-planner` (Opus), `-reviewer` (Sonnet).
- 2 skills: `design-to-code-guardrails` (editor-time lint reminders), `design-to-code-vocabulary` (base/ds/custom tier model).
- 2 opt-in hooks: `pre-commit-guardrails.sh`, `post-merge-cleanup.sh`.
- 7 templates + 10 per-gate failure messages.
- 2 consumer-config examples: `config.example.yaml`, `token-map.example.yaml`.
- 4 deterministic Node helper scripts: `discriminator.mjs`, `status-machine.mjs`, `render-dashboard.mjs`, `check-guardrails.mjs`.
- 10-test suite (`tests/*.test.mjs`) — manifest + frontmatter validation, discriminator unit tests, mapper schema check, status round-trip, dashboard render, gate ordering, PM no-code-writing audit, guardrail detection, source-meta defaults.
- CI workflow (`.github/workflows/test.yml`) — runs all 10 tests on every PR + push to main.
- Brand Hub reference fixture under `examples/brand-hub/` with hand-authored golden files.

### Notes

- Day-1 source decoders: Claude Design + screenshot-only. Figma, V0, Lovable, Webflow detection is wired; their decoders land when first encountered.
- First real-feature validation pending — synthetic-feature dogfood passed at scaffold time.

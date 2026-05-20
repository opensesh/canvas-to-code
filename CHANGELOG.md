# Changelog

All notable changes to the Canvas-to-Code plugin are documented here. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] — 2026-05-19

### Added

- **Iter folders as first-class sources.** The bridge now accepts iter-shaped subfolders (`<feature>/<subpage>/<tool>/iter-NN-<slug>/`) alongside today's flat `<feature>/review.html` shape. Producer skills like the BOS `paper-design` skill emit iters directly; the iter IS the handoff — no separate "promote" step.
- **`paper` source type** in the canonical enum (`paper | claude-design | figma | v0 | lovable | webflow | screenshot-only | generic-html`). Gate 2 treats `paper` as DS-aligned pass — the consumer's own producer skill has no synthetic-source translation cost.
- **Gate 0 unified picker** — a single menu in the no-flags `start` flow that lists active features, v2 iter folders (sorted by `source-meta.yaml` mtime, capped at 10), loose materials, and completed features. The user picks by number or pastes an iter path; the bridge auto-fills Gate 0 from `source-meta.yaml`. Two always-on tail options: "Import from external source" (today's conversational intake) and "Start blank".
- **Gate 1 iter snapshot.** When `sourceShape === "iter"`, Gate 1 verifies the seven v2 required fields, then copies `source-meta.yaml` + `jsx/*.tsx` + `screenshots/*` into `.canvas-to-code/state/<feature>/source-snapshot/`. The iter folder can evolve or be deleted afterward without breaking the in-flight bridge.
- **Gate 5a extractor short-circuit.** When `sourceShape === "iter"`, the extractor skips HTML parsing entirely and copies the snapshot's pre-extracted JSX directly to `/tmp/<feature>-template.tsx`. This eliminates the lossiest gate in the pipeline (HTML→JSX extraction) for any consumer using a producer skill.
- **`status.json` source-shape fields** — `subpage` (string, nullable), `sourceShape` (`"iter" | "flat"`, default `"flat"`), `sourceIterPath` (string, nullable). All three are additive and back-fill on first read of pre-0.4.0 status files.
- **Test coverage** for the iter pipeline: `tests/12-iter-source-meta-v2.test.mjs`, `tests/13-gate-1-iter-snapshot.test.mjs`, `tests/14-gate-5a-iter-shortcircuit.test.mjs`, `tests/15-gate-0-picker.test.mjs`. Plus a `tests/fixtures/iter-paper-v2/` fixture modeling the canonical BOS-3.0 paper-design output.

### Changed

- **State directory convention** — consumer-repo state moves from `.design-to-code/` to `.canvas-to-code/`. The PM auto-migrates on first spawn: if `.design-to-code/` exists and `.canvas-to-code/` does not, it `mv`'s the directory once. Single-line backfill, no script.
- **Rules doc renamed** — `DESIGN_TO_CODE_RULES.md` → `CANVAS_TO_CODE_RULES.md`. All cross-references updated.
- **`scripts/discriminator.mjs`** now returns `{ type, shape, signal }`. `shape: "iter"` when a directory contains `source-meta.yaml` with `metaVersion: 2`; `shape: "flat"` otherwise. The exported helper `parseSimpleYaml` reads top-level scalar fields.
- **`agents/canvas-to-code-pm.md`** dispatch tree expanded: guided discovery scan picks up v2 iter folders; Gate 0 has an iter auto-fill branch; Gate 1 branches on `sourceShape`; Gate 2 case list adds `paper`.
- **`agents/canvas-to-code-extractor.md`** documents the Gate 5a iter short-circuit at the top, with frontmatter granting `Write` + `Bash` to copy the snapshot file.
- **`commands/start.md`** describes the new unified menu in user-facing form.
- **`commands/assets.md`** surfaces `sourceShape`, iter folder path, and the `source-snapshot/` directory in feature blocks.
- **`commands/dashboard.md`** single-feature view annotates the Source line with the shape and shows `subpage` when present.
- **`CANVAS_TO_CODE_RULES.md`** §5 documents the three new status fields plus their backfill; §7 explains that the discriminator now branches on shape before reading signatures.

### Internal

- **Agent + skill filename rename** completed (deferred from v0.3.0). All 7 agents now under `agents/canvas-to-code-*.md`; both skills under `skills/canvas-to-code-*.md`. Tests assert the canvas-to-code- prefix on every agent/skill name and frontmatter `name:` field.
- **Full plugin-name purge.** Every reference to the legacy plugin name and command namespace stripped from agents, commands, templates, hooks, scripts, tests, and docs. The plugin's name, paths, and slash commands are uniformly `canvas-to-code`.

### Notes

- **Flat shape unchanged.** Every consumer using `review.html` + screenshots keeps working without any migration. The two shapes are peers; the bridge knows nothing producer-specific about Paper or any future iter producer — `source: paper` is just an enum value.
- **No status.json migration script.** Pre-0.4.0 `status.json` files backfill silently on first read: `subpage = null`, `sourceShape = "flat"`, `sourceIterPath = null`.
- **State-dir migration is one-shot.** The PM moves `.design-to-code/` → `.canvas-to-code/` exactly once, the first time it spawns in a consumer repo that still uses the old path. Idempotent — every subsequent spawn finds `.canvas-to-code/` and skips the check.
- **v1 iters get rejected at Gate 1** with a backfill hint pointing at the consumer's producer skill — never silently coerced.
- **`--from-iter` flag deferred.** The Gate 0 picker covers the wizard path; a flag-based shortcut would push past the 5-flag cap. Revisit if scripted scaffolding becomes a real need.

## [0.3.0] — 2026-05-19

### BREAKING

- **Plugin namespace collapsed.** Slash-command namespace consolidated to `/canvas-to-code:*`. The earlier doubled prefix that truncated the picker is gone.
- **Marketplace and repo renamed** to `canvas-to-code-marketplace` and `opensesh/canvas-to-code`. Reinstall from the renamed marketplace once your environment refreshes.
- **Command surface collapsed** from 10 commands to 3:
  - `/canvas-to-code:start` subsumes start, prep, plan, validate, slice, swap, retro, review via flags (`--feature`, `--gate`, `--prep`, `--pr`).
  - `/canvas-to-code:dashboard` subsumes the old status + dashboard.
  - `/canvas-to-code:assets` is new — a file-inventory view of `.claude-design/<feature>/`.

  Total flag set across the three commands: `--feature`, `--gate`, `--prep`, `--pr`, `--json` (5 flags).
- **Folder flattened** — the prior nested `commands/` subdirectory is gone; all three commands live at `commands/*.md`.

### Added

- **Guided discovery scan in `/canvas-to-code:start`.** When called with no flags, the PM agent scans `.claude-design/` and presents a menu: resume an active feature, import loose materials, or start fresh. PM never silently auto-advances past Gate 0 without showing the discovery summary.
- **`status.json` lifecycle timestamps** — `created_at`, `last_touched_at`, `completed_at`, and per-slice `started_at` / `merged_at` / `pr_number`. The dashboard's "when it was done" column reads these. PM backfills absent fields from `gateLog` silently on first read; no separate migration script.

### Changed

- **PM agent dispatch tree.** `agents/canvas-to-code-pm.md` now opens with an explicit flag-parsing dispatch tree (no flags → discovery; `--prep` → scaffold-only; `--pr` → reviewer; `--feature` → resume; `--gate` → jump/re-run) and the guided discovery section.
- **README** rewritten around the three-command surface.
- **CANVAS_TO_CODE_RULES.md** §5 documents the new timestamp fields + backfill rule; the Command Context section reflects the new surface.

### Notes

- **No alias commands.** Legacy slash paths cease to exist with this collapse; aliases would just regrow the surface area we just consolidated.
- **Mid-flight features keep working.** `status.json` is additively forward-compatible. The PM's first read of a pre-0.3.0 file backfills `created_at = gateLog[0].atISO` and writes the file back.

## [0.2.0] — 2026-05-19

### Added

- **Gate 6 — Data binding.** New gate sits between Component mapping (Gate 5) and Slice plan. Classifies every mapped unit as `backend` (wire to an existing service), `mock` (emit a schema + JSON + TS-interface triple under hierarchical `data/<page>/<subpage>/`), or `none` (decorative). Low-confidence rows must be acknowledged before advancing.
- **`canvas-to-code-data-binder` subagent** — 7th subagent, owns Gate 6. Walks the consumer's `lib/services/`, `hooks/`, and route tree to propose the binding tier per unit and queue mock-file triples for the planner.
- **`templates/gate-failures/6-data-binding.md`** — per-gate failure message template for low-confidence bindings, page/subpage conflicts, and backend overrides.

### Changed

- **Gate renumbering** (breaking change for any consumer reading gate numbers from `status.json`):
  - Slice plan: Gate 6 → Gate 7
  - Pre-slice: Gate 7 → Gate 8
  - Pre-swap: Gate 8 → Gate 9
  - Pre-retro: Gate 9 → Gate 10
- **`templates/gate-failures/9-pre-retro.md` → `10-pre-retro.md`** (renamed).
- **`agents/canvas-to-code-pm.md`** — updated to reference "eleven gates"; Gate 6 section added between Gate 5 and Gate 7.
- **`CANVAS_TO_CODE_RULES.md`** — expanded to document the data-binding gate and the hierarchical `data/<page>/<subpage>/` convention (~24% growth).

### Notes

- This is a breaking change for any consumer who has frozen `status.json` snapshots from v0.1.0 — gate numbers ≥ 6 have shifted by 1. Run the workflow command on existing features to re-validate against the new gate ordering.

## [0.1.0] — 2026-05-12

### Added

- Plugin scaffold: `.claude-plugin/plugin.json` manifest.
- `CANVAS_TO_CODE_RULES.md` — portable rules file for subagent behavior (lifts KARIMO_RULES.md shape).
- 10 commands under `commands/` — `start`, `prep`, `plan`, `validate`, `slice`, `swap`, `retro`, `dashboard`, `status`, `review` (collapsed to 3 in v0.3.0).
- 6 subagents: `canvas-to-code-pm` (Opus, orchestrator), `-extractor` (Opus), `-auditor` (Sonnet), `-mapper` (Opus, keystone), `-planner` (Opus), `-reviewer` (Sonnet).
- 2 skills: `canvas-to-code-guardrails` (editor-time lint reminders), `canvas-to-code-vocabulary` (base/ds/custom tier model).
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

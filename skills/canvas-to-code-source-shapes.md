---
name: canvas-to-code-source-shapes
description: Reference for the two source shapes Canvas-to-Code accepts — flat (review.html + screenshots) and iter (producer-emitted folder with source-meta v2). Auto-activates when the user mentions "iter source", "flat source", "review.html", "iter folder", "source shape", "supported producers", "metaVersion", "source-meta", "producer skill", or runs /canvas-to-code:start.
---

# Canvas-to-Code Source Shapes

Two shapes, two source paths into the bridge. The Gate 0 picker treats them as peers — you pick whichever your producer emits.

## When to surface

- Any `/canvas-to-code:*` command is in flight.
- The user mentions `iter`, `iter shape`, `flat shape`, `review.html`, `source-meta`, `metaVersion`, `producer skill`, `bridge-ready`.
- A gate failure references source detection (discriminator output, Gate 1 materials check, Gate 5a extractor).

## Flat shape

Any tool that emits HTML + screenshot. Drop the files directly into `.claude-design/<feature>/`.

```
.claude-design/<feature>/
  review.html              ← design export
  screenshots/             ← one or more PNGs
  source-meta.yaml         ← optional; declares `source:` when discriminator is ambiguous
```

The discriminator reads the first 2 KB of `review.html` and returns `{ type, shape: "flat" }`. Gate 5a parses the HTML into JSX.

**Best for:** external design tools (Claude Design, Figma, V0, Lovable, Webflow) and one-off HTML drops.

## Iter shape

A subfolder ending in `iter-NN-<slug>` with a v2-compliant `source-meta.yaml`. Emitted by a **producer skill** in the consumer's codebase — e.g. BOS's [`paper-design`](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/SKILL.md) skill writes iters under `.claude-design/<feature>/<subpage>/paper/`.

```
.claude-design/<feature>/<subpage>/<tool>/iter-NN-<slug>/
  source-meta.yaml         ← metaVersion: 2 + the seven required fields
  notes.md
  jsx/<page>.tsx           ← pre-extracted JSX
  screenshots/01-*.png
```

When the Gate 0 picker selects an iter:

1. **Gate 1** snapshots `source-meta.yaml` + `jsxPath` + `primaryScreenshot` + all sibling screenshots into `.canvas-to-code/state/<feature>/source-snapshot/`. The bridge reads from the snapshot for the rest of the run, so the iter folder can evolve freely afterward.
2. **Gate 5a** short-circuits the HTML extractor and copies the snapshot JSX straight to `/tmp/<feature>-template.tsx`. The lossiest gate in the pipeline becomes a no-op.

The iter IS the handoff — no manual "promote to review.html" step.

**Best for:** in-codebase, designer-iterated, JSX-clean Paper work.

## The v2 contract (source-meta)

Seven required fields. The canonical spec lives in the BOS producer skill (single source of truth — never duplicate it inline here):

```yaml
metaVersion: 2
source: paper # paper | claude-design | figma | v0 | lovable | webflow | screenshot-only | generic-html
feature: brand-hub # URL path segment 1 (slug)
subpage: colors # URL path segment 2, or 'home' if URL is the feature index
targetRoute: /brand-hub/colors
jsxPath: jsx/brand-hub-colors.tsx # relative to the iter folder
primaryScreenshot: screenshots/01-baseline.png
```

Optional informational fields the bridge preserves but ignores: `exportedAt`, `exportedBy`, `sourceProject`, `paperFileName`, `paperArtboardName`, `paperArtboardId`, `captureMethod`, `liveSourceUrl`, `artboardDimensions`, `templateVersion`, `notes`.

**Canonical reference:** [BOS paper-design SKILL.md § Source-meta v2 schema](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/SKILL.md#source-meta-v2-schema-the-bridge-contract).

## Supported producers

| Producer        | Skill / tool                                                                                                                | Emits                       | Status     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------- |
| Paper.Design    | BOS [`/paper-design`](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/) | iter shape                  | ✅ v0.4.0  |
| Claude Design   | `File → Export → HTML`                                                                                                      | flat shape                  | ✅         |
| Figma           | `Export-to-Code` plugin                                                                                                     | flat shape                  | ⏳ partial |
| V0 / Lovable    | `.tsx` / `.jsx` export                                                                                                      | flat shape                  | ⏳ partial |
| Webflow         | `.webflow.css` export                                                                                                       | flat shape                  | ⏳ partial |
| Screenshot-only | manual PNG drop                                                                                                             | flat shape (no review.html) | ✅         |
| Generic HTML    | manual drop                                                                                                                 | flat shape (fallback)       | ✅         |

New producer skills can ship iter shape too — the bridge is producer-agnostic. The contract is the v2 schema; the rest is up to the producer.

## What Gate 1 (materials check) verifies

**Flat shape:**

- `review.html` exists and is non-empty (unless `source: screenshot-only`)
- `screenshots/` contains ≥1 PNG
- `source-meta.yaml` exists (stub written from Gate 0 answers if missing)

**Iter shape:**

- `source-meta.yaml` has `metaVersion: 2` and all seven required fields
- `jsxPath` resolves to a non-empty file inside the iter folder
- `primaryScreenshot` resolves to a non-empty file inside the iter folder
- Snapshot copied to `.canvas-to-code/state/<feature>/source-snapshot/`

Failures print a structured message pointing at the producer skill for backfill.

## When to suggest a flat shape vs iter shape

| User signal                                                  | Suggest                                            |
| ------------------------------------------------------------ | -------------------------------------------------- |
| "I exported this from Claude Design / Figma / V0 / Webflow"  | Flat shape — drop into `.claude-design/<feature>/` |
| "I'm using `/paper-design`"                                  | Iter shape — already correct                       |
| "I just have a screenshot"                                   | Flat shape with `source: screenshot-only`          |
| "I want to redo three subpages in one run"                   | Flat shape at the feature root (cross-subpage)     |
| "I have HTML but no design tool — wrote it by hand"          | Flat shape with `source: generic-html`             |
| "My producer is something custom I'm building"               | Iter shape if you can emit v2 source-meta          |

## Cross-references

- [`canvas-to-code-vocabulary`](./canvas-to-code-vocabulary.md) — the surrounding mental model (tiers, slice rhythm, eleven gates).
- [`canvas-to-code-guardrails`](./canvas-to-code-guardrails.md) — editor-time lint reminders.
- [`/canvas-to-code:start`](../commands/start.md) — the entry point. Picker scans for both shapes.
- [BOS paper-design SKILL.md](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/SKILL.md) — example producer skill. Owns the canonical v2 schema.
- [BOS design-handoff skill](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/design-handoff/SKILL.md) — mirror skill on the producer side; carries the four "is this iter ready?" decision rules.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

---
description: "Inventory .claude-design/<feature>/ — file counts, types, locations."
allowed-tools: Read, Bash, Glob
argument-hint: "[--feature <name>] [--json]"
---

# /canvas-to-code:assets — File inventory

Read-only walk of `.claude-design/` (and, for state-tracked features, the matching `.design-to-code/state/<feature>/` directory). Reports what's on disk, grouped by type, so you can see what's available to import or audit without running `ls` and `find`.

## What it shows

**All features** (no args) — one block per feature subfolder under `.claude-design/`:

- Feature name + path
- Source shape: `iter` (with subpage + iter path) or `flat`. Read from `status.json.sourceShape`.
- Counts by extension: `*.html`, `*.png`, `*.yaml`, `*.md`, `*.tsx`, `*.json`, _other_
- Total size on disk
- Whether each standard artifact is present:
  - `review.html` (flat) **or** iter folder path with `source-meta.yaml` v2 (iter)
  - `screenshots/` (count of PNGs)
  - `source-meta.yaml` (flat root) or `<iter>/source-meta.yaml` (iter)
  - `notes.md`
  - `.design-to-code/state/<feature>/status.json` (yes/no)
  - `.design-to-code/state/<feature>/source-snapshot/` (iter-shape features only — verifies the Gate 1 snapshot landed)
  - `.design-to-code/state/<feature>/plan.md` (yes/no)
  - `.design-to-code/state/<feature>/audit.md` (yes/no)
  - Plan doc at `docs/spikes/design-system/<YYYY-MM>/<YYYY-MM-DD>-<feature>-bridge.md` (yes/no, with path)
  - Extracted JSX in `/tmp/<feature>-template.tsx` (yes/no — ephemeral)

**Single feature** (`--feature <name>`) — adds:

- Full file tree under `.claude-design/<feature>/` with absolute paths + byte sizes
- Component-mapping excerpt from `status.json.componentMap.byTier` (counts only)
- Slice file allocations from `status.json.slices[].files`

## Sample (all features)

```
Canvas-to-Code — assets
=======================
Root: .claude-design/  (3 features · 14.2 MB total)

brand-hub-hifi
  .claude-design/brand-hub-hifi/                    9.1 MB
  ├─ review.html               ✓     1.4 MB
  ├─ screenshots/              ✓     7.6 MB  (12 PNGs)
  ├─ source-meta.yaml          ✓     412 B
  ├─ notes.md                  ✓     1.8 KB
  ├─ status.json               ✓     12.4 KB  (.design-to-code/state/)
  ├─ plan.md                   ✓     8.2 KB
  ├─ audit.md                  ✓     3.1 KB
  └─ spike                     ✓     docs/spikes/design-system/2026-05/2026-05-12-brand-hub-hifi-bridge.md
  Counts:  .html 1 · .png 12 · .yaml 1 · .md 3 · .json 1

spaces-redesign
  .claude-design/spaces-redesign/                   3.9 MB
  ├─ review.html               ✓     780 KB
  ├─ screenshots/              ✓     2.9 MB  (5 PNGs)
  ├─ source-meta.yaml          ✓     398 B
  ├─ notes.md                  ✓     2.1 KB
  ├─ status.json               ✓     9.7 KB
  ├─ plan.md                   ✓     6.4 KB
  ├─ audit.md                  ✓     2.8 KB
  ├─ spike                     ✓     docs/spikes/design-system/2026-06/2026-06-04-spaces-redesign-bridge.md
  └─ template.tsx              ✓     /tmp/spaces-redesign-template.tsx  (78 KB, ephemeral)
  Source: flat
  Counts:  .html 1 · .png 5 · .yaml 1 · .md 3 · .json 1 · .tsx 1

brain (iter source)
  .claude-design/brain/home/paper/iter-01-baseline/  860 KB
  ├─ source-meta.yaml          ✓     420 B   (metaVersion: 2, source: paper)
  ├─ notes.md                  ✓     1.2 KB
  ├─ jsx/brain-home.tsx        ✓     14.8 KB
  └─ screenshots/              ✓     844 KB  (1 PNG)
  Snapshot:                   ✓     .design-to-code/state/brain/source-snapshot/  (mirrors the iter at Gate 1)
  Source: iter · subpage: home · iter path: .claude-design/brain/home/paper/iter-01-baseline/
  Counts:  .yaml 1 · .md 1 · .tsx 1 · .png 1

account-shell
  .claude-design/account-shell/                     1.2 MB
  ├─ review.html               ✓     410 KB
  ├─ screenshots/              ✓     820 KB  (4 PNGs)
  ├─ source-meta.yaml          ✓     386 B
  ├─ notes.md                  ✓     1.4 KB
  ├─ status.json               ✓     7.1 KB
  ├─ plan.md                   ✓     5.2 KB
  ├─ audit.md                  —     (Gate 3 not yet run)
  └─ spike                     ✓     docs/spikes/design-system/2026-06/2026-06-10-account-shell-bridge.md
  Counts:  .html 1 · .png 4 · .yaml 1 · .md 3 · .json 1
```

## Arguments

- `--feature <name>` — Single-feature deep listing (full tree + sizes + mapping excerpt).
- `--json` — Machine-readable output.

## Failure modes

- No `.claude-design/` directory → prints the empty-state hint pointing at `/canvas-to-code:start --prep <feature>`.
- `--feature <name>` not found → lists features that do exist under `.claude-design/`.

## Related

- `/canvas-to-code:dashboard` — gate progress, PRs, timestamps.
- `/canvas-to-code:start --prep <feature>` — scaffold a new feature's asset folder.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

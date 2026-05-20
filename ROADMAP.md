---
title: Canvas-to-Code Roadmap
status: living document — strategic horizon, not feature backlog
last-updated: 2026-05-19
audience: maintainers + potential design partners
---

# Canvas-to-Code Roadmap

This is the strategic-horizon doc for canvas-to-code. It complements [CHANGELOG.md](./CHANGELOG.md) (what shipped) and [DESIGN_TO_CODE_RULES.md](./DESIGN_TO_CODE_RULES.md) (how the plugin operates) by saying: *where the plugin is going, and why*.

## For potential adopters: how to think about this plugin today

Canvas-to-code is currently **dogfooded inside [open-session/BOS-3.0](https://github.com/open-session/BOS-3.0)**. That's intentional: every gate, every agent, every skill has been forged against one consumer's real codebase before being lifted into the plugin. The plugin works in any project — but it's tuned to BOS, and some of the producer-side capabilities still live in BOS itself rather than the plugin (see [Current state](#current-state-v040) below).

**Today's recommendation:**

- ✅ **Use it** if your codebase is structurally similar to BOS (Next.js 16, vendor primitives in `components/base/`, design exports flowing through `.claude-design/`). Several gates (mapper, guardrails) are tuned to that shape.
- ⚠️ **Wait** if you're a different stack or want a fully turnkey adoption experience. The "producer-config" layer that lets non-BOS consumers customize the app shell, brand colors, and dev URLs isn't shipped yet — see [Phase 1](#phase-1--soon-post-v040-stabilization) below.
- 🚧 **Talk to us** if you want to be a design partner. A second consumer is exactly what we need to validate the extraction work. Open an issue or reach out: hello@opensession.co.

The eventual goal: **public template**. Anyone can `/plugin install canvas-to-code` plus a single `/canvas-to-code:init` invocation that scaffolds producer config from their repo's existing app shell. We're not there yet; we will be.

**Why we're not there yet:** premature extraction is the most common way template plugins ossify into "the original author's taste" before they meet a second user. We'd rather prove the patterns in one full BOS cycle (gates, slices, dashboard, multi-source ingestion) and extract once we have signal that the patterns generalize, than ship a half-generalized template and bake BOS's accidents into the contract.

---

## Current state (v0.4.0)

What ships with the plugin:

- **Eleven gates** (0–10), six-slice phase rhythm, three commands (`/canvas-to-code:start`, `:dashboard`, `:assets`).
- **Three skills** — `canvas-to-code-vocabulary` (mental model), `canvas-to-code-guardrails` (8 lint rules), `canvas-to-code-source-shapes` (flat vs iter).
- **Two source shapes** at Gate 0: flat (`review.html` + screenshots) and iter (`source-meta` v2 folder).
- **Seven subagents** — PM, auditor, extractor, mapper, data-binder, planner, reviewer — plus the post-merge cleanup hook.

What lives in BOS (not the plugin) today:

- **`paper-design` skill** — Paper.Design + Chrome MCP capture flow that emits iter folders. Encodes BOS's app shell (rail nav, brand colors, dev URL, artboard naming) directly in `shell-v1.html`.
- **`design-handoff` skill** — mediator between `paper-design` and `/canvas-to-code:start`. Carries the four-question "is this iter ready?" decision rules.
- **`.claude-design/<feature>/<subpage>/paper/iter-*/` folders** — the actual exploration material.

That split is current, not aspirational. The plan to move them sits in Phases 1 + 2 below.

---

## The three phases

### Phase 0 — Now (zero churn)

Dogfood. Don't move anything. Mark the intent.

**Done by:** existence of this roadmap. ✅

### Phase 1 — Soon (post v0.4.0 stabilization)

Refactor `paper-design` in BOS to read its BOS-specifics from a `.canvas-to-code/producer-config.yaml` instead of hard-coding them. The skill keeps living in BOS during this phase, but the BOS-specifics get pulled out of the skill body and into config. This is the prep step that makes Phase 2 a one-day rename.

Config shape (proposed):

```yaml
producers:
  paper-design:
    shell_template: ./brand/paper-shell.html
    brand_colors:
      bg: '#191919'
      fg: '#FFFAEE'
      accent: '#FE5102'
      border: '#2A2A2A'
    rail_nav:
      - { key: chat, label: 'Chat', icon: 'MessageSquare' }
      - { key: home, label: 'Home', icon: 'Home' }
      # ...
    artboard_naming: '{brand} {feature} Hub — {subpage} (iter-{n} {slug})'
    dev_url_base: 'http://127.0.0.1:3000'
```

**Acceptance criteria for Phase 1:**

- BOS's `paper-design` skill body contains zero hard-coded brand colors, rail-nav entries, or dev URLs.
- BOS's existing iters still capture correctly with no behavior change.
- A different consumer could theoretically use the skill by writing their own `producer-config.yaml` (we don't validate this in Phase 1 — only Phase 2).

### Phase 2 — Move-time (canvas-to-code goes public, or a second consumer signs up)

Extract `paper-design` and `design-handoff` from BOS into the plugin. BOS deletes its local copies and becomes a vanilla adopter.

**Target plugin structure after extraction:**

```
canvas-to-code/
  commands/                                # /canvas-to-code:start, :dashboard, :assets, :init
  agents/                                  # bridge agents
  skills/
    canvas-to-code-vocabulary.md
    canvas-to-code-guardrails.md
    canvas-to-code-source-shapes.md
    canvas-to-code-handoff.md              # was BOS's design-handoff (rename)
  producers/                               # NEW
    paper-design/
      SKILL.md                             # the generic producer skill
      templates/
        shell-default.html                 # generic, can be overridden
      README.md
    # future:
    # figma-design/
    # claude-design/
  templates/
    producer-config.example.yaml           # NEW
```

**BOS-side after the move:**

```
BOS/.canvas-to-code/producer-config.yaml   # BOS app shell config lives here
BOS/.canvas-to-code/templates/
  paper-shell.html                          # BOS-specific override
```

**Phase 2 triggers when either condition is met:**

1. canvas-to-code is being prepared for a public GitHub release (v0.6.0+ or v1.0.0).
2. A second consumer signs up and needs the producer skill.

Whichever comes first.

---

## What goes in the bundle when we extract

A non-exhaustive list of producer-and-consumer skills the plugin should ship as part of the public template:

| Skill                                              | Role                                       | Source today      | Bundle target                                |
| -------------------------------------------------- | ------------------------------------------ | ----------------- | -------------------------------------------- |
| `canvas-to-code-vocabulary`                        | Consumer mental model                      | Plugin ✅          | Plugin                                       |
| `canvas-to-code-guardrails`                        | Editor-time lint                           | Plugin ✅          | Plugin                                       |
| `canvas-to-code-source-shapes`                     | Consumer source reference                  | Plugin ✅          | Plugin                                       |
| `canvas-to-code-handoff` (was `design-handoff`)    | Mediator + decision rules                  | BOS today         | Plugin (Phase 2)                             |
| `paper-design` (producer)                          | Paper.Design + Chrome MCP capture          | BOS today         | Plugin → `producers/paper-design/` (Phase 2) |
| `claude-design` (producer)                         | Claude Design HTML export ingestion helper | Doesn't exist yet | Plugin (future)                              |
| `figma-design` (producer)                          | Figma → iter shape                         | Doesn't exist yet | Plugin (future)                              |
| `v0-lovable-design` (producer)                     | V0 / Lovable → iter shape                  | Doesn't exist yet | Plugin (future)                              |
| `canvas-to-code-producer-init` (meta-skill)        | Adjusts producer skills for a target repo  | Doesn't exist yet | Plugin (Phase 2; see below)                  |

The **producer slot is the extension point**. Anyone can ship a new producer skill that emits iter-shape source-meta v2; the bridge ingests it without learning the producer's specifics.

---

## A meta-skill: producer-init

When canvas-to-code goes public, the new-adopter experience needs to feel turnkey. The piece that makes that possible is a **producer-init meta-skill** — a skill that adjusts the producer skills for the target repository.

Working name: `canvas-to-code-producer-init`, invoked via `/canvas-to-code:init paper-design` (or similar).

**What it does:**

1. Reads the consumer's `app/` or equivalent route tree to detect the existing app shell (rail nav structure, page-shell layout).
2. Reads the consumer's design-token CSS or Tailwind config to extract brand colors.
3. Generates a starter `producer-config.yaml` with detected values plus TODO markers where it couldn't infer.
4. Captures the consumer's current app shell into a starter `shell-default.html` (Paper-MCP optional; falls back to a "manual override" template).
5. Prints a "what to fill in by hand" diff so the adopter knows what's left.

This is the skill that makes the second-consumer case go from a one-day setup to a one-command setup. It's the producer-skill analogue of `/canvas-to-code:start`'s Gate 0 picker.

**Phase target:** ships with Phase 2 (when the producer skills land in the plugin), not before — because it needs `producer-config.yaml` to exist as a contract first (Phase 1 establishes that).

---

## Out of scope (deliberately deferred)

| Deferred                                                          | Why                                                                                                                                                                  |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-feature concurrent bridge runs                              | One feature at a time is the right discipline. Adding parallelism before the single-feature flow is rock-solid courts pain.                                          |
| Producer skills for tools we haven't met yet                      | Specification-by-fantasy. Wait until we have a real adopter using Figma or V0 to design their producer skill.                                                        |
| Replacing flat shape with iter shape everywhere                   | Flat shape is fine for external tools (Claude Design, Figma export) — there's no producer skill emitting them from inside the consumer's codebase. Don't force the iter shape on shapes that don't benefit. |
| Auto-promoting from iter to PR                                    | The four-decision-rule gate in `design-handoff` exists precisely because automation here drops important signals. Never auto-promote.                                |
| Built-in design-token mapping (beyond `token-map.yaml`)           | Lives in the consumer's `.canvas-to-code/token-map.yaml`. The bridge stays generic; tokens are consumer-side.                                                        |
| Replacing CHANGELOG with this doc                                 | CHANGELOG is what shipped, ROADMAP is what's planned. Keep them separate.                                                                                            |

---

## Open questions

These are unresolved and we'd like input from anyone running the plugin:

1. **How configurable should rail-nav structure be in `producer-config.yaml`?** The current shell-v1 template hard-codes seven items. A different consumer might have 4 or 12. Should the schema be a flat list of `{key, label, icon}` or a richer tree (active states, collapse rules)?
2. **Should `producer-init` run automatically on `/canvas-to-code:start` first-run?** Or stay opt-in via `/canvas-to-code:init`?
3. **When `paper-design` lives in the plugin, should it gate on the Paper MCP being installed?** A clear "missing MCP" error vs silent fall-through.
4. **Multi-framework producer skills** — what does a `producer-config.yaml` look like for a non-Next.js consumer (e.g. Remix, SvelteKit, plain Vite + React)?

If you have opinions, open an issue.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code) · Currently dogfooded in [open-session/BOS-3.0](https://github.com/open-session/BOS-3.0).*

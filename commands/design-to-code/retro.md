---
description: "Run Gate 10, then PM-led conversational retro. Fills retro section, flips spike status to closed."
allowed-tools: Read, Write, Edit, Bash, Task
---

# /design-to-code:retro — Close out

Final gate + a short conversational retro. Captures learnings, flips the spike to `closed`, marks the feature `complete` in `status.json`.

## Prerequisites

- Swap PR merged.
- Feature branch merged to main.
- `bun run typecheck` + `bun run build` (or consumer-configured commands) green against main.

## What it does

### Gate 10 — Pre-retro

PM verifies the prerequisites above. If anything fails, suggests a remediation commit and exits.

### After Gate 10 passes

PM runs a short, conversational retro (~5 minutes). Five questions, lifted from the Brand Hub run's retro shape:

1. **What worked?** Patterns to reuse next time.
2. **Where did it break?** Friction points, gate misses, mid-slice surprises.
3. **What should we standardize?** New patterns worth lifting into the skill / a new gate / a new template.
4. **Cost/time** — approximate hours of Claude time, hours saved vs. building from scratch.
5. **Open follow-ups** — what didn't make it into v1, what got deferred.

## Output

1. Fills the Retro section of `docs/spikes/design-system/<YYYY-MM>/<YYYY-MM-DD>-<feature>-bridge.md` (or whatever path is in `status.json.specDocPath`) using `templates/retro-section.md`.
2. Flips the spike's frontmatter `status: open` → `closed` and sets `closed: <today>`.
3. Updates `status.json` with `phase: complete`, `completed_at`, gateLog entry for Gate 10.

## Failure modes

- Spike doc not found at `specDocPath` → PM asks for the correct path; offers to write a fresh retro section to a new doc.
- Typecheck/build fails on main → PM asks for a remediation commit first and exits.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

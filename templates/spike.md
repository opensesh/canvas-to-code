---
title: 'Spike: {{feature_title}} · Design-to-Code Bridge run'
status: open
audience: shared
owner: '{{owner_handle}}'
created: '{{YYYY-MM-DD}}'
related:
  - .claude-design/{{feature}}/review.html
  - .design-to-code/state/{{feature}}/status.json
---

# Spike: {{feature_title}} · Design-to-Code Bridge run

**Author:** {{owner_handle}} (with Claude)
**Primary reader:** anyone running a similar redesign next.
**Why now:** {{1-sentence motivation}}.

## TL;DR

- {{2-4 bullets summarising the design decisions and the slice plan}}.
- Parallel route at `{{target_route}}-hifi` for slices 1–{{n-1}}; final swap in slice {{n}}.
- {{n_slices}} PRs, ~{{total_loc}} LOC end-to-end.
- Source of truth: [.claude-design/{{feature}}/](../../../../.claude-design/{{feature}}/) (HTML export + screenshots).

## 1. Context & scope

{{lift from plan.md Context}}

**In scope (v1):**

- {{bullets}}

**Out of scope (v1):**

- {{bullets}}

## 2. Methodology

{{how the HTML was decoded, where the data hooks live, which existing primitives compose the new design}}

## 3. Recommendation (locked)

**{{one-line headline}}.** Full plan at `.design-to-code/state/{{feature}}/plan.md`. {{n_slices}} PRs:

| PR | Title | ~LOC | Verification |
|---|---|---|---|
{{rows from status.json.slices[]}}

## 4. Open questions (track during execution)

{{open considerations}}

## 5. Retro (filled on the final PR by /canvas-to-code:start --gate 10)

### What worked

{{filled at retro}}

### Where it broke

{{filled at retro}}

### What should be standardized

{{filled at retro}}

### Cost / time

{{filled at retro}}

### Open follow-ups

{{filled at retro}}

## 6. Evidence

{{table of claims + line citations to .claude-design/, components/, hooks/}}

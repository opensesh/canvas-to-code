# {{feature_title}}

## Context

{{2-3 paragraphs from status.json.scope and audit.md. What's being built, why now, how it fits the codebase, what the design source looks like, what's preserved vs replaced.}}

## Decisions (locked in)

- **Source of truth**: `.claude-design/{{feature}}/review.html`. Screenshots in `.claude-design/{{feature}}/screenshots/`.
- **Routing**: parallel route `{{target_route}}-hifi` for slices 1–{{n-1}}, swap to `{{target_route}}` in slice {{n}}.
- **Page header**: {{retained as-is | replaced — describe new chrome}}.
- **Git flow**: feature branch `{{feature}}` off main. One PR per slice into the feature branch. Final PR merges feature → main.
- **No new deps**, Tailwind + Style 2 mapped classes only, no `bg-[var(...)]` literals, no raw hex in JSX.
- **{{key feature-specific decisions}}**: {{e.g. "Drop /brand-hub/textures and /brand-hub/resources on the swap PR"}}.

## Component plan

Legend: **base** = vendor primitive as-is · **ds** = thin wrapper or token-mapping · **custom-shared** = cross-page · **custom-page** = page-scoped · **net-new** = no existing primitive.

| Element | Tier | Location | New or reused? | Confidence | Notes |
|---|---|---|---|---|---|
{{rows from componentMap.units[]}}

**Aggregate** ({{totalUnits}} units):
- base: {{byTier.base.reused}} reused / {{byTier.base.new}} new
- ds: {{byTier.ds.reused}} reused / {{byTier.ds.new}} new
- custom-shared: {{byTier.custom-shared.reused}} reused / {{byTier.custom-shared.new}} new
- custom-page: {{byTier.custom-page.new}} new
- net-new: {{byTier.net-new.new}} new

Icon gaps to resolve: {{iconGaps.join(', ')}}

## Token map

Existing entries used:
{{token-map.yaml entries the mapper matched against}}

New entries proposed (review before adding to `.design-to-code/token-map.yaml`):
{{tokenMapDelta entries}}

## Data plan

{{hooks/services/mock seeds. Type signatures for new hooks. Existing hooks reused.}}

## PR slicing ({{n_slices}} PRs into feature branch `{{feature}}`)

### PR 1 — {{slice 1 title}}

**~{{loc}} LOC** · `{{feature}}: {{slice 1 commit subject}}`

Files:
{{slice[0].files}}

Verify:
{{slice[0].verify}}

### PR 2 — {{slice 2 title}}

...

## Verification

- Visual diff against `.claude-design/{{feature}}/screenshots/01-{{feature}}-overview.png` (designer-side or Playwright).
- `{{config.commands.typecheck}}` clean.
- `{{config.commands.build}}` clean.
- `{{config.commands.lint}}` clean.
- Per-slice Playwright captures: `tests/visual/baselines/{{feature}}/0{{n}}-{{slice slug}}.png`.

## Out of scope

{{deferred items}}

## Critical files

Read before starting:
{{files the engineer should review}}

## Open considerations

{{questions the planner couldn't resolve; engineer answers inline}}

## Retro deliverable

To be filled by `/canvas-to-code:start --gate 10` at the end. Empty stub at plan time.

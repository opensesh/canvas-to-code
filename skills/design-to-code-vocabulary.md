---
name: design-to-code-vocabulary
description: Vocabulary and conceptual model for the Design-to-Code Bridge — base/ds/custom tier model, slice rhythm, the eleven gates, parallel-route pattern. Auto-activates when any /design-to-code:* command is in flight or when the user uses keywords like "tier", "slice", "bridge" in a design-to-code context.
---

# Design-to-Code Vocabulary

Shared mental model for designers, engineers, and reviewers working through a Design-to-Code Bridge handoff.

## When to surface

- Any `/design-to-code:*` command is in flight.
- The user mentions `tier`, `base`, `ds`, `custom-shared`, `custom-page`, `net-new`, `slice`, `swap`, `bridge`, `keystone`, or one of the gate names.

## The component tier model

Five tiers, ordered cheapest → most expensive to introduce.

| Tier | Where it lives (BOS default) | What it is |
|---|---|---|
| **base** | `components/base/` | Vendor primitive used as-is (e.g. UUI's `Tabs`, `Button`, `Avatar`). Reusing a base unit is free. |
| **ds** | `components/ds/` | A thin wrapper, formula spec, or token-mapping over a base. Rare; only when a brand decision can't be expressed in CSS variables alone. |
| **custom-shared** | `components/custom/shared/<category>/` | Cross-page composition (e.g. `PillarCard` used by Brand Hub + future surfaces). Worth building once; every later feature reuses it. |
| **custom-page** | `components/custom/pages/<route>/` | Page-scoped composition (e.g. `OverviewBlock` for `/brand-hub` only). Cheap, narrow scope. |
| **net-new** | inline or under `custom/shared/branding/provider-icons/` | No existing primitive covers it. Most expensive. Flag for icon-gaps or arbitrary-value Tailwind. |

The mapper's job is to push every visual unit as far up this stack as possible — reusing a `base` primitive is always cheaper than building a `custom-shared`.

## The slice rhythm

Default phase rhythm for a redesign of a working page:

```
scaffold → chrome → cards → wire data → secondary surface → swap
   PR 1     PR 2    PR 3      PR 4          PR 5            PR 6
  150 LOC  250 LOC 450 LOC   250 LOC       550 LOC         150 LOC
```

- **scaffold** — parallel route, the design-source folder, placeholder pages.
- **chrome** — top nav, overview block, layout shell.
- **cards** — the main grid / list with **mock data**.
- **wire data** — swap mocks for real hooks.
- **secondary surface** — secondary pages (e.g. Version History).
- **swap** — the cheap-to-revert final PR. Parallel route → production route. Drop dead routes.

LOC budgets are guidelines, not laws. Mapper proposes splits when a slice exceeds `slice_loc_budget` (default 550).

## The eleven gates

| # | Name | Owner | Failure mode |
|---|---|---|---|
| 0 | Intake | PM agent | Answer "later" → save state, exit cleanly. |
| 1 | Materials present | PM | HTML + ≥1 screenshot required. |
| 2 | DS-alignment of source | PM | Warn-only. Records translation cost. |
| 3 | Target surface audit | Auditor | Route doesn't exist + `isExistingRoute=true` → confirm. |
| 4 | Scope confirmation | PM | Unresolved questions block. |
| 5 | **Component mapping** ◆ | Mapper | Low-confidence rows block until acknowledged. |
| 6 | Data binding | Data binder | Low-confidence bindings (ambiguous page, missing service signal) block until resolved. |
| 7 | Slice plan | PM / Planner | Slice >550 LOC → propose split. Mock/schema/type files allocated per slice. |
| 8 | Pre-slice | PM | Branch / working-tree checks. |
| 9 | Pre-swap | PM | Behaviour-port checklist unticked. |
| 10 | Pre-retro | PM | Typecheck/build failing → remediate first. |

Gate 5 is the keystone — the artefact that earns the bridge its keep. Every visual unit categorized; every hex mapped; every icon gap flagged. Gate 6 extends it: every unit also gets a clear data source (backend / mock / none) so designers and developers iterate against the same contract.

## The parallel-route pattern

For "redesign a working page" features. Default for the bridge.

1. New work lives at `<route>-hifi` (or `<route>-redesign`).
2. Existing route untouched until the final swap.
3. Swap PR is small (≤200 LOC). Fully reversible.
4. Users never see a broken state.

Use it for any redesign of a working surface. Skip it for greenfield (just build at the real route).

## The mock-first-then-real-data pattern

1. Build the visual shell with `MOCK_X` constants. Type the mock the same way the real hook will return data.
2. Land the visual contract in its own PR.
3. Swap mock for the real hook in the next PR — no layout work.

The mock acts as a typed spec for the hook output. This pattern saves ~1 hour of "did I match the design" back-and-forth per slice.

## Single-file dispatchers

When a component has many small variants that differ in content (e.g. eight pillar previews), prefer one file with a `kind` prop dispatch over eight separate files:

```tsx
// PillarPreview.tsx
export function PillarPreview({ kind, ...props }: Props) {
  if (kind === 'logo') return <PreviewLogo {...props} />;
  if (kind === 'colors') return <PreviewColors {...props} />;
  // ...
}

function PreviewLogo(props: ...) { return <div {...devProps('PreviewLogo')}>...</div>; }
function PreviewColors(props: ...) { return <div {...devProps('PreviewColors')}>...</div>; }
```

Each internal sub-component gets its own `devProps`. One shared story file covers all cases. Saves files, keeps locality high.

---

*Plugin: [design-to-code-bridge](https://github.com/opensesh/design-to-code-bridge)*

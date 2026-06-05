---
name: canvas-to-code-guardrails
description: Editor-time lint reminders for projects using Canvas-to-Code. Auto-activates when the repo contains `.claude-design/` and the user is editing files under `app/`, `components/`, `lib/`, or `hooks/`.
---

# Canvas-to-Code Guardrails

You are editing in a project that uses the Canvas-to-Code plugin. Apply these nine reminders **inline** as you write or edit code (rules 1–8) or design sources (rule 9). Severity is consumer-controlled via `.canvas-to-code/config.yaml.guardrail_severity` (default `warn`) and `guardrail_overrides`.

## When to apply

- **Rules 1–8 (code edits):** the repo contains a `.claude-design/` folder AND you are editing a file under `app/`, `components/`, `lib/`, or `hooks/`. Or the user explicitly invokes a `/canvas-to-code:*` command. Skip for non-component code (config files, docs, tests, scripts).
- **Rule 9 (source-meta compliance):** you are editing a `source-meta.yaml` under `.claude-design/<feature>/[<subpage>/<tool>/iter-*/]`. Fires on producer-emitted iter folders specifically.

## The nine rules

### 1. `devProps` naming exactness

The function name and the `devProps` string must match exactly.

```tsx
// ✅
import { devProps } from '@/lib/utils/dev-props';
export function PillarCard({ ... }: Props) {
  return <div {...devProps('PillarCard')} className="...">...</div>;
}

// ❌ — name mismatch
export function PillarCard({ ... }: Props) {
  return <div {...devProps('Pillar')} className="...">...</div>;
}
```

Conditional returns get devProps on **both** branches. Fragments don't count; apply to the first meaningful DOM child inside.

### 2. No `border-2` or thicker

```tsx
// ✅
<div className="border border-border-secondary" />

// ❌
<div className="border-2 border-border-primary" />
```

Containers use `border` (1px) + `border-border-secondary`. Brand-colored borders are forbidden at scale.

### 3. No `ring-2` — use the BOS focus pattern

```tsx
// ✅
<button className="focus-visible:ring-1 focus-visible:shadow-focus-ring focus-visible:ring-ring-brand" />

// ❌
<button className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500/30" />
```

### 4. No raw hex in JSX

```tsx
// ✅
<div className="bg-bg-primary-solid text-fg-white" />

// ❌
<div style={{ background: '#0B0B0B' }} />
<div className="bg-[#FE5102]" />
```

Exception: swatch-data structures (e.g. `colorHexes = [{ hex: '#FE5102', name: 'Aperol' }]`) are allowed because they're **data**, not styling.

### 5. Tailwind Style 2 mapped classes only

```tsx
// ✅
<div className="bg-bg-primary text-fg-primary border-border-secondary" />

// ❌ — bracket syntax breaks opacity modifiers + loses IntelliSense
<div className="bg-[var(--bg-primary)] text-[var(--fg-primary)]" />

// ❌ — silently fails (opacity modifier doesn't compose with CSS-var brackets)
<div className="bg-[var(--bg-secondary)]/30" />
```

### 6. No array-index keys

```tsx
// ✅
{items.map((item) => <Card key={item.id} {...item} />)}

// ❌
{items.map((item, i) => <Card key={i} {...item} />)}
```

### 7. Vendor primitive first

Before building a custom component, search the consumer's primitive layer (default `components/base/`) for an existing one. If a primitive exists, use it; if a near-match exists, prefer composing over reimplementing.

```tsx
// ✅
import { Tabs } from '@/components/base/application/tabs/tabs';
<Tabs type="underline" size="md" ... />

// ❌ — reimplementing a primitive
<div className="flex gap-4 border-b ...">
  {tabs.map(t => <button className="...">{t.label}</button>)}
</div>
```

### 8. Pages never import `base` (when enabled)

Gated by `.canvas-to-code/config.yaml.tier_boundaries.pages_import_base` (default `true` = off). When set to
`false`, page / `custom-page` files compose `custom` / `ds` components — they must not import `base/`
primitives directly. `base` is always wrapped by a `custom-shared` or `ds` component.

```tsx
// ✅ — page composes a custom wrapper
import { PrimaryButton } from '@/shared/components/custom/shared/buttons/button';
<PrimaryButton>Get started</PrimaryButton>

// ❌ — page reaches straight into base
import { Button } from '@/shared/components/base/buttons/button';
<Button>Get started</Button>
```

Only `base/`, `ds/`, and `custom/shared/` files may import from `base/`. If a needed wrapper doesn't exist,
create it in `custom/shared/<category>/` and import that from the page.

### 9. source-meta v2 compliance (iter folders)

When editing a `source-meta.yaml` inside an iter folder (`.claude-design/<feature>/<subpage>/<tool>/iter-NN-<slug>/`), the seven v2 fields are non-negotiable.

```yaml
# ✅ — bridge-ready
metaVersion: 2
source: paper
feature: brand-hub
subpage: colors
targetRoute: /brand-hub/colors
jsxPath: jsx/brand-hub-colors.tsx
primaryScreenshot: screenshots/01-baseline.png
```

```yaml
# ❌ — missing metaVersion (Gate 1 will reject)
source: paper
feature: brand-hub
```

```yaml
# ❌ — `source: paper` in a flat-shape feature root (Paper outputs should be iter-shaped)
# at .claude-design/brand-hub/source-meta.yaml — no iter folder
source: paper
```

Variants to flag inline:

- `jsxPath` set but the referenced file doesn't exist
- `primaryScreenshot` set but the referenced file doesn't exist
- `metaVersion` set to anything other than `2` (v1 iters need backfill; v3+ doesn't exist yet)
- `feature` or `subpage` value doesn't match the iter's folder path (e.g. iter at `brand-hub/colors/paper/iter-01/` but source-meta says `feature: brain`)
- All seven required fields present but the user is hand-editing without going through the producer skill — recommend re-running the producer (e.g. `/paper-design`) instead, so JSX + screenshots regenerate consistently

For deeper readiness checks (visual stability, route decision, in-flight bridge run), escalate to the producer skill's inspect workflow — e.g. BOS's `/paper-design inspect` surfaces Bridge-ready vs Bridge-pending across all iters in the repo.

The full v2 contract lives in the producer: [BOS paper-design SKILL.md § Source-meta v2](https://github.com/open-session/BOS-3.0/blob/feat/frontend-only-rewrite/.claude/skills/paper-design/SKILL.md#source-meta-v2-schema-the-bridge-contract). The bridge-side reference lives in [`canvas-to-code-source-shapes`](./canvas-to-code-source-shapes.md).

## How to surface a violation

When you spot a violation, surface it like this in your edit explanation:

> *Note: this introduces `border-2` (guardrail 2). Replacing with `border border-border-secondary`. If this is intentional, the consumer can override per-rule via `.canvas-to-code/config.yaml.guardrail_overrides`.*

Do not silently rewrite the user's intent — flag and correct. If the user pushes back, accept their choice and move on. For rule 9, propose a diff but never auto-edit source-meta.yaml — the producer skill owns that file's content.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

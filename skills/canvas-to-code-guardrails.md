---
name: canvas-to-code-guardrails
description: Editor-time lint reminders for projects using Canvas-to-Code. Auto-activates when the repo contains `.claude-design/` and the user is editing files under `app/`, `components/`, `lib/`, or `hooks/`.
---

# Canvas-to-Code Guardrails

You are editing in a project that uses the Canvas-to-Code plugin. Apply these seven editor-time reminders **inline** as you write or edit code. Severity is consumer-controlled via `.design-to-code/config.yaml.guardrail_severity` (default `warn`) and `guardrail_overrides`.

## When to apply

- The repo contains a `.claude-design/` folder (committed design sources).
- You are editing a file under `app/`, `components/`, `lib/`, or `hooks/`.
- Or: the user explicitly invokes a `/canvas-to-code:*` command.

Skip these reminders for non-component code (config files, docs, tests, scripts).

## The seven rules

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

## How to surface a violation

When you spot one of the seven, surface it like this in your edit explanation:

> *Note: this introduces `border-2` (guardrail 2). Replacing with `border border-border-secondary`. If this is intentional, the consumer can override per-rule via `.design-to-code/config.yaml.guardrail_overrides`.*

Do not silently rewrite the user's intent — flag and correct. If the user pushes back, accept their choice and move on.

---

*Plugin: [canvas-to-code](https://github.com/opensesh/canvas-to-code)*

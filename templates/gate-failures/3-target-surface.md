# Gate 3 — Target surface audit failed

I couldn't find the target route in the codebase.

**Declared target:** `{{target_route}}`
**`isExistingRoute`:** `true`

I searched:
- `app/**/{{target_route_normalized}}/page.tsx`
- `pages/**/{{target_route_normalized}}.tsx`
- (Next.js route groups; React Router; standard layouts)

Did you mean one of these?

{{suggestions — single-letter Levenshtein-distance variants found in the codebase}}

Options:

1. **Correct the spelling** — re-run `/canvas-to-code:start --feature {{feature}}` and update the route.
2. **Switch to greenfield** — set `isExistingRoute: false` in `.canvas-to-code/state/{{feature}}/status.json` and I'll continue with no audit.
3. **Cancel** — `rm -rf .canvas-to-code/state/{{feature}}/` to discard intake state.

# {{feature}}: final swap (PR {{n}}/{{total}})

## Summary

Swap the {{target_route}}-hifi parallel route into {{target_route}}. {{1 sentence on what's preserved and what's dropped.}}

## Swap files

- `app/(dashboard)/{{target_route}}/page.tsx` — replace with the content from `app/(dashboard)/{{target_route}}-hifi/page.tsx`.
- Remove `app/(dashboard)/{{target_route}}-hifi/` (the parallel route).

## Removed routes

{{from status.json.scope.routes_dropped, with explicit "no bookmarks to protect" confirmation per route}}

## Behaviour ports verified

{{from status.json.scope.behavior_ports, ticked}}

- [x] {{behavior 1}}
- [x] {{behavior 2}}

## Retro highlights

{{empty until /canvas-to-code:start --gate 10 fills it; can also be left to the spike doc}}

## Test plan

- [ ] `{{target_route}}` renders the redesign
- [ ] Sub-routes still 200: {{list of sub-routes from audit.md}}
- [ ] Dropped routes 404: {{list}}
- [ ] {{config.commands.typecheck}} clean
- [ ] {{config.commands.build}} clean

---

Final swap for the {{feature}} redesign via [canvas-to-code](https://github.com/opensesh/canvas-to-code). Cheap to revert — `git revert {{commit-sha}}` restores the prior page.

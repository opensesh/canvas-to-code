# {{feature}}: {{slice_title}} (PR {{n}}/{{total}})

## Summary

{{1-2 sentences. What this slice delivers and why.}}

## New files

{{from slices[n].files where action === 'create'}}

## Modified files

{{from slices[n].files where action === 'modify'}}

## Test plan

{{slices[n].verify, as a markdown checklist}}

- [ ] {{verify step 1}}
- [ ] {{verify step 2}}

## Out of scope

{{anything intentionally not in this slice}}

---

Part of the {{feature}} redesign via [canvas-to-code](https://github.com/opensesh/canvas-to-code). Plan: `.design-to-code/state/{{feature}}/plan.md` · Spike: `docs/spikes/design-system/{{YYYY-MM}}/{{YYYY-MM-DD}}-{{feature}}-bridge.md`.

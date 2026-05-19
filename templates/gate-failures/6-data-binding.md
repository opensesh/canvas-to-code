# Gate 6 — Data binding needs decisions

I've classified {{totalUnits}} units by data source. {{rollup.backend}} are wired to existing services, {{rollup.mock}} need mocks, {{rollup.none}} are decorative. {{lowConfidenceCount}} need an explicit decision before I can advance to the slice plan.

## Low-confidence bindings ({{lowConfidenceCount}})

{{for each entry with confidence: low:}}

- **{{entry.unitLabel}}** — proposed `{{entry.dataSource}}`, page `{{entry.page}}`, subpage `{{entry.subpage || "—"}}`.
  - *Reason for low confidence:* {{entry.notes}}
  - **Decide:**
    - Acknowledge (proceed with this binding as-is).
    - Override to `backend` and tell me which service in `lib/services/`.
    - Override to `mock` and tell me the page/subpage.
    - Override to `none` (decorative — no data needed).

## Page/subpage conflicts

{{for each entry with ambiguous page inference:}}

- **{{entry.unitLabel}}** renders on multiple pages: {{candidate_pages.join(', ')}}.
  - **Decide:** which page owns the canonical mock? Or split into per-page mocks? Or bind at the leaf-case level (mark this dispatcher `none`)?

## Backend overrides

{{for each entry where dataSource: mock but the engineer might prefer backend:}}

- **{{entry.unitLabel}}** — I didn't find a service or hook, so I proposed a mock at `{{entry.mockFile}}`.
  - If you'd rather wire it to an existing service, tell me which one — I'll flip the entry to `dataSource: backend` and skip the mock files.
  - If you'd rather build a new service before continuing, defer this unit — I'll mark it `none` for now and the slice plan will note the dependency.

## Mock files queued ({{rollup.mock}} × 3 = {{rollup.mock * 3}} files)

```
{{for each entry with dataSource: mock:}}
data/{{entry.page}}/{{entry.subpage}}.mock.json
data/{{entry.page}}/{{entry.subpage}}.schema.json
types/mocks/{{entry.page}}-{{entry.subpage}}.ts
```

These get written by the planner into the slice that owns each unit's `targetPath`. They are the **shared contract** for designer/developer iteration and will inform the production database schema — review the schemas before approving.

Once all of the above are resolved, I'll advance to Gate 7 (slice plan).

# Gate 7 — Slice plan needs review

I've drafted a slice plan from the component map. One or more slices fall outside guidance:

{{specific issue — examples:}}

- **Slice {{n}} is {{loc}} LOC** — that's over the configured `slice_loc_budget: {{budget}}`. Recommended split:
  - Slice {{n}}a: {{title_a}} (~{{loc_a}} LOC)
  - Slice {{n}}b: {{title_b}} (~{{loc_b}} LOC)

- **Slice {{n}} has no clear verification step.** Without a verify checklist, the PR reviewer can't validate. Suggested steps from the component map: {{suggested_verify}}.

- **Two slices touch the same file** ({{shared_file}}). Either merge them or order them sequentially in `slices[]`.

Approve the proposed splits / adjustments and I'll write them into `status.json.slices[]`. Or override with your own slice breakdown — just give me the titles, files, and LOC budgets per slice.

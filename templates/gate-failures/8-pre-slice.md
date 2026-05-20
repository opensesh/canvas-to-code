# Gate 8 — Pre-slice check failed

Can't run slice {{n}} until the working state matches the plan.

{{specific failure — examples:}}

## Branch mismatch

- **Expected:** `{{expected_branch}}` (pattern from `config.yaml.slice_branch_pattern`).
- **Current:** `{{current_branch}}`.

Switch branches: `git switch -c {{expected_branch}}` (if new) or `git switch {{expected_branch}}`.

## Working tree dirty with out-of-slice files

These files are staged or modified but not declared in `slices[{{n}}].files`:

```
{{files}}
```

Either:
- Commit them under their own slice before starting this one.
- `git stash` if they belong elsewhere.
- Update `slices[{{n}}].files` in the plan if you intend to ship them in this slice.

## Prior slice not merged

Slice {{n-1}} ({{prev_title}}) has `merged: false`. Either merge it first, or override by setting `slices[{{n-1}}].merged: true` manually if you've already verified the merge.

## Plan drift

The plan doc's slice {{n}} spec doesn't match `status.json.slices[{{n}}]`. Run `/canvas-to-code:start --feature {{feature}} --gate 5` to refresh the mapping, or hand-resolve the diff.

Re-run `/canvas-to-code:start --feature {{feature}} --gate 8` after resolving.

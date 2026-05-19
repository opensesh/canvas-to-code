# Gate 10 — Pre-retro check failed

Need a clean main before we close out.

{{specific failure — examples:}}

## Build / typecheck failing on main

```
{{command_output}}
```

Push a fix commit, then re-run `/design-to-code:retro`.

## Spike doc missing

`status.json.specDocPath` points at `{{spec_doc_path}}`, but that file doesn't exist. Either:
- Find the spike (probably moved during a rename) and update `specDocPath`.
- Write a fresh spike from `templates/spike.md` — I'll fill the retro section.

## Feature branch not merged

`status.featureBranch` is still alive at origin. Did the swap PR merge? If yes, delete the feature branch:

```
git push origin --delete {{featureBranch}}
git branch -D {{featureBranch}}
```

Re-run `/design-to-code:retro` after resolving. This gate is `warn` by default — you can also skip it if your project doesn't enforce green CI on main.

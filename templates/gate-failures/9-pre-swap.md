# Gate 9 — Pre-swap check failed

Can't draft the swap PR until all the upstream work is verified.

{{specific failure — examples:}}

## Slice {{n}} not merged

```
{{slices_not_merged_table}}
```

Merge them first, then re-run `/design-to-code:swap`.

## Behaviour ports not verified

The scope (Gate 4) declared these behaviors must survive the swap:

```
{{behavior_ports_unchecked}}
```

For each, either:
- Mark as ported (cite the file:line that handles it in the redesign).
- Mark as intentionally dropped (with confirmation that no users will miss it).

## Parallel route doesn't 200

`/{{target_route}}-hifi` failed the smoke check. Run it manually:

```
{{config.commands.build}}
# then visit /{{target_route}}-hifi
```

## Sub-routes regressed

These sub-routes used to 200 but now don't:

```
{{regressed_subroutes}}
```

Likely caused by a route-group change in one of the slices. Inspect the slice that touched routing.

Re-run `/design-to-code:swap` after resolving.

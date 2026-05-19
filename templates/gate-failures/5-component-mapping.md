# Gate 5 — Component mapping needs acknowledgements

Mapper produced {{totalUnits}} units. {{lowConfidenceCount}} need explicit decisions before I can lock the slice plan.

## Low-confidence rows ({{lowConfidenceCount}})

{{for each unit with confidence: low:}}

- **{{unit.label}}** — proposed tier `{{unit.tier}}`, target `{{unit.target}}`.
  - *Reason for low confidence:* {{unit.notes}}
  - **Decide:** acknowledge (proceed with this mapping), reclassify (tell me a different tier/target), or drop from v1.

## Net-new rows ({{netNewCount}})

{{for each unit with tier: net-new:}}

- **{{unit.label}}** — proposed as `net-new`.
  - *Why:* {{unit.notes}}
  - **Decide:** acknowledge (build as a one-off), promote to `custom-shared` (worth building reusable), or drop from v1.

## Icon gaps ({{iconGaps.length}})

{{iconGaps.join(', ')}} — neither in the vendor icon library nor in your custom `provider-icons/`.

For each: inline SVG (cheapest, 1-slice fix), batch-add to `provider-icons/` (worth doing if used in 2+ features), or skip in v1.

## Token-map delta

{{tokenMapDelta.length}} new entries proposed for `.design-to-code/token-map.yaml`:

{{for each tokenMapDelta entry: hex → proposed class with note}}

**Decide:** approve (I'll write the entries to `token-map.yaml` on next save), edit (correct any wrong proposals), or skip (the engineer handles raw hex per slice — not recommended).

Once all of the above are resolved, I'll advance to Gate 6 (data binding).

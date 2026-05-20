# Gate 4 — Scope unresolved

I can't lock the slice plan until scope is clear. Outstanding questions:

{{open scope questions — e.g.:}}

- **Routes to drop:** `/{{target_route}}/textures` and `/{{target_route}}/resources` — any bookmarks to protect? If yes, do they need a 404 → 301 redirect to the new home?
- **Page header & nav:** retain the existing `PageHeader` + `BrandHubPageMeta` toolbar, or replace with the design's new header actions (history dot / download / Connect to Figma)?
- **Behaviors to port:** the audit found `OnboardingWizard.trigger()` on the existing page. Port or drop?
- **Sub-routes touched vs untouched:** the audit found {{n}} sub-routes. Are any in scope for this redesign?

Answer each, then I'll advance to Gate 5 (component mapping).

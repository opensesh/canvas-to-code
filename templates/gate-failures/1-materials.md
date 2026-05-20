# Gate 1 — Materials missing

I can't proceed without **both** an HTML export and at least one screenshot.

## What I'm looking for in `.claude-design/<feature>/`

- `review.html` — the design export.
- `screenshots/01-*.png` — at least one PNG, numerically prefixed.

## Cheapest capture per design tool

### Claude Design
- File → Download → HTML export → drop into `.claude-design/<feature>/review.html`.
- Cmd+Shift+4 over the design canvas → save into `.claude-design/<feature>/screenshots/01-<descriptive-name>.png`.

### Figma
- Frame → right-click → Copy/Paste as → HTML/CSS → save into `.claude-design/<feature>/review.html`.
- Frame → Export → 2x PNG → save into `screenshots/`.

### V0 / Lovable
- Download the generated `.tsx` and rename to `review.html` (keep the `.html` suffix; the discriminator handles the actual content).
- Screenshot the live preview.

### Webflow
- Publish → Export Code (ZIP) → save the `index.html` as `review.html`.
- Screenshot the live URL.

### No design tool / screenshot-only
- Skip `review.html` entirely.
- Drop one or more PNGs into `screenshots/`.
- Set `source: screenshot-only` in `source-meta.yaml`.

Re-run `/canvas-to-code:start` when materials are ready — I'll pick up at Gate 1.

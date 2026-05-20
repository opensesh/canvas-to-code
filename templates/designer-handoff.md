:wave: Hey {{engineer_handle}} — handoff for *{{feature_title}}*.

**Source folder:** `.claude-design/{{feature}}/`
- `review.html` — HTML export from {{design_tool}}
- `screenshots/`:
  - `01-{{feature}}-overview.png`
  - `02-{{feature}}-detail.png` (if more)
- `source-meta.yaml` — declares source tool + export date

**Target route:** `{{target_route}}` ({{existing | greenfield}})

**Special notes:**
- {{anything Claude should know that isn't visible in the export — animations, hover states, "this card has a glow that didn't make it into the HTML"}}
- {{any sub-routes or behaviors that must be preserved}}
- {{any routes intentionally being dropped}}

**Run when ready:**
```
/canvas-to-code:start
```

(The PM agent will pick up `.claude-design/{{feature}}/` automatically.)

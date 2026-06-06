---
description: "Pull the latest Canvas-to-Code into this repo — refreshes the plugin cache, even when the version field didn't change."
allowed-tools: Read, Bash
argument-hint: "[--check] [--force]"
---

# /canvas-to-code:update — Bring this repo up to the latest plugin

Run this from any consumer repo (e.g. `BOS-Mono/frontend`) to update the installed Canvas-to-Code plugin to the latest on `opensesh/canvas-to-code@main`.

## Why this exists

Claude Code's built-in `/plugin update canvas-to-code` keys off the `version` field in `.claude-plugin/plugin.json`. When a release ships docs/test/agent-prompt changes **without** a version bump (e.g. PRs #3/#4 both stayed at `0.4.0`), `/plugin update` **silently no-ops** and the consumer keeps running stale agent prompts — confirmed gotcha, tracked in issue #2.

This command updates by **git SHA**, not version, so it always pulls the real `main`. The plugin's live files *are* the marketplace clone at `~/.claude/plugins/marketplaces/canvas-to-code-marketplace`, so a fast-forward of that clone *is* the update.

## Flags

| Flag | Behavior |
|---|---|
| _(none)_ | Check, then update the cache to latest `main` if behind. Reports the commit delta. |
| `--check` | **Dry run.** Report local vs. remote version + SHA and how many commits behind. Changes nothing. |
| `--force` | Hard-refresh the cache even if SHAs already match (repairs a dirty/diverged cache). |

## Procedure

Run these steps with Bash. Define the cache path once:

```bash
CACHE="$HOME/.claude/plugins/marketplaces/canvas-to-code-marketplace"
REPO="opensesh/canvas-to-code"
```

### 1. Preconditions

```bash
# Marketplace must be installed. If the cache is missing, stop and tell the user to run:
#   /plugin marketplace add opensesh/canvas-to-code
#   /plugin install canvas-to-code@canvas-to-code-marketplace
test -d "$CACHE/.git" || { echo "NOT_INSTALLED"; exit 0; }
gh auth status >/dev/null 2>&1 || echo "WARN: gh not authenticated — falling back to git ls-remote"
```

### 2. Read local + remote state

```bash
LOCAL_SHA=$(git -C "$CACHE" rev-parse HEAD)
LOCAL_VER=$(python3 -c "import json,sys;print(json.load(open('$CACHE/.claude-plugin/plugin.json'))['version'])")

git -C "$CACHE" fetch --quiet origin main
REMOTE_SHA=$(git -C "$CACHE" rev-parse origin/main)
REMOTE_VER=$(git -C "$CACHE" show origin/main:.claude-plugin/plugin.json | python3 -c "import json,sys;print(json.load(sys.stdin)['version'])")

BEHIND=$(git -C "$CACHE" rev-list --count "$LOCAL_SHA..$REMOTE_SHA")
```

Report a table: `local ver/sha`, `remote ver/sha`, `commits behind`. Flag the **version no-op trap** explicitly when `LOCAL_VER == REMOTE_VER` but `LOCAL_SHA != REMOTE_SHA` — that's the case `/plugin update` would miss.

### 3. Decide

- `BEHIND == 0` and no `--force` → **already current.** Print the SHA and stop.
- `--check` → print the delta below and stop (never mutate).
- otherwise → proceed to update.

### 4. Update (fast-forward the cache)

```bash
# Show what's coming first
git -C "$CACHE" --no-pager log --oneline "$LOCAL_SHA..$REMOTE_SHA"

# Fast-forward; if the cache has local cruft, --force resets hard
if [ "$1" = "--force" ]; then
  git -C "$CACHE" reset --hard origin/main
else
  git -C "$CACHE" merge --ff-only origin/main
fi
```

If `merge --ff-only` fails (cache diverged), tell the user to re-run with `--force`.

### 5. Verify + report

```bash
git -C "$CACHE" rev-parse --short HEAD   # must equal short REMOTE_SHA
```

Then summarize for the user:
- Old → new version and short SHA.
- The one-line commit log of what landed (from step 4).
- **Reload note:** plugin files are read at session start. Tell the user to **restart the Claude Code session** (or run `/plugin` → reload) for the refreshed agents/skills to take effect in this repo.

## Notes for monorepo / submodule consumers

- The plugin is installed **per machine**, not per repo — this command updates it for every consumer at once. Run it from anywhere; `BOS-Mono` and other repos pick up the same refreshed cache.
- Canvas-to-Code still expects to **run from the project root** that owns `.claude-design/` (BOS runs from `frontend/`). Updating the plugin doesn't change where you invoke `/canvas-to-code:start`.

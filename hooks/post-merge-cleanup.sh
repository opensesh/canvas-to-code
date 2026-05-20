#!/usr/bin/env bash
# post-merge-cleanup.sh — opt-in post-merge hook for Canvas-to-Code.
#
# Runs after a successful merge. Cleans up slice branches and worktrees once
# their PR has merged. Lifts the pattern from KARIMO's branch lifecycle.
#
# Behaviour:
#   1. If we just merged a slice PR (head ref matches <feature>-pr-<n>-<slug>):
#      - Mark slices[n].merged = true in status.json.
#      - Delete the slice branch locally and from origin.
#      - Remove its git worktree if one exists.
#   2. If we just merged a feature PR (feature → main):
#      - Mark status.phase = "complete".
#      - Delete the feature branch.
#      - Flip the spike doc's frontmatter status to "closed" (if not already).
#
# Install via Claude Code settings:
#   {
#     "hooks": {
#       "postToolUse": [
#         { "tool": "Bash", "match": "^gh pr merge", "command": "bash .claude/plugins/canvas-to-code/hooks/post-merge-cleanup.sh" }
#       ]
#     }
#   }
#
# Or as a real git hook:
#   ln -sf "$PWD/.claude/plugins/canvas-to-code/hooks/post-merge-cleanup.sh" .git/hooks/post-merge

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
STATE_DIR="$REPO_ROOT/.design-to-code/state"

# Skip if the consumer isn't using the bridge.
if [ ! -d "$STATE_DIR" ]; then
  exit 0
fi

CURRENT_BRANCH="$(git branch --show-current)"

# We only act when on main (the merge target). On any other branch this hook is a no-op.
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  exit 0
fi

# Find the most-recently-merged ref by inspecting the merge commit on HEAD.
# `git log -1 --merges` gets the latest merge commit; the second parent is the merged branch's tip.
MERGED_REF="$(git log -1 --merges --pretty=%P 2>/dev/null | awk '{ print $2 }' || true)"

if [ -z "$MERGED_REF" ]; then
  exit 0
fi

# Resolve the branch name from the ref (best-effort).
MERGED_BRANCH="$(git for-each-ref --format='%(refname:short)' refs/heads/ --contains "$MERGED_REF" 2>/dev/null | head -1 || true)"

if [ -z "$MERGED_BRANCH" ]; then
  # Try the remote
  MERGED_BRANCH="$(git for-each-ref --format='%(refname:short)' refs/remotes/origin/ --contains "$MERGED_REF" 2>/dev/null | head -1 | sed 's|^origin/||' || true)"
fi

if [ -z "$MERGED_BRANCH" ]; then
  exit 0
fi

echo "[canvas-to-code] post-merge: $MERGED_BRANCH"

# Case 1: slice PR. Pattern: <feature>-pr-<n>-<slug>
if [[ "$MERGED_BRANCH" =~ ^(.+)-pr-([0-9]+)-(.+)$ ]]; then
  FEATURE="${BASH_REMATCH[1]}"
  SLICE_N="${BASH_REMATCH[2]}"
  STATUS_FILE="$STATE_DIR/$FEATURE/status.json"

  if [ -f "$STATUS_FILE" ]; then
    # Mark slice merged. Naive sed; for production, prefer node-based jq alternative.
    node -e "
      const fs = require('fs');
      const path = '$STATUS_FILE';
      const s = JSON.parse(fs.readFileSync(path, 'utf8'));
      const slice = (s.slices || []).find(x => x.n === Number('$SLICE_N'));
      if (slice) {
        slice.merged = true;
        slice.merged_at = new Date().toISOString();
        fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\\n');
        console.log('[canvas-to-code] marked slice $SLICE_N merged in', path);
      }
    " || true
  fi

  # Delete the slice branch.
  git branch -D "$MERGED_BRANCH" 2>/dev/null || true
  git push origin --delete "$MERGED_BRANCH" 2>/dev/null || true

  # Remove worktree if one was created at .worktrees/<branch>.
  WORKTREE_PATH="$REPO_ROOT/.worktrees/$MERGED_BRANCH"
  if [ -d "$WORKTREE_PATH" ]; then
    git worktree remove "$WORKTREE_PATH" 2>/dev/null || true
  fi

  exit 0
fi

# Case 2: feature PR. We look up whether MERGED_BRANCH matches a featureBranch in any status.json.
for status_file in "$STATE_DIR"/*/status.json; do
  [ -f "$status_file" ] || continue
  FEATURE_BRANCH="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$status_file','utf8')).featureBranch || '')")"
  if [ "$FEATURE_BRANCH" = "$MERGED_BRANCH" ]; then
    node -e "
      const fs = require('fs');
      const path = '$status_file';
      const s = JSON.parse(fs.readFileSync(path, 'utf8'));
      s.phase = 'complete';
      s.completed_at = new Date().toISOString();
      fs.writeFileSync(path, JSON.stringify(s, null, 2) + '\\n');
      console.log('[canvas-to-code] feature complete:', s.feature);
    " || true

    # Delete the feature branch.
    git branch -D "$MERGED_BRANCH" 2>/dev/null || true
    git push origin --delete "$MERGED_BRANCH" 2>/dev/null || true

    # Flip spike status.
    SPEC_PATH="$(node -e "console.log(JSON.parse(require('fs').readFileSync('$status_file','utf8')).specDocPath || '')")"
    if [ -n "$SPEC_PATH" ] && [ -f "$REPO_ROOT/$SPEC_PATH" ]; then
      sed -i.bak -E 's/^status: open$/status: closed/' "$REPO_ROOT/$SPEC_PATH" && rm -f "$REPO_ROOT/$SPEC_PATH.bak"
    fi

    break
  fi
done

exit 0

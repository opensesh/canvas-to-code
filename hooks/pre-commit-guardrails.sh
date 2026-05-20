#!/usr/bin/env bash
# pre-commit-guardrails.sh — opt-in pre-commit hook for Canvas-to-Code.
#
# When enabled in .claude/settings.json (or .git/hooks/pre-commit), this hook
# runs the same seven guardrail checks as the canvas-to-code-guardrails skill,
# but as a hard gate. The hook is silent on clean diffs.
#
# Severity is controlled by .canvas-to-code/config.yaml:
#   guardrail_severity: warn   # exits 0, prints warnings
#   guardrail_severity: error  # exits 1 on any violation
#
# To bypass for one commit: git commit --no-verify
# (We discourage --no-verify; investigate the violation first.)
#
# Install:
#   ln -sf "$PWD/.claude/plugins/canvas-to-code/hooks/pre-commit-guardrails.sh" .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or via Claude Code settings:
#   {
#     "hooks": {
#       "preToolUse": [
#         { "tool": "Bash", "match": "^git commit", "command": "bash .claude/plugins/canvas-to-code/hooks/pre-commit-guardrails.sh" }
#       ]
#     }
#   }

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
CONFIG_FILE="$REPO_ROOT/.canvas-to-code/config.yaml"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK_SCRIPT="$PLUGIN_DIR/scripts/check-guardrails.mjs"

# Skip if the consumer isn't using the bridge.
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Skip if the helper script is missing (defensive — should always be present).
if [ ! -f "$CHECK_SCRIPT" ]; then
  echo "[canvas-to-code] hook helper missing at $CHECK_SCRIPT — skipping" >&2
  exit 0
fi

# Parse guardrail_severity (default warn). Naive grep — sufficient for a single scalar.
SEVERITY="$(grep -E '^\s*guardrail_severity:' "$CONFIG_FILE" 2>/dev/null | awk -F: '{ print $2 }' | tr -d '[:space:]' || true)"
SEVERITY="${SEVERITY:-warn}"

# Build the diff for staged changes only (the hook runs pre-commit).
DIFF="$(git diff --cached --no-color || true)"

if [ -z "$DIFF" ]; then
  exit 0
fi

# Hand the diff to the helper. The helper prints findings as one-per-line:
#   <rule>:<file>:<line>:<violation>
# and exits 0 on no findings, 1 on findings.
if FINDINGS="$(printf '%s' "$DIFF" | node "$CHECK_SCRIPT" --stdin --format text)"; then
  exit 0
fi

# Findings present.
echo "" >&2
echo "[canvas-to-code] guardrail violations detected (severity: $SEVERITY):" >&2
echo "$FINDINGS" | sed 's/^/  /' >&2
echo "" >&2
echo "  See: https://github.com/opensesh/canvas-to-code#guardrails" >&2
echo "  Bypass (discouraged): git commit --no-verify" >&2
echo "" >&2

if [ "$SEVERITY" = "error" ]; then
  exit 1
fi

# warn — exit 0 so the commit proceeds.
exit 0

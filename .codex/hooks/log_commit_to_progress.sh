#!/usr/bin/env bash
# PostToolUse hook for Bash(git commit *). Appends one COMMIT line to PROGRESS.md.
# Idempotent: skips if `[commit <sha>]` already present. Non-fatal on any error.
set -uo pipefail

PROGRESS="docs/agent-memory/PROGRESS.md"
[[ -f "$PROGRESS" ]] || exit 0

# Extract command from stdin (PostToolUse hook payload).
input="$(cat || true)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
case "$cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

sha="$(git rev-parse --short HEAD 2>/dev/null || true)"
[[ -n "$sha" ]] || exit 0

if grep -q "\[commit $sha\]" "$PROGRESS" 2>/dev/null; then
  exit 0
fi

subject="$(git log -1 --pretty=%s 2>/dev/null || echo "<no subject>")"
ts="$(date -u +'%Y-%m-%d %H:%M')"

printf -- "- [%s] COMMIT [commit %s] %s\n" "$ts" "$sha" "$subject" >> "$PROGRESS"
exit 0

#!/usr/bin/env bash
# SessionStart hook. Prints a compact orientation banner so a fresh agent
# doesn't have to re-read every file before starting work.
#
# Outputs (via JSON systemMessage):
#   - Head of PROGRESS.md (last 12 lines)
#   - Newest plan in docs/exec-plans/active/
#   - Count of open BLOCKERS.md entries
#
# Non-blocking (continue: true). Skips gracefully if any file is missing.

set -uo pipefail

# Read the hook payload (we don't need it but consume stdin to be safe).
cat >/dev/null || true

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROGRESS="$ROOT/docs/agent-memory/PROGRESS.md"
BLOCKERS="$ROOT/docs/agent-memory/BLOCKERS.md"
ACTIVE_DIR="$ROOT/docs/exec-plans/active"

msg=""

if [[ -f "$PROGRESS" ]]; then
  recent="$(tail -n 12 "$PROGRESS" 2>/dev/null | sed '/^[[:space:]]*$/d' | tail -n 8)"
  if [[ -n "$recent" ]]; then
    msg+="PROGRESS.md (recent):"$'\n'"$recent"$'\n\n'
  fi
fi

if [[ -d "$ACTIVE_DIR" ]]; then
  newest="$(ls -1 "$ACTIVE_DIR" 2>/dev/null | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}.*\.md$' | sort | tail -n 1)"
  if [[ -n "$newest" ]]; then
    msg+="Active plan: docs/exec-plans/active/$newest"$'\n\n'
  else
    msg+="No active plan in docs/exec-plans/active/."$'\n\n'
  fi
fi

if [[ -f "$BLOCKERS" ]]; then
  # grep -c exits non-zero on zero matches even though it prints "0";
  # use the printed value verbatim, ignore exit status, take only the first line.
  open_count="$(grep -cE '^- ' "$BLOCKERS" 2>/dev/null | head -n 1)"
  open_count="${open_count:-0}"
  msg+="Open BLOCKERS.md entries: ${open_count}."$'\n'
fi

if [[ -z "$msg" ]]; then
  jq -n '{continue: true}'
  exit 0
fi

jq -n --arg m "$msg" '{
  continue: true,
  systemMessage: $m
}'
exit 0

#!/usr/bin/env bash
# Stop hook. If there are uncommitted changes under code dirs, remind to run tests.
# Does not block stop (continue: true). Adapt globs + test command per language (§6.4 of spec).
set -uo pipefail

# Default: language-agnostic. Specialize as code lands.
status="$(git status --porcelain 2>/dev/null || true)"

# Filter to plausible code paths. Until the stack is decided, treat any change as code.
if [[ -z "$status" ]]; then
  jq -n '{continue: true}'
  exit 0
fi

msg="Uncommitted changes detected. Before stopping, run the project's test command (TBD — populate in CLAUDE.md § Operating rules). Skipping verification = breaking §8.6."

jq -n --arg m "$msg" '{
  continue: true,
  systemMessage: $m
}'
exit 0

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

# Suggest a focused test command if any tests under lib/motive/ were touched.
touched_tests="$(printf '%s' "$status" | awk '{print $2}' | grep -E 'apps/web/src/lib/motive/.*\.test\.ts$' | head -n 3 || true)"

if [[ -n "$touched_tests" ]]; then
  focus_hint="Focused tests touched. Run: pnpm test -- ${touched_tests//$'\n'/ }"$'\n'
else
  focus_hint=""
fi

msg="Uncommitted changes detected. Before stopping, run \`pnpm test\` (and \`pnpm lint && pnpm typecheck\` if you touched code). Skipping verification breaks CLAUDE.md non-negotiable #6."$'\n'"$focus_hint"

jq -n --arg m "$msg" '{
  continue: true,
  systemMessage: $m
}'
exit 0

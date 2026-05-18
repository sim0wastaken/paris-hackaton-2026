#!/usr/bin/env bash
# PostToolUse hook for Edit / Write under apps/web/src/. Runs the
# motive/no-cross-layer-import lint rule on the edited file only and emits
# a systemMessage if it warns. Non-blocking.
#
# Sub-second wall time target — runs eslint on a single file with the
# motive rule isolated.

set -uo pipefail

input="$(cat || true)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

if [[ -z "$path" ]]; then
  jq -n '{continue: true}'
  exit 0
fi

# Only check files under apps/web/src/ — outside that the layer rule is irrelevant.
case "$path" in
  */apps/web/src/*) ;;
  *)
    jq -n '{continue: true}'
    exit 0
    ;;
esac

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 0

# Run eslint with only our rule. --no-config-lookup keeps it fast and isolated.
# We do tolerate failure (set +e) — this hook never blocks.
relpath="${path#$ROOT/}"
out="$(cd apps/web && pnpm --silent exec eslint --quiet --no-warn-ignored \
  --rule '{"motive/no-cross-layer-import": "warn"}' "${relpath#apps/web/}" 2>&1 | sed -n '/warning/,$p' | head -n 20)"

if [[ -z "$out" ]]; then
  jq -n '{continue: true}'
  exit 0
fi

jq -n --arg m "Layer-import check on ${relpath}:"$'\n'"$out" '{
  continue: true,
  systemMessage: $m
}'
exit 0

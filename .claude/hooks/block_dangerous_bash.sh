#!/usr/bin/env bash
# PreToolUse hook for Bash. Reads hook JSON from stdin, denies dangerous patterns.
# Output schema: {hookSpecificOutput: {hookEventName, permissionDecision, permissionDecisionReason}}
set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

emit() {
  # $1 = allow|deny, $2 = reason
  jq -n --arg d "$1" --arg r "$2" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: $d,
      permissionDecisionReason: $r
    }
  }'
}

if [[ -z "$cmd" ]]; then
  emit allow "no command payload"
  exit 0
fi

# `git commit` does not execute the commit message text — it merely records
# it. Substring-matching dangerous patterns inside a commit message would
# block legitimate commits that *describe* dangerous operations (e.g. this
# very hook's update commits). Skip the check for git-commit commands.
case "$cmd" in
  "git commit"*|*"; git commit"*|*"&& git commit"*|*"|| git commit"*)
    emit allow "git commit — message text is not executed"
    exit 0
    ;;
esac

# Dangerous-pattern allowlist of denials. Substring match; intentionally broad.
patterns=(
  'rm -rf /'
  'rm -rf ~'
  'rm -rf /*'
  'rm -fr /'
  'rm -fr ~'
  'rm -fr /*'
  'git push --force'
  'git push -f '
  'git push --force-with-lease'
  'DROP DATABASE'
  'TRUNCATE DATABASE'
  'docker compose down -v'
  'docker-compose down -v'
  ':(){ :|:& };:'
  'mkfs.'
  'dd if=/dev/zero of=/dev/'
  'dd if=/dev/random of=/dev/'
  'chmod -R 777 /'
  'chown -R '
  '> /dev/sda'
  'vercel deploy --prod'
  'vercel --prod'
  'vercel promote'
  'supabase db reset --linked'
  'supabase db push --linked'
)

for p in "${patterns[@]}"; do
  if [[ "$cmd" == *"$p"* ]]; then
    emit deny "Blocked by block_dangerous_bash.sh — pattern: $p. If intentional, escalate to a human."
    exit 0
  fi
done

emit allow ""
exit 0

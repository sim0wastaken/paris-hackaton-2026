---
description: Self-review the current branch — run lint/typecheck/test, do a spec-grounding pass on the diff, produce a structured critique.
argument-hint: "[focus area, optional]"
---

# /review — agent-to-agent review on the current branch

You are reviewing your own (or a teammate agent's) work on the current branch. This is the Ralph Wiggum Loop entry point: produce a critique that, when acted on, would land a green PR.

If the user passed a focus area in `$ARGUMENTS`, weight your review toward that area; otherwise do the full pass.

## Required passes — run each, summarize the result

Run these from the repo root in this order. Stop early **only** if a pass fails so catastrophically that the next pass cannot run (e.g. typecheck breaks the build).

1. `git status` and `git diff main...HEAD --stat` — what did this branch change?
2. `pnpm lint` — surface new warnings introduced by this branch (diff against the count at `main` if relevant).
3. `pnpm typecheck` — must be clean.
4. `pnpm test` — must be all green.
5. `pnpm db:schema:doc:check` — db-schema.md must be in sync with migrations.
6. `pnpm verify:freshness` — TODO(blocker:) tags + plan filenames + schema freshness.

## Spec-grounding pass

For every file changed in `apps/web/src/lib/motive/` or `apps/web/src/app/api/`:
- Identify which spec in `docs/superpowers/specs/` covers it. If you can't find one, that's a finding.
- Check that the change conforms to the spec's data shapes and persistence rules.
- Check `RELIABILITY.md` invariants 1, 2, 3, 8 against the diff: is `request_id` threaded? Is `provider_payload` persisted? Is logging structured?
- Check `docs/design-docs/golden-principles.md` rules R1–R10: any new `as` cast at a boundary? Any direct `console.*`? Any file over the 400-line cap?

## Output format

A structured findings list, grouped by severity:

```
BLOCKER (must fix before merge):
- file:line — issue, with reference to the rule/spec/invariant violated
SHOULD FIX:
- file:line — issue
NIT:
- file:line — issue
NOT REVIEWED (low confidence):
- file:line — why you couldn't conclude
```

For each finding, propose a one-line remediation. If a remediation is more than one line, link to where in the diff the fix belongs.

End with a one-sentence verdict: **ready to merge** / **revise**, and the count of blockers.

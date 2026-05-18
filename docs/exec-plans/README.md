# Execution plans

Plans are first-class artifacts. One plan per milestone. The plan is **what gets executed** — the spec describes intent, the plan describes order and dependencies.

## Lifecycle

```
docs/exec-plans/
  active/     ← plan currently being executed (usually 0–2 files)
  completed/  ← plans whose final PR has merged
  tech-debt-tracker.md  ← append-only known-debt log (cross-references active/ + BLOCKERS.md)
```

### Active → completed

A plan moves from `active/` to `completed/` when:
1. Every checkbox / milestone in the plan is done.
2. The final PR has merged.
3. `docs/QUALITY_SCORE.md` has been re-graded for any domain the plan touched.

The `/gc` slash command can perform this move once the conditions are met.

## Format

Open one of the existing files for the structure, but at minimum every plan has:
- **Context** — one paragraph: why this work exists.
- **Outcome** — what "done" looks like (acceptance criteria).
- **Steps** — ordered, each independently revertable where possible.
- **Verification** — concrete commands and pass criteria.
- **Out of scope** — what we explicitly chose not to do.

## Why a separate folder from `docs/superpowers/plans/`?

`docs/superpowers/plans/` was the original location. Now empty — kept as a redirect path. New plans always go in `docs/exec-plans/active/`. If you find a plan under `superpowers/plans/`, move it.

## `tech-debt-tracker.md`

Lightweight append-only log. Every entry has: date, one-line description, source file path, `(blocker: YYYY-MM-DD)` tag if it crosses the 30-min threshold (then also in `BLOCKERS.md`).

---
description: Doc-gardening / slop garbage-collection pass. Surfaces stale docs, unblocked TODOs, oversized files, and broken cross-refs as a list of small fix-up PRs.
---

# /gc — doc gardening + slop GC

Run a single pass of the doc-gardening agent (see `.claude/skills/doc-gardening/SKILL.md`). The goal is to surface a list of small, individually-mergeable fix-up tasks — not to fix everything at once.

## Scans to run

For each scan, count violations and list the first ~10 with file paths.

1. **Stale PROGRESS.md entries** — entries that reference files that no longer exist.
2. **Missing TODO(blocker:) tags** — TODO comments in code missing the `(blocker: YYYY-MM-DD)` suffix. Reference golden-principles.md R7.
3. **Unblockered TODO tags** — `TODO(blocker: YYYY-MM-DD)` in code whose date is not in `docs/agent-memory/BLOCKERS.md`. Run `pnpm verify:freshness` and report.
4. **Oversized service files** — files in `apps/web/src/lib/motive/` over 400 lines. Reference golden-principles.md R6.
5. **Service files without tests** — `*-service.ts`, `*-actions.ts`, or domain files in `lib/motive/` lacking a co-located `*.test.ts`. Reference golden-principles.md R4.
6. **Cross-layer lint warnings** — count from `pnpm lint`; list the top files by warning count.
7. **Spec ↔ implementation drift** — for each spec in `docs/superpowers/specs/`, does the implementation it describes exist? If a spec marks a feature shipped but PROGRESS shows it incomplete (or vice versa), flag.
8. **db-schema.md freshness** — `pnpm db:schema:doc:check` must pass.
9. **Plan filename convention** — files in `docs/exec-plans/active/` must match `YYYY-MM-DD-<slug>.md`.
10. **Completed plans still in active/** — plans whose feature is marked DONE in PROGRESS but the file is still in `active/`. Suggest moving to `completed/`.

## Output format

```
## /gc pass — <date>

### Blockers (block CI today)
- <count> · <one-line description> · file path
...

### Open opportunities (ship as small PRs)
1. <one-line description> — <file path> — `chore(gc): ...` PR title
2. ...

### Stale / archive candidates
- ...

### Summary
- Total findings: N
- Suggested PRs: M (each ≤ 30-line diff)
```

Do not modify any files in this pass. The output is a worklist; the agent (or human) opens one PR per item afterward.

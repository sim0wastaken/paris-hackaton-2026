---
name: doc-gardening
description: Use when the user runs `/gc` or when starting a "garbage collection" / cleanup pass on Motive. Scans for stale docs, missing tests, oversized files, unblockered TODOs, and spec/PROGRESS drift; outputs a list of small fix-up PRs to open. Does not modify files in the scan pass — produces a worklist.
---

# Doc-gardening / slop GC

This skill is Motive's continuous garbage-collection mechanism, inspired by the OpenAI Codex playbook's "golden principles + GC" pattern (`docs/design-docs/core-beliefs.md` §11). The slash command `/gc` invokes it. It can also be triggered by the scheduling skill on a cron cadence.

## What this skill does

Two phases. **Always do phase 1 first, then ask the user before phase 2.**

### Phase 1 — Scan (read-only)

Run all ten scans listed below from the repo root. For each scan, produce a worklist row: `<count> · <one-line description> · <file paths or hint>`.

1. **PROGRESS.md stale references.** Read `docs/agent-memory/PROGRESS.md`. Grep each line for backtick-quoted paths (`` `path/to/file` ``). Flag any path that does not exist.
2. **Unblockered TODOs.** Run `grep -rE "TODO[^(]" apps/web/src/ scripts/ supabase/` — any `TODO` without `(blocker: YYYY-MM-DD)` violates golden-principles R7.
3. **Blockered TODOs missing from BLOCKERS.md.** `pnpm verify:freshness` reports this — surface the offenders.
4. **Oversized service files.** Files in `apps/web/src/lib/motive/` over 400 lines. (Use `wc -l`.) Reference golden-principles R6.
5. **Untested service files.** For every `*.ts` in `apps/web/src/lib/motive/` (excluding `types.ts`, `*-schemas.ts`, `supabase-*.ts`, `*.test.ts`), check that a sibling `*.test.ts` exists. Reference golden-principles R4.
6. **Cross-layer lint warnings.** Run `pnpm lint --silent 2>&1 | grep "warning"` and aggregate by file. Top-5 by warning count.
7. **Spec ↔ PROGRESS drift.** For each spec in `docs/superpowers/specs/2026-*.md`, look for `DONE` or `START` mentions of that spec's number in `PROGRESS.md`. Flag specs marked complete in PROGRESS but with no DONE entry, and vice versa.
8. **db-schema doc freshness.** `pnpm db:schema:doc:check` — must pass.
9. **Plan-filename convention.** Files in `docs/exec-plans/active/` must match `YYYY-MM-DD-<slug>.md`. Surface offenders.
10. **Completed plans still in active/.** For each plan in `docs/exec-plans/active/`, look for its slug appearing as `DONE` in PROGRESS.md. If found and the plan's checkboxes are all `[x]`, suggest moving to `completed/`.

### Phase 2 — Open PRs (only after the user says go)

For each worklist item the user approves, open a small fix-up PR. Each PR is one logical change, ≤30-line diff target. Commit prefix is `chore(gc):`. Use the `/feature` command's spec-loading discipline if the change touches code.

**Do not bundle multiple items into one PR** even if they share a file. Per the playbook: "small PRs that automerge in under a minute."

## Output format

```
## /gc pass — <YYYY-MM-DD HH:MM UTC>

### Blockers (would fail CI today)
- [count] [description] → [paths]

### Open opportunities (queue as small PRs)
1. [description] — [path] — proposed title: chore(gc): [...]
2. ...

### Stale / archive candidates
- [...]

### Summary
- Total findings: N
- Suggested PRs: M
- Estimated cleanup effort: <30-min, 30–90-min, or split-into-plan
```

## Coordination with other skills

- Use `gitnexus-impact-analysis` SKILL on any symbol referenced before suggesting a refactor (Pillar 4 of the harness plan).
- Use `superpowers:verification-before-completion` SKILL before claiming any fix-up PR is done.

## When not to use this skill

- During active feature development. The GC pass should run on a clean tree, not interleave with feature commits.
- During the final hours before a demo. Stability over cleanup.
- When the codebase is < 24 hours old. Nothing to GC yet.

## Examples of findings (illustrative)

```
- 1 · PROGRESS.md references `docs/superpowers/plans/2026-05-16-openai-first-demo-plan.md` but that path moved to docs/exec-plans/active/
- 3 · service files over 400 lines: lib/motive/creatives.ts (1020), demo.ts (1089), extraction.ts (876)
- 3 · service files without tests: projects.ts, source-ingestion.ts, performance.ts
- 23 · cross-layer lint warnings — top: app/api/projects/route.ts (2), app/projects/[projectId]/review/page.tsx (2)
```

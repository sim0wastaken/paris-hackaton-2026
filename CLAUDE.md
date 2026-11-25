# paris-hackaton-2026 — Motive OpenAI-first campaign workbench

> Project codename: **Motive**. Goal: ship a Paris AI Hackathon demo where a user drops in a brand link, OpenAI extraction phases stream into the HITL workspace, every artifact is persisted, HITL review shapes ad groups, creatives are generated, and a fake deploy/story monitoring dashboard closes the loop. Pioneer is downstream of v1, not on the critical path. This file is the **north-star briefing** that must survive context compaction. Currrent status: Hackathon finished, we are foudner mode to launch this and make it the next gen GEO unicorn. No hackathon mode. Best practices only.

## Where to look first

| Need | File |
|---|---|
| TOC / map of the harness | `AGENTS.md` |
| Domain layers, allowed edges, 14 tables, build order | `ARCHITECTURE.md` |
| System invariants (request_id, audit log, payload persistence, etc.) | `RELIABILITY.md` |
| Sensitive material, server/client boundary, logging policy | `SECURITY.md` |
| Authoritative product brief | `docs/briefing-files/index.md` |
| What's being shipped right now | `docs/exec-plans/active/` |
| Subsystem specs | `docs/superpowers/specs/INDEX.md` |
| Recent commits / decisions / blockers | `docs/agent-memory/{PROGRESS,DECISIONS,BLOCKERS}.md` |
| Full operating spec (rules for long-running agents) | `docs/tech/knowledge_management_spec.md` |

## Non-negotiables (do not drift)

1. **Read before writing.** Reload `CLAUDE.md` → `AGENTS.md` → `PROGRESS.md` → `BLOCKERS.md` → most-recent plan in `docs/exec-plans/active/` at session start (§8.1 of spec). Hook `session_start_load_context.sh` prints the latter three.
2. **TDD.** Failing test → implement → green → refactor. Run the full suite (`pnpm test`) as a regression gate before commit.
3. **Commit per subsystem** (not per file). `<type>(<scope>): <subject>`. The `log_commit_to_progress.sh` hook auto-appends to `PROGRESS.md` — do not write `COMMIT` lines by hand.
4. **Check affected callers before edits.** Inspect current-checkout references and contracts for shared symbols; report material risks. Review the staged diff before commit. Prefer language-server rename where available and verify remaining references.
5. **30-min blocker rule.** If a subsystem stalls >30 min, stub with `TODO(blocker: YYYY-MM-DD)`, append to `BLOCKERS.md`, continue.
6. **Verification before completion.** Never claim "done" without running the acceptance command and pasting/summarizing output (§8.6).
7. **Spec → Plan → Execute.** Use `superpowers:writing-plans` for any multi-step task; one spec per subsystem in `docs/superpowers/specs/`, one plan per milestone in `docs/exec-plans/active/`.
8. **Context7 first** for library questions, **after** checking the cached llms.txt in `docs/references/`. Web search only if neither has an entry.
9. **Never `latest`** for infra images; pin to a specific known-good tag with rationale in `VERSIONS.md § Infrastructure images` (§11.1).
10. **Never commit** `.env`, `.claude/settings.local.json`, or local generated indexes. `.env.example` **is** committed with placeholder sentinels.
11. **Four artefacts per feature** (§17.11): spec + plan task + test + docs update. Trivial changes: `chore:` prefix.
12. **One audit-log write per mutation** once real persistence lands (§17.1); one `request_id` threaded end-to-end (§17.2). See `RELIABILITY.md` Invariants 1 + 2.
13. **OpenAI-first v1.** Completely independent from Pioneer: scaffold, persist OpenAI extractions, generate ad groups, generate creatives, build dashboards first.
14. **No spinner demo.** Extraction phases must stream into HITL via Supabase Realtime and/or Inngest events. See `RELIABILITY.md` Invariant 5.
15. **Story KPIs only.** Monitoring KPIs coherent and tied to ad-group/creative quality. No random metric noise. See `RELIABILITY.md` Invariant 6.
16. **Pioneer after data.** Pioneer becomes useful once stored OpenAI labels, HITL corrections, creative variants, and performance rows exist. Do not block the demo on fine-tuning or retraining.
17. **No self-improvement overclaim.** GPT-labeled GPT outputs are distillation. Say "self-improving" only for loops that incorporate new production traces (human corrections, rejected rows, campaign outcomes, landing-page edits, KPI-derived review labels).

## Operating rules (quick reference)

- **Package manager / language:** `pnpm@11.1.2`, TypeScript via Next.js 16; full inventory in `docs/agent-memory/VERSIONS.md`.
- **Test command:** `pnpm test` (vitest, Node env).
- **Lint / typecheck:** `pnpm lint`, `pnpm typecheck`.
- **Commit cadence:** one per subsystem; ≥1 per 60 min of focused work (§17.14).
- **Logging:** structured JSON to stdout; always carry `request_id`, `actor`, `route`, `level` (§17.7). See `RELIABILITY.md` Invariant 8.
- **Skill discipline:** invoke only skills listed by the live skill index; never guess names.

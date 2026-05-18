# AGENTS.md — Motive harness map

> Table of contents, **not** an encyclopedia. Read the linked file when you need the detail. This file stays under ~120 lines for a reason: every byte here costs context every turn.

## Start here (in order)

1. **`CLAUDE.md`** — non-negotiables + GitNexus rules. The line-by-line discipline.
2. **`ARCHITECTURE.md`** — domain layers, allowed dependency edges, 14 tables, build order.
3. **Latest plan in `docs/exec-plans/active/`** — what's being shipped right now.
4. **`docs/agent-memory/PROGRESS.md`** (head) and `BLOCKERS.md` — what's done, what's stuck.

## Authoritative sources of truth

| Topic | File |
|---|---|
| Product brief (why) | `docs/briefing-files/index.md` → linked authoritative memo |
| Operating principles | `docs/design-docs/core-beliefs.md` |
| Mechanical rules used by GC | `docs/design-docs/golden-principles.md` |
| Subsystem specs | `docs/superpowers/specs/INDEX.md` (10 specs + `SHARED_CONTRACT.md`) |
| Active execution plan(s) | `docs/exec-plans/active/` |
| Closed plans | `docs/exec-plans/completed/` |
| Tech debt | `docs/exec-plans/tech-debt-tracker.md` |
| Per-domain quality grade | `docs/QUALITY_SCORE.md` |
| Knowledge management spec (full) | `docs/tech/knowledge_management_spec.md` |
| System invariants | `RELIABILITY.md` |
| Sensitive material policy | `SECURITY.md` |

## Where things live in code

| Layer | Path |
|---|---|
| Routes + API | `apps/web/src/app/` |
| UI components | `apps/web/src/components/` |
| Domain services | `apps/web/src/lib/motive/<domain>.ts` |
| Data access | `apps/web/src/lib/motive/supabase-<domain>.ts` |
| Schemas (Zod) | `apps/web/src/lib/motive/types.ts`, `extraction-schemas.ts` |
| Supabase clients | `apps/web/src/lib/supabase/` |
| Background workflows | `apps/web/src/inngest/` |
| DB migrations | `supabase/migrations/` |
| Seed data | `supabase/seed.sql` |
| Demo + admin scripts | `scripts/` |
| Generated docs | `docs/generated/` (e.g. `db-schema.md`) |

## Session-survival memory (`docs/agent-memory/`)

`PROGRESS.md` · `DECISIONS.md` · `BLOCKERS.md` · `VERSIONS.md` · `STACK.md` · `SECRETS.md` · `PERF.md`

Reload `PROGRESS.md` head + `BLOCKERS.md` at session start. Hook `session_start_load_context.sh` does this automatically.

## External library references (cache-first)

Cached llms.txt-style docs in `docs/references/`. Use Context7 (`mcp__plugin_context7_context7__query-docs`) only when the cached file does not cover it. Cached refs: Next.js · Supabase · Inngest · OpenAI Responses · fal.ai · Tavily · Zod.

## Tools the agent has

- **Skills:** `.claude/skills/` (Claude-flavored) and `.agents/skills/` (non-Claude protocol). GitNexus skill set lives in both.
- **Slash commands:** `.claude/commands/` — `/feature` `/review` `/gc` `/grade`.
- **Hooks:** `.claude/hooks/` — safety gate, commit logging, session-start context, post-edit layer check, stop-time reminder.

## GitNexus — code-graph rules (mirrored from `CLAUDE.md`)

<!-- gitnexus:start -->
This project is indexed by GitNexus as **paris-hackaton-2026** (2668 symbols, 4271 relationships, 136 execution flows). If any tool warns the index is stale, run `npx gitnexus analyze`.

**Always:**
- Run `gitnexus_impact({target, direction: "upstream"})` before editing a symbol with ≥2 callers; report blast radius.
- Run `gitnexus_detect_changes()` before committing.
- Use `gitnexus_query({query: "concept"})` instead of grep when exploring.

**Never:**
- Edit a function/class/method without first running impact analysis.
- Ignore HIGH / CRITICAL risk warnings.
- Rename with find-and-replace — use `gitnexus_rename`.
- Commit without `gitnexus_detect_changes()`.

| Skill file | Use for |
|---|---|
| `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` | "How does X work?" |
| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` | "What breaks if I change X?" |
| `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` | "Why is X failing?" |
| `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` | Rename / extract / split |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | Tools, resources, schema |
| `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` | `npx gitnexus analyze`, status, wiki |
<!-- gitnexus:end -->

## For non-Claude agents

Skills mirrored under `.agents/skills/` with Codex-flavored phrasing. Hook scripts under `.codex/hooks/` mirror `.claude/hooks/` and can be wired via a Codex-side config (the previous root-level `.codex/hooks.json` had broken absolute paths and was removed).

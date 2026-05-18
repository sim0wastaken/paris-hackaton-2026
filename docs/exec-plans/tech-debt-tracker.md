# Tech debt tracker

Append-only. Each entry: `[YYYY-MM-DD] short description (source path) — link to BLOCKERS.md if applicable`.

Items here are known shortcuts taken deliberately. The `/gc` agent surfaces new items by scanning code for `TODO(blocker:`, `as` casts in route handlers, files over the 400-line cap, and missing test coverage.

---

## Open

- `[2026-05-18]` Audit-log table not yet built; `human_reviews` covers HITL actions but system-actor mutations are unlogged. (Reference: `RELIABILITY.md` Invariant 2.) Belongs in `apps/web/src/lib/motive/audit-log-service.ts` once added.
- `[2026-05-18]` Per-worktree port allocation not in place. `apps/web` always runs on 3000; parallel worktrees collide. Touches `apps/web/package.json` scripts + `supabase/config.toml`.
- `[2026-05-18]` `request_id` not yet uniformly threaded through Inngest workflows. See `RELIABILITY.md` Invariant 10.
- `[2026-05-18]` Demo reset idempotency not yet verified by a script. See `golden-principles.md` R9.
- `[2026-05-18]` CDP wiring for self-driven QA exists as an available skill (`chrome-devtools-mcp`) but no `/qa-flow` slash command yet.
- `[2026-05-18]` `lib/motive/log.ts` structured logger may not exist yet — verify before `no-unstructured-log` lint goes hard-fail. **RESOLVED** (created in step 4 of harness upgrade).
- `[2026-05-18]` `motive/no-cross-layer-import` lint surfaces ~23 violations across routes, pages, and three components that import `lib/motive/supabase-*.ts` or `lib/supabase/` directly. Each needs migration to go through a domain service in `lib/motive/<domain>.ts`. Rule is at `warn` level. Tracked files (run `pnpm lint` for the live list):
  - `app/api/projects/route.ts` (2 imports), `app/api/projects/[projectId]/{route,demo-source,deploy,extract,generation,review-data,reviews}/route.ts`
  - `app/projects/{[projectId],[projectId]/creatives,[projectId]/monitoring,[projectId]/review,page}.tsx` (6 files)
  - `components/{creative-grid,live-review-workspace,monitoring-dashboard}.tsx`
  Promote the rule from `warn` to `error` once these are migrated.

## Resolved (recent — see git log for older)

_(none yet — entries move here when `/gc` confirms the underlying code change has merged)_

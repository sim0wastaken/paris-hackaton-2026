# Tech debt tracker

Append-only. Each entry: `[YYYY-MM-DD] short description (source path) — link to BLOCKERS.md if applicable`.

Items here are known shortcuts taken deliberately. The `/gc` agent surfaces new items by scanning code for `TODO(blocker:`, `as` casts in route handlers, files over the 400-line cap, and missing test coverage.

> **2026-07-07 — tracker closed.** This repo is the hackathon archive per
> ADR-0008; product work continues in `sim0wastaken/motive`. Every open item
> below was dispositioned against that port — nothing remains actionable here.

---

## Open

_(none — see Resolved)_

## Resolved (recent — see git log for older)

- `[2026-05-18]` Audit-log table not yet built; `human_reviews` covers HITL actions but system-actor mutations are unlogged. — **CLOSED 2026-07-07 (superseded by port):** motive's `providerEvents` table persists every system-actor provider call (request + response + requestId), and HITL actions live on the reviewed rows themselves; that is the audit trail for the product going forward.
- `[2026-05-18]` Per-worktree port allocation not in place. — **CLOSED 2026-07-07 (descoped):** no further development happens in this monorepo, so worktree port collisions can no longer occur.
- `[2026-05-18]` `request_id` not yet uniformly threaded through Inngest workflows. — **CLOSED 2026-07-07 (superseded by port):** motive mints one `requestId` per audit at `audits.start` and threads it through pipeline, kit, campaign, and every `providerEvents` row (motive `docs/ARCHITECTURE.md` Invariant 2).
- `[2026-05-18]` Demo reset idempotency not yet verified by a script. — **CLOSED 2026-07-07 (descoped):** motive's demo mode is stateless (deterministic fixtures per audit, no shared demo database), so a reset script has nothing to reset.
- `[2026-05-18]` CDP wiring for self-driven QA (`/qa-flow`). — **CLOSED 2026-07-07 (descoped):** archived repo; motive's CI gates (lint/typecheck/test/build) are the verification surface.
- `[2026-05-18]` `lib/motive/log.ts` structured logger may not exist yet. — **RESOLVED** (created in step 4 of harness upgrade).
- `[2026-05-18]` `motive/no-cross-layer-import` lint surfaces ~23 violations across routes, pages, and three components. — **RESOLVED 2026-05-19:** the `.server.ts`/`.client.ts` layer split migrated every violation and the rule was promoted from `warn` to `error` (commits `e8bbd1b`, `f4760c9`).

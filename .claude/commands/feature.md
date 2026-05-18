---
description: Start a feature with full Motive context loaded — architecture, relevant spec, active plan, acceptance criteria.
argument-hint: "<short feature description>"
---

# /feature — start a new feature with Motive context

Goal: $ARGUMENTS

Before writing any code, read these in this order and summarize what each contributes to the task:

1. `CLAUDE.md` — non-negotiables (skim if already loaded this session).
2. `ARCHITECTURE.md` — domain layers and allowed import edges for the area you're touching.
3. `RELIABILITY.md` — invariants that apply (request_id threading, audit log, payload persistence, structured logging).
4. The active plan in `docs/exec-plans/active/` — is this feature already covered there? If yes, where does it fit?
5. The matching subsystem spec under `docs/superpowers/specs/` — find it via `docs/superpowers/specs/INDEX.md`. If none exists, that's a finding before you start.
6. `docs/design-docs/golden-principles.md` — rules R1–R10 you need to obey.
7. `docs/QUALITY_SCORE.md` — current grade of the domain you're touching (informs the discipline bar).

## Acceptance criteria — confirm with the user before writing code

Restate the feature back to the user as a numbered acceptance-criteria list. Each criterion must be **observable** — a command that produces a visible pass/fail, not a vibe.

Wait for the user to either confirm or correct the criteria. Do not start writing code yet.

## Build sequence

Once acceptance criteria are confirmed:

1. **Test first** (CLAUDE.md non-negotiable #2 — TDD). Write failing tests that encode each acceptance criterion.
2. **Layer-respecting implementation** — see ARCHITECTURE.md. Routes don't call Supabase directly; services do.
3. **Boundary parsing** (golden-principles R1) — Zod schemas at every untrusted input.
4. **Structured logging** (golden-principles R2) — `log.info({ request_id, ... }, "message")`, no `console.*`.
5. **Run `/review`** before committing.
6. **Commit per subsystem** (non-negotiable #3). `<type>(<scope>): <subject>`.

## Output format

Start with: a one-paragraph framing of the feature in the context of the loaded docs, followed by the proposed acceptance criteria for the user to confirm.

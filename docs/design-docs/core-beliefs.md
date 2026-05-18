# Core beliefs — how Motive's agent operates

The OpenAI Codex playbook ships software with no hand-written code by treating the **harness** — knowledge layout, hooks, linters, agent-to-agent loops — as the product. Motive follows the same discipline, shaped for a hackathon timeline.

This document is the distilled "why" behind `CLAUDE.md`'s 17 non-negotiables. When you find yourself questioning a rule, this is where to look.

---

## 1. Anything the agent can't access in-context effectively doesn't exist

Knowledge that lives in Slack, Google Docs, or a teammate's head is invisible to the next session. Push context into the repo — versioned, cross-linked, mechanically validated — or it will rot.

Practical implication: when a human-given correction lands, the agent's first instinct should be "where in the repo does this live, and which file gets updated?" — not "I'll remember this for next time."

## 2. AGENTS.md is the table of contents, not the encyclopedia

A monolithic instruction file crowds out the task. Too much guidance becomes non-guidance. We keep `AGENTS.md` under ~120 lines as a map; the depth lives in dedicated files (`ARCHITECTURE.md`, `RELIABILITY.md`, `SECURITY.md`, design docs, specs).

## 3. Spec → plan → execute

Every multi-step task gets a spec (in `docs/superpowers/specs/`) and a plan (in `docs/exec-plans/active/`). Plans are first-class artifacts: active and completed are separately tracked. The spec encodes *what* and *why*; the plan encodes *how and in what order*. Code without one of these is exploratory by definition and gets a `chore:` prefix at most.

## 4. Verification before completion

A task is not "done" when the diff compiles. It is done when the acceptance command in the spec produces the expected output and that output is in the commit / PR description. Pre-commit hooks, CI, and the `/review` slash command exist to make this mechanical.

## 5. Read before writing

Every session starts by reloading: `CLAUDE.md` → `AGENTS.md` → `PROGRESS.md` head → `BLOCKERS.md` → newest plan in `docs/exec-plans/active/`. The `session_start_load_context.sh` hook prints the last three so the agent never wastes context on the lookup.

## 6. TDD applies even to the harness

A new ESLint rule gets a failing test on a fixture before the rule is written. A new hook gets a smoke test. A new doc-generator gets a regression check (run twice → identical output). The harness is code, and code without tests rots.

## 7. Boundaries are sacred; internals are flexible

Enforce boundaries (allowed import edges, schema parsing at HTTP/event/env entry, no service-role key on the client). Inside a single layer, prefer ergonomic code over rigid conventions. The custom linter in `apps/web/eslint-rules/` only enforces things that survive the agent / human handoff.

## 8. Pinned versions, never `latest`

Drift in dependencies is the leading cause of "it worked yesterday." Every dep gets an exact version in `VERSIONS.md` with a one-line rationale. Infra images (Postgres, Inngest dev) are pinned in `supabase/config.toml` and `docker-compose.yml` or similar.

## 9. Throughput changes the merge philosophy

Standard engineering caution about merging "just to keep things moving" is correct in a low-throughput environment. With high agent throughput, **waiting is more expensive than correcting after the fact**. Short-lived PRs, flake-tolerant CI, fast follow-up commits. Reversibility matters more than gatekeeping.

## 10. The repository is optimized for agent legibility first

If a human prefers naming convention A and the agent's pattern-matching does better with B, choose B (when both are correct). Examples:
- Prefer "boring" tech with high training-set coverage.
- Reimplement small utilities in-repo rather than pull opaque packages.
- Keep file sizes under ~400 lines so the agent can hold them in context.
- Use structured logging because agents can read JSON; humans can read pretty-printed JSON too.

## 11. Garbage collection is continuous, not a Friday ritual

Tech debt is a high-interest loan. The `/gc` doc-gardening agent runs on demand (or scheduled) and opens small fix-up PRs. Human taste is captured once as a `golden-principles.md` rule and enforced thereafter on every commit.

## 12. Self-improvement requires production traces

We never call a GPT-labeling-GPT loop "self-improving." That is distillation. Real self-improvement requires new traces from production: human corrections, rejected rows, campaign outcomes, landing-page edits, KPI-derived review labels. Pioneer (post-v1) is the place those traces feed.

---

## How this document is used

- Loaded automatically by `session_start_load_context.sh` if the file referenced changes.
- Referenced by `/feature` and `/review` slash commands.
- Linked from `AGENTS.md` so any agent landing in this repo finds it on the first pass.

# Golden principles — mechanical rules

Each rule is enforceable by tooling. The doc-gardening agent (`/gc`) scans for violations and opens fix-up PRs. ESLint rules in `apps/web/eslint-rules/` enforce the subset that can be caught at lint time.

Each entry includes: the rule, **Why** (rationale), **How to apply** (detect + remediate).

---

## R1 — Parse at the boundary; never `as` cast across one

**Rule.** Every untrusted input (HTTP body, Inngest event payload, env var, OpenAI/fal/Tavily response) is parsed by a Zod schema before any field access. No `as` cast on input that crossed a process / process-boundary.

**Why.** Schemas are the contract between layers. Bypassing them lets bad data propagate four files deep before failing with a useless stack trace.

**How to apply.** Linter flags `as <Type>` casts in `app/api/*/route.ts` and `lib/motive/*.ts` where the source value originated from a `Request`, `event`, `process.env`, or an external SDK return. Remediate by adding a schema in `lib/motive/types.ts` or `extraction-schemas.ts` and using `Schema.parse(value)`.

---

## R2 — No `console.*` in app code

**Rule.** `console.log`, `console.warn`, `console.error` are banned outside `scripts/`. Use the structured logger from `lib/motive/log.ts`.

**Why.** Structured JSON with `request_id` is the only way to correlate logs across a five-phase extraction. Bare `console` calls drop everything that matters.

**How to apply.** ESLint rule `no-unstructured-log` flags violations and suggests the import path. Remediate by importing `log` from `lib/motive/log.ts` and calling `log.info({ request_id, ... }, "message")`.

---

## R3 — Domain services own data access — never call Supabase from routes / components

**Rule.** Files under `app/` and `components/` import only from `lib/motive/<domain>.ts`, never from `lib/motive/supabase-<domain>.ts` or `lib/supabase/` directly. Background workflows (`inngest/`) are allowed to call services and Supabase clients but not UI components.

**Why.** Layer rules (see `ARCHITECTURE.md` § Domain layers). Direct calls bypass audit-log writes and `request_id` threading.

**How to apply.** ESLint rule `no-cross-layer-import`. Remediate by extracting the call into a domain service that the route / component then invokes.

---

## R4 — Co-located test for every service / actions file

**Rule.** Every `*-service.ts`, `*-actions.ts`, or domain entry in `lib/motive/` has a sibling `*.test.ts`.

**Why.** Service code is where business logic lives and where regressions hurt most. A spec without a test is wishful thinking.

**How to apply.** ESLint rule `require-test-for-service`. Remediate by creating the test file with at least one happy-path and one error-path assertion.

---

## R5 — Reimplement small utilities rather than depend on opaque packages

**Rule.** Generic utility packages (`p-limit`, `lodash`, `ramda`, `uuid`, `nanoid` — `crypto.randomUUID` is fine) are not added without explicit justification in `DECISIONS.md`.

**Why.** Each new dependency reduces the agent's ability to predict behavior from reading the repo. Small in-repo helpers (`lib/motive/concurrency.ts`, `lib/motive/id.ts`) are easier to instrument, test, and modify.

**How to apply.** Doc-gardening agent diffs `package.json` against a known allowlist and warns on additions. Remediate by writing a 20-line helper in `lib/motive/` with 100% test coverage instead.

---

## R6 — Files in `lib/motive/` stay under 400 lines

**Rule.** Soft cap. Files crossing the threshold get a refactor PR opened by `/gc`.

**Why.** Agent context budget. A 1000-line service file forces the agent to load most of it just to add one method.

**How to apply.** `/gc` lists offenders. Remediate by splitting along sub-domain boundaries (e.g. `creatives.ts` → `creatives-generation.ts` + `creatives-review.ts`).

---

## R7 — Every `TODO` carries `(blocker: YYYY-MM-DD)` and an entry in `BLOCKERS.md`

**Rule.** `TODO` without a blocker tag is forbidden. Either fix it now or log it.

**Why.** Untagged TODOs are the entropy source. Tagged ones are a tracked backlog.

**How to apply.** `scripts/verify-doc-freshness.mjs` fails on `TODO` without `(blocker:`. Remediate by adding the tag and appending to `docs/agent-memory/BLOCKERS.md`.

---

## R8 — One `request_id` per entrypoint, threaded everywhere

**Rule.** See `RELIABILITY.md` Invariant 1. Public functions in `lib/motive/*.ts` accept `requestId: string` as the first parameter.

**Why.** Cross-layer correlation. Without it, the five-phase extraction is unobservable.

**How to apply.** Code review checks new public function signatures in `lib/motive/`. Future lint rule will flag automatically.

---

## R9 — Demo reset must be idempotent

**Rule.** `pnpm demo:reset` produces a byte-identical (modulo timestamps) DB state on repeated runs.

**Why.** Judges may demo five times in an hour.

**How to apply.** `scripts/verify-demo-reset.mjs` (future, see `tech-debt-tracker.md`) diffs `pg_dump --data-only` outputs across two consecutive resets.

---

## R10 — Generated docs are committed and regenerable

**Rule.** Anything under `docs/generated/` is produced by a script, committed, and verified by CI (`pnpm db:schema:doc -- --check` must produce no diff).

**Why.** The agent can use generated docs directly without re-deriving from migrations every session. The CI check prevents drift.

**How to apply.** `.github/workflows/ci.yml` runs the check on every PR. Remediate by running the generator locally and committing the diff.

---

## Adding a new rule

1. Append the rule with `Why` + `How to apply` to this file.
2. If mechanically detectable, add to an ESLint rule under `apps/web/eslint-rules/` or a script in `scripts/`. Wire into CI.
3. Update `AGENTS.md` only if the rule appears in first-pass scans; otherwise leave it for the GC agent to surface.

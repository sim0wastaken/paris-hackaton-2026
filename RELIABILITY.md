# RELIABILITY — Motive invariants

System-level invariants the agent must preserve on every change. If you find code that breaks one of these, it is a bug regardless of whether tests pass.

For each invariant: what it is, why it matters, where to enforce, how to detect a violation.

---

## Invariant 1 — One `request_id` threaded end-to-end

**What.** Every entrypoint (HTTP route, Inngest function, scheduled job) generates exactly one `request_id` (UUID v4 or ULID) and attaches it to: logs, every Supabase write in that flow, every Inngest event payload, and any OpenAI / fal.ai / Tavily call's `metadata` field.

**Why.** Without it, a five-phase OpenAI extraction is a forest of unrelated rows that no agent can debug.

**Enforce at.**
- `app/api/*/route.ts` — generate at handler entry, pass into the service.
- `inngest/functions/*.ts` — read from event payload; never re-generate inside a workflow.
- `lib/motive/<domain>.ts` — accept `request_id` as the first parameter on every public function.

**Detect.** A row in `extraction_runs` with `provider_payload->>'request_id'` not matching the source `request_id` is a violation. Grep `git diff` for new public functions in `lib/motive/` whose signature does not start with `requestId: string`.

---

## Invariant 2 — One audit-log write per mutation

**What.** Every state change to the 14 core tables writes one row to `human_reviews` (when actor is human) or `audit_log` (when actor is system; table not yet built — tracked in `docs/exec-plans/tech-debt-tracker.md`).

**Why.** Pioneer trains on human corrections vs. agent outputs. Story-driven KPIs depend on the ability to attribute changes.

**Enforce at.** `lib/motive/supabase-<domain>.ts` — every UPDATE / DELETE / status transition is paired with an insert.

**Detect.** Schema check: rows whose `updated_at > created_at` with no matching `human_reviews` or `audit_log` row referencing the same entity.

---

## Invariant 3 — Persist every provider payload

**What.** Every OpenAI / fal.ai / Tavily call persists the full request body and full response body to a JSONB field on the appropriate row before any post-processing.

**Why.** When extraction outputs are wrong, we need to be able to replay them without re-calling the model.

**Enforce at.**
- OpenAI extraction → `extraction_runs.provider_payload` (request + response).
- Creative generation → `creative_variants.provider_payload`.
- Tavily ingestion → `sources.provider_payload`.

**Detect.** Run with `OPENAI_API_KEY` set to a sentinel; verify each call's full payload is recoverable from the DB without hitting the API.

---

## Invariant 4 — Demo reset is idempotent

**What.** `pnpm demo:reset` returns the database to the seeded state regardless of how many times it ran or what state preceded it.

**Why.** Judges may demo Motive five times in an hour. Drift is a demo killer.

**Enforce at.** `scripts/demo-reset.mjs` + `app/api/demo/reset/route.ts`. Uses Supabase service-role key; truncates child tables before parents; reseeds from `supabase/seed.sql`.

**Detect.** Run the reset twice in a row; `pg_dump --data-only` outputs must be byte-identical (modulo timestamps).

---

## Invariant 5 — No spinner-only UX

**What.** Every long-running extraction streams partial results into the HITL workspace via Supabase Realtime or Inngest events. The UI never blocks on a multi-second op with only a spinner.

**Why.** Hackathon non-negotiable #14. Judges must see recap → features → conversations → intents → landing gaps → ad groups appear live.

**Enforce at.** `components/live-review-workspace.tsx`, `components/intake-workbench.tsx`. Any new long-running call adds a corresponding Realtime channel or Inngest event.

**Detect.** During demo, kill network mid-extraction; HITL should still show every phase that completed before the kill, not a blank screen.

---

## Invariant 6 — Story KPIs only, not random noise

**What.** Performance snapshots are computed from the quality of the underlying ad group and creative variant (copy strength, image archetype fit, landing-gap coverage), not from random number generators.

**Why.** Non-negotiable #15. Story-driven monitoring is a load-bearing demo asset.

**Enforce at.** `lib/motive/performance.ts`. Inputs: `ad_groups`, `creative_variants`, `landing_gaps`. Output: `performance_snapshots` rows with `kind = 'simulated'`.

**Detect.** Snapshot KPI variance for an identical project across runs must be near-zero (deterministic seeding from `project_id`).

---

## Invariant 7 — Boundary parsing with Zod

**What.** Every untrusted input (HTTP body, Inngest event, OpenAI response, environment variable) is parsed with a Zod schema at the boundary. Never `as` cast across a boundary.

**Why.** Schemas are the contract. Bypassing them lets bad data propagate four layers deep.

**Enforce at.** `lib/motive/types.ts`, `extraction-schemas.ts`, `app/api/*/route.ts`, `apps/web/src/env.ts`.

**Detect.** ESLint rule (planned, Pillar 3): flag `as` casts in route handlers and service entrypoints.

---

## Invariant 8 — Structured logging only

**What.** Every log line is structured JSON with at minimum: `level`, `request_id`, `actor`, `route`, `message`. `console.log` is banned outside `scripts/`.

**Why.** Logs need to be filterable by `request_id` for cross-layer debugging.

**Enforce at.** `lib/motive/log.ts` (helper). ESLint rule `no-unstructured-log` flags `console.*` in app code.

**Detect.** Run grep for `console\.\(log\|warn\|error\)` in `apps/web/src/`. Should be zero in service code.

---

## Invariant 9 — Pinned versions, never `latest`

**What.** Every dep in `package.json`, every Docker tag in `supabase/config.toml`, every infra image references an exact known-good version. Rationale logged in `docs/agent-memory/VERSIONS.md`.

**Why.** Non-negotiable #9. `latest` breaks demos.

**Enforce at.** `package.json`, `supabase/config.toml`, `.github/workflows/*.yml`.

**Detect.** `grep -E '"\^|~|latest"' package.json apps/*/package.json | grep -v -E '"\^?\d'` should return only intentional ranges.

---

## Invariant 10 — Inngest events carry the same `request_id` end-to-end

**What.** When a route fires an Inngest event, the event payload includes the route's `request_id`. The Inngest function reads it from `event.data.request_id` and uses it for the entire workflow, including any sub-events it fires.

**Why.** A multi-step Inngest workflow with its own `request_id` per step is unobservable.

**Enforce at.** `inngest/functions/*.ts`, `inngest/events.ts`.

**Detect.** Trace a single extraction in Inngest dev UI; verify all spans carry the same `request_id` from intake to creatives.

---

## Where this is checked

Until full audit-log and lint coverage land, these invariants are enforced by:
- Code review (agent-to-agent via `/review`)
- ESLint rules in `apps/web/eslint-rules/` (Pillar 3 of the harness plan)
- `scripts/verify-spec2-schema.mjs` (data shape consistency)
- CI workflow `.github/workflows/ci.yml`

Open items tracked in `docs/exec-plans/tech-debt-tracker.md`.

# Motive (`paris-hackaton-2026`) — Patterns & Architecture Reference

> **Purpose.** This report is a training artefact for agentic-coding teams. It catalogs what was built in this repository, the technical patterns that produced it, the anti-patterns that were avoided or corrected, and the state of the art as of **June 2026**. The intent is reference, not advocacy — every claim is grounded in a file path or a public version source.
>
> **Audience.** Engineers and team leads who deliver software through long-running AI agents. The patterns are not Motive-specific; they are exemplars of how to make a codebase, an agent harness, and an external-API stack co-operate.
>
> **Reading order.** Sections 1–3 are factual scope. Section 4 is the architectural core. Sections 5–8 are the operational patterns most worth lifting. Section 9 is anti-pattern / best-pattern pairs. Section 10 is the SOTA delta. Section 11 is the distilled takeaway list.

---

## 1. Project snapshot

**Codename.** Motive — a campaign workbench that ingests a brand URL, runs five-to-eight OpenAI extraction phases into a persisted human-in-the-loop (HITL) workspace, generates ad groups and creatives, then closes the loop with a fake deploy and a story-driven monitoring dashboard.

**Status at audit (2026-06-03).** The Paris AI Hackathon demo shipped on 2026-05-16. From 2026-05-18 onward the work continued in "founder mode": a design-system rebuild on React Aria Components + motion, a Codex-playbook harness upgrade (custom ESLint rules, CI, llms.txt cache, slash commands, doc-gardening skill), a Tavily crawl + search brand-discovery pipeline (ADR-0006) later refactored onto `@tavily/core` (ADR-0007), and a `.server.ts` / `.client.ts` file-suffix split that promoted the layer-import lint rule from `warn` to `error`. The repo is GitNexus-indexed at 3 468 symbols / 5 526 relationships / 165 execution flows (`.gitnexus/meta.json`).

**Lines & shape.**
- One pnpm workspace at root, package manager pinned to `pnpm@11.1.2`.
- Two apps: `apps/web/` (Next.js 16 App Router + serverless route handlers + Inngest) and `apps/landing/` (now reduced to one page after `1209891 refactor(web): marketing → /, intake → /intake; remove apps/landing`).
- One internal package: `packages/design-system/` (`@motive/ds`).
- 14 core Postgres tables, 3 migrations, full RLS, one `SECURITY DEFINER` RPC for HITL review actions.
- 73 commits total at audit time (`git log | wc -l`), with the demo-day path delivered in a single dense burst on 2026-05-16, then two distinct "harness upgrade" and "design-system v2" pushes.

**Data flow (`docs/agent-memory/STACK.md`).**

```
[URL / shop / social]
        ↓
[Next.js persisted intake + source status]
        ↓
[Tavily crawl+search → OpenAI extraction (5 phases, Structured Outputs)]
        ↓
[Realtime HITL review as phases complete]
        ↓
[Ad groups (OpenAI) → Creative variants (OpenAI text + fal.ai assets)]
        ↓
[Fake deploy → story-driven monitoring (deterministic scoring + GPT narration)]
        ↓
[Stored labels + human_reviews + performance_snapshots → future classifier corpus]
```

---

## 2. Progress timeline (`0 → current state`)

The timeline is reconstructed from `git log` and `docs/agent-memory/PROGRESS.md`. Tags follow the repo convention: `START`, `DONE`, `STUB`, `FIX`, `REFACTOR`, `NOTE`, `COMMIT`.

### Phase A — Scaffolding & knowledge layout (2026-05-16, ≈ 10:20 → 11:15 UTC)
- **Knowledge-management scaffolding** installed (`CLAUDE.md`, `AGENTS.md`, `RUNBOOK.md`, `.claude/{settings.json,hooks/*.sh}`, `docs/agent-memory/{PROGRESS,DECISIONS,BLOCKERS,VERSIONS,STACK,SECRETS,PERF}.md`, `docs/briefing-files/index.md`).
- **Product direction crystallized.** ADR-0001 (Pioneer-first classifier) → ADR-0002 supersedes it with "OpenAI-first v1, Pioneer post-v1". ADR-0003 commits to streaming HITL + story KPIs.

### Phase B — Foundation (2026-05-16, 13:00 → 13:30 UTC)
- **Spec 02 — database contract.** 14-table core migration, complete provider-free seed, TypeScript/Zod schema, static verifier. Applied to a real local Supabase stack: `supabase db reset --yes`, `db lint --fail-on error`, `db advisors --fail-on warn` all pass.
- **Spec 01 — Next.js scaffold.** App Router shell, Tailwind, env validation (`apps/web/src/lib/env.ts`), Supabase browser/server/service-role boundaries, provider wrappers, Inngest registration. Verified `test`, `typecheck`, `lint`, `build`, intake/review smoke, mobile layout smoke.

### Phase C — Core loop (2026-05-16, 13:52 → 16:33 UTC)
- **Spec 03 — intake/source ingestion.** `POST /api/projects` → service-role repository → queued `motive/source.ingest.requested` event → Inngest worker → Tavily Extract when configured → routes to `/projects/:id/review`.
- **Spec 04 — streaming OpenAI extraction.** Inngest `motive-extraction-pipeline` creates 6 phase `extraction_runs` rows, Zod phase schemas via OpenAI Structured Outputs, deterministic demo fallback without API keys, materializes brand features / conversations / intents / landing gaps / draft ad groups. Live workspace with Supabase Realtime + polling fallback.
- **Spec 05 — live HITL review.** Atomic `review_entity_action` Postgres RPC (`SECURITY DEFINER`, `search_path` pinned), `POST /api/projects/:id/reviews`, `human_reviews` audit rows, optimistic-concurrency `expectedUpdatedAt` gate, row-level approve/edit/reject/enrich on every domain entity.
- **Production deploy.** Vercel CLI 54.1.0, project linked, Supabase via Vercel Marketplace (`supabase-amber-harbor`, `cdg1` region, 16 env vars auto-injected). Root Directory fixed via `PATCH /v9/projects` (instead of dashboard click-through). Schema applied with `psql` against `POSTGRES_URL_NON_POOLING` to skip the browser-OAuth `supabase login` flow. Inngest registered with one `PUT /api/inngest`. ADR-0004 records the decision tree.
- **Spec 06 — ad-group generation.** Approved-evidence contract, OpenAI Structured Outputs path, deterministic fallback, campaign + ad-group materialization, generate controls inside the review workspace.
- **Spec 07 — creative generation.** Creative contract + demo fallback + Supabase materialization, `POST /api/projects/:id/creatives`, fal.ai client wrapper, Creatives workspace with realtime + polling + approve/edit/reject. Migration `…0003_creative_review_actions.sql` extends the RPC to handle creative variants.
- **Spec 08 — fake deploy + story monitoring.** Deploy contract, OpenAI Ads-shaped payload validation, deterministic simulated-KPI scoring (`performance.ts`), optional OpenAI monitoring synthesis, monitoring dashboard with KPI cards, CSS comparison bars, outcome table, realtime + polling.
- **Spec 09 — seeded demo resilience.** Deterministic AtlasDesk fixture, reset/replay orchestration, guarded `/api/demo/reset` + `/api/demo/replay`, Inngest `demo/extraction.replay.requested`, `pnpm demo:reset`, `DEMO_MODE=live|seeded|auto`.

### Phase D — Polish for demo (2026-05-16, late) → submission
- "Demo fix and approve all" sequence (commits `7cc51d1`, `ebb13f8`), `submission/` deliverables and parser for the Responses output (`e62533e`), project-explorer UI / API (`0305ddd`), vertical-expert framework fields (`b514f76` — adds Schwartz awareness, copy formulas, hook archetypes, Gartner buying jobs, Moesta forces, CXL heuristic axes, Cialdini principles, image composition archetypes as Zod enums in `lib/motive/types.ts:96–179`).

### Phase E — Founder-mode hardening (2026-05-18)
- **Design system v2.** Rebuild on React Aria Components + motion with the full state surface (idle / hover / pressed / focus-visible / disabled / loading / success / error), 39 primitives, motion utilities (Reveal / Press / Magnetic / AutoAnimate), wired QueryProvider, Zustand UI store, MotiveProviders shell, `useAsyncAction` hook, Sonner toasts, showcase at `/design-system`.
- **Harness upgrade (ADR-0005 — "Apply the OpenAI Codex playbook to Motive").** Six commits:
  1. Delete stale `.codex/hooks.json` with broken absolute paths.
  2. Split agent-legibility surface: `AGENTS.md` becomes a 90-line TOC; depth lives in `ARCHITECTURE.md`, `RELIABILITY.md`, `SECURITY.md`, `QUALITY_SCORE.md`, `docs/design-docs/{core-beliefs,golden-principles}.md`; plans move to `docs/exec-plans/{active,completed}/` + `tech-debt-tracker.md`.
  3. Deterministic `scripts/generate-db-schema-doc.mjs` → `docs/generated/db-schema.md`; `scripts/verify-doc-freshness.mjs`; seven cached `llms.txt`-style library cheatsheets in `docs/references/`.
  4. Two custom ESLint rules (`motive/no-cross-layer-import`, `motive/no-unstructured-log`), structured logger at `lib/motive/log.ts`, `.github/workflows/ci.yml` running lint → typecheck → test → doc-freshness on every PR.
  5. Two new hooks (`session_start_load_context.sh`, `post_edit_layer_check.sh`) + four slash commands (`/feature`, `/review`, `/gc`, `/grade`).
  6. Doc-gardening skill at `.claude/skills/doc-gardening/SKILL.md`.

### Phase F — Intake refactor & SDK adoption (2026-05-19)
- **ADR-0006 — Tavily crawl + search brand discovery.** Replace single-call `tavily.extract` with a brand-discovery orchestrator: hand-tuned crawl with path allow/block lists → Zod-validated → per-page markdown pruning (image strip, social-link strip, cookie-banner heuristic, dedupe, 10 K char cap) → search for third-party context → persist N source rows linked via a new `parent_source_id` column → emit one `extractionRequested` with the full list. Default extraction model bumped to `gpt-5.5`.
- **ADR-0007 — `@tavily/core` SDK adoption.** Replace direct-`fetch` provider wrapper with the official SDK. Drop redundant Zod schemas (SDK types now drive option/response surface). Test isolation moves to an injected `TavilyClient` stub on `ProviderOptions.tavilyClient`.
- **`.server.ts` / `.client.ts` layer split** (`refactor(motive): split data-access into .server.ts and add .client.ts subscriptions`, `chore(lint): retarget no-cross-layer-import to .server/.client and promote to error`). The layer-import rule moves from `warn` to `error`. The realtime subscription helpers live in `*.client.ts`, the server-only data access in `*.server.ts`, with the public domain entry as a plain `*.ts` re-exporter when needed.
- **`pnpm setup:env` bootstrap script** (`scripts/setup-env.mjs`): reads `supabase status -o env`, writes `apps/web/.env.local` from `.env.example` placeholders.

### Status as of 2026-06-03
The product runs in production at `paris-hackaton-2026.vercel.app`. Three live blockers in `BLOCKERS.md` (self-improving-loop scope, Pioneer deferred, demo UX risks resolved). Six tech-debt items in `tech-debt-tracker.md` (audit-log table, port allocation, full `request_id` Inngest threading, demo-reset idempotency verification, missing `/qa-flow` command, 23 layer-import warnings now at `error` after the refactor).

---

## 3. Tech stack inventory

Pin = what `apps/web/package.json` / `docs/agent-memory/VERSIONS.md` declare. Latest = current stable as of **2026-06-03**. The "Pattern" column names the lesson; Section 10 discusses each delta in detail.

| Concern | Pin | Latest (Jun 2026) | Status | Pattern |
|---|---|---|---|---|
| App framework | `next@16.2.6` (App Router) | `16.2.7` | slight lag (one patch) | Server components + serverless route handlers; React Compiler is now on by default in 16. |
| UI runtime | `react@19.2.6`, `react-dom@19.2.6` | `19.2.7` | slight lag | Server / client components; `useSyncExternalStore` used for SSR-safe state probes (e.g., command-palette hotkey glyph). |
| Language | `typescript@6.0.3` | 6.0.x (TS 6 GA Mar 2026; last JS-based release before the Go-native TS 7) | current line; verify exact patch | `target` default ES2023, `module` ESNext, `types: []` default (~20–50 % faster builds). |
| Lint | `eslint@9.39.4` + `eslint-config-next@16.2.6` | `10.4.1` (v9 EOL **2026-08-06**) | **significant lag — migrate before Aug** | Flat config still default; `includeIgnoreFile()` moved from `@eslint/compat` → `@eslint/config-helpers`. |
| Styling | `tailwindcss@4.3.0` + `@tailwindcss/postcss@4.3.0` | `4.3.0` | current | CSS-first config (`@theme inline { ... }`), no `tailwind.config.{js,ts}`, `@source` globs declared in CSS. |
| Validation | `zod@4.4.3` | 4.x active | current within 4.x | Boundary-parsing-only philosophy. Zod 4 unifies `error` parameter, lifts `z.email()` / `z.uuid()` / `z.url()` to top-level. |
| DB client | `@supabase/supabase-js@2.105.4` + `@supabase/ssr@0.10.3` | `supabase-js@2.107.0`, `ssr@0.10.3` | ssr current; js slight lag (~2 minors) | `@supabase/server` is the announced successor to `ssr` — watch list, not urgent. |
| Workflow runtime | `inngest@4.4.0` + `inngest-cli@1.19.4` | SDK v4 GA Mar 2026 | current | Event-driven workflows; one `motive-extraction-pipeline` with `concurrency.key: "event.data.projectId"` and `retries: 3`. |
| LLM client | direct `fetch` against `https://api.openai.com/v1/responses` (no SDK in repo) | `openai-node@6.41.0` (recommends Responses API + Structured Outputs + GPT-5.5 as the 2026 default) | functional, but moving to the official SDK is the standard path | Schema-first Structured Outputs; the wrapper strips `minLength` / `maxLength` / `pattern` / `format` / `minimum` / `maximum` / `multipleOf` / `patternProperties` / `minItems` / `maxItems` from the JSON Schema because strict mode rejects them. |
| Media generation | `@fal-ai/client@1.10.1` | `1.10.1` | current | FLUX.2 family for image, Veo 3.1 / Kling 3.0 Pro for video are SOTA on fal as of Jun 2026. |
| Web data | `@tavily/core@0.7.3` | `0.7.x` line | current (verify in lockfile — search results lag at 0.7.2) | Crawl + Search + Extract orchestration; the new Tavily Research endpoint warrants a pilot. |
| State / data | `@tanstack/react-query@^5.100.10`, `zustand@^5.0.13` | `react-query@5.101.0`, `zustand@5.0.14` | current | Server cache (TanStack) + transient UI store (Zustand, `persist`-partialized). |
| Motion | `motion@^12.38.0` (the rename of `framer-motion`) | `12.40.0` | current | `LayoutGroup` + `layoutId` for shared-element animations; `useMotionValue` + `useSpring` for cursor-pull primitives. |
| Forms | `react-hook-form@^7.76.0`, `@hookform/resolvers@^5.2.2` | RHF `7.77.0`, resolvers `5.4.0` | slight lag (one minor); RHF 8.x in beta — stay on 7. | Standard-Schema resolvers integrate with Zod 4 / Valibot / ArkType identically. |
| Toasts | `sonner@^2.0.7` | `2.0.7` | current | shadcn-ecosystem default. |
| Tests | `vitest@4.1.6` | `4.1.8` (patch lag); `5.x` is the active branch | slight lag on patch; v4.1 is in backport-only mode | Node-env tests, no jsdom; component tests use `renderToStaticMarkup` to assert against HTML strings. |
| Icons | `lucide-react@1.16.0` | `1.17.0` | slight lag | Additive minors only. |
| Package mgr | `pnpm@11.1.2` | `11.3` | slight lag (2 minors) | v11 requires Node 22+; store is a single SQLite DB; native publish; `minimumReleaseAge` supply-chain guard on by default. |
| Runtime | local `node@25.9.0` (verification artefact, not deploy target) | **Node 25 EOL on 2026-06-01** — Node 24 is Active LTS; Node 26 GA on 2026-05-05 entering LTS in Oct 2026 | **EOL — highest-priority finding** | Pin local + CI to Node 24 LTS for now. |
| DB CLI | `supabase@2.98.2` (devDep) | `2.104.0` | slight lag | Rolling-release CLI; safe to bump. |

**External providers (functional roles).**

| Provider | Used for | Env keys | Persistence target |
|---|---|---|---|
| OpenAI | Source recap, feature map, conversation map, intent classification, landing gaps, ad groups, creative text, monitoring synthesis. | `OPENAI_API_KEY` | `extraction_runs.input_json` + `output_json`, plus `creative_variants.provider_*_json` and `performance_snapshots.provider_*_json` (RELIABILITY Invariant 3). |
| fal.ai | Image / video assets for `creative_variants`. | `FAL_KEY` | `creative_variants.provider_request_json` + `asset_url` + `asset_storage_path`. |
| Tavily | Brand-site crawl + third-party search + per-URL extract (basic / advanced). | `TAVILY_API_KEY`, `TAVILY_CRAWL_MAX_DEPTH`, `TAVILY_CRAWL_LIMIT`, `TAVILY_SEARCH_MAX_RESULTS` | `sources.provider_request_json` + `provider_response_json`. |
| Supabase | Postgres + RLS + Realtime + Auth + Storage (provisioned via Vercel Marketplace). | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`. | All 14 core tables. |
| Inngest | Background workflows (extraction, creatives, demo replay, monitoring). | `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_DEV`. | `extraction_runs.inngest_run_id`. |
| Vercel | Hosting + preview-per-PR. | (Vercel-managed) | — |

---

## 4. Architectural patterns (the load-bearing core)

### 4.1 Domain layering with file-suffix enforcement

The architecture (`ARCHITECTURE.md § Domain layers`) is a four-layer DAG; cross-layer back-edges are bugs. The 2026-05-19 refactor encoded the boundary as **file-suffix conventions** rather than directory conventions:

| Suffix | Role | Allowed imports |
|---|---|---|
| `lib/motive/<domain>.ts` | Pure / shared types, schemas, helpers; safe in both server and client. | other `*.ts`, `lib/motive/types.ts`, `extraction-schemas.ts` |
| `lib/motive/<domain>.server.ts` | Service + data-access. Uses `createSupabaseServiceRoleClient()`. | the matching `.ts`, other `*.server.ts`, `lib/supabase/*`, `inngest/*` |
| `lib/motive/<domain>.client.ts` | Browser-only Supabase subscriptions, polling helpers. | the matching `.ts`, `lib/supabase/browser.ts` |
| `app/api/*/route.ts` | Entry layer. Parses request, threads `requestId`, calls services. | `lib/motive/*.{ts,server.ts}`, `inngest/*` |
| `components/` | Presentational only. | `lib/motive/*.{ts,client.ts}` (no `.server.ts`, no `lib/supabase/*`) |

**Enforcement (`apps/web/eslint-rules/no-cross-layer-import.mjs`).** The rule is a data-driven list of `(sourceMatcher, importMatcher, message)` tuples. Every message ends with a doc cross-reference. A representative entry:

```js
{
  sourceMatcher: /\/src\/lib\/motive\/[^/]+\.client\.ts$/,
  importMatcher: /\/lib\/motive\/[^/]+\.server(?:\.ts)?$/,
  message:
    "Client modules (*.client.ts) must not import server modules (*.server.ts) — that would bundle server code into the client. See ARCHITECTURE.md § Domain layers.",
}
```

The visitor handles both `ImportDeclaration` and `ImportExpression` (dynamic imports). Path alias `@/foo` is normalized to `/src/foo` before regex match. Bare specifiers are skipped. Severity is `error` (promoted from `warn` on 2026-05-19).

**Best-pattern lesson.** Encode the architectural diagram as a lint rule. Suffix-by-convention scales better than directory-by-convention because the agent never has to walk the tree to figure out which layer it sits in.

### 4.2 Schema-first contract (`lib/motive/types.ts`, `extraction-schemas.ts`)

Every untrusted boundary is parsed with Zod. The contract is layered:

1. **Enum values exported as `const arrays`** (`projectStatusValues`, `sourceTypeValues`, etc.) so the Postgres enum, the Zod schema, and the TypeScript union all derive from one source.
2. **Row schemas extend a `baseRowSchema`** (`id`, `created_at`, `updated_at`) with table-specific fields.
3. **A computed `Database` type** at the bottom of `types.ts` (lines 521–550) feeds `createClient<Database>()` for typed Supabase calls.
4. **Phase-specific output schemas** (`extraction-schemas.ts`) define what the LLM must return per phase — `confidenceLabelSchema` is reused, optional fields are explicitly `nullable()` so older fixtures keep parsing, and anti-hallucination guards are first-class enums (`fix_artifact_status: present_in_source | request_from_brand` for landing gaps; `runner_up_stage` + `runner_up_reason` for intent classification as a chain-of-verification hook).
5. **`openAiAdsExportSchema`** mirrors OpenAI's Ads campaign shape (`campaign`, `ad_groups[]`, `ads[]`) so creative export is contract-checked before the fake deploy writes a snapshot.

**Best-pattern lesson.** Schemas are the contract. Bypassing them with an `as` cast across a boundary (`as { ... }` after a `Request.json()`) is the highest-cost bug class in agent-driven codebases because the error surfaces four layers deep.

### 4.3 14-table data model + RLS

Tables (`docs/generated/db-schema.md`): `projects`, `sources`, `extraction_runs`, `brand_features`, `conversations`, `landing_gaps`, `campaigns`, `ad_groups`, `creative_variants`, `human_reviews`, `deployments`, `performance_snapshots`, `product_feeds`, `product_feed_items`.

Schema decisions worth lifting:

- **UUID PKs + paired `created_at` / `updated_at`** on every row (`baseRowSchema` mirror).
- **Provider payload columns** as `jsonb not null default '{}'::jsonb` on every table that talks to an external API (`sources.provider_request_json`, `extraction_runs.input_json` + `output_json`, `creative_variants.provider_*_json`, `performance_snapshots.provider_*_json`). RELIABILITY Invariant 3 forbids any provider call that doesn't persist the full request/response.
- **`metadata jsonb not null default '{}'`** on every table as the "extension point" for fields not in the schema yet — keeps migration churn down.
- **CHECK constraints in SQL** rather than only in app code: `creative_variants.title char_length(...) between 3 and 50`, `description <= 100`, `quality_score between 1 and 100`, `performance_snapshots.clicks <= impressions` and `conversions <= clicks`. The database refuses bad data even if the route handler regresses.
- **Workflow-friendly composite indexes:** `(project_id, created_at desc)` is the universal "list latest in a project" index; `(project_id, status)` and `(project_id, review_status)` cover the filtered views; GIN indexes on `conversations.constraints_json` and on `ad_groups.conversation_ids / context_hints / product_feed_item_ids` array columns.
- **`unique (project_id, phase, attempt)` on `extraction_runs`** so retries write a new row instead of clobbering the prior attempt.
- **`gen_random_uuid()`** from `pgcrypto` for PK defaults (rather than relying on app-side UUID generation).
- **RLS on every table** (lines 552–565 of the core migration). Pattern: `using (exists (select 1 from public.projects where projects.id = <table>.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))`. The `owner_user_id is null` branch is what enables the public hackathon demo without auth; in production it would be removed and replaced with a tenant-scoped policy.
- **Postgres enums for every status / phase / kind** (`project_status`, `source_type`, `extraction_phase`, `run_status`, `review_status`, etc.). Adding a value is an explicit `alter type ... add value`, which is a tiny change the agent can read; representing the same as `text` would leak typo-status into the schema.

### 4.4 Atomic HITL mutation via Postgres RPC

The single most concentrated piece of business logic in the repo is `public.review_entity_action` (`supabase/migrations/202605160002_review_actions.sql`, extended in `…0003_creative_review_actions.sql`):

- **`security definer`** with `set search_path = public, auth` — the route can run it through the anon client without escalating privileges in app code.
- **Entity-type-specific patch validation** built into the function. Each `when 'brand_feature' then ...` branch lists the columns that `edit` / `enrich` may touch and raises `invalid_review_patch: unsupported brand_feature fields %` on any other key. The route layer never has to maintain that list.
- **Optimistic concurrency** via `p_expected_updated_at` — when provided, the function checks the row's current `updated_at` and raises `review_conflict` on mismatch. The client (`LiveReviewWorkspace.submitReview`) reads the row's `updated_at` and sends it along so two concurrent reviewers cannot silently overwrite each other.
- **One insert into `human_reviews` per call**, capturing `before_json` and `after_json`. The audit log is a side-effect of the mutation, not a separate write the caller could forget.

**Route handler (`apps/web/src/app/api/projects/[projectId]/reviews/route.ts`)** stays under 50 lines because the heavy lifting is in the RPC. It maps SQL `raise exception` messages to HTTP codes (`review_entity_not_found` → 404, `review_conflict` → 409, `invalid_review_patch` → 400) and lets everything else become a 500.

**Best-pattern lesson.** Push transactional invariants (audit-log writes, concurrency checks, field whitelists) into one Postgres function. The route handler becomes thin; the audit trail becomes a database invariant rather than a programming discipline.

### 4.5 Server / client boundary

Two Supabase client factories, intentionally separate:

- **`lib/supabase/server.ts`** — wraps `@supabase/ssr`'s `createServerClient` with Next 16 `cookies()` integration; uses the *publishable* key, runs as the requesting user under RLS.
- **`lib/supabase/service-role.ts`** — `import "server-only";` (line 1) guards the module so any client bundle that pulls it triggers a build-time error; uses `SUPABASE_SERVICE_ROLE_KEY` with `persistSession: false, autoRefreshToken: false`.

**Env parsing (`lib/env.ts`).** Two schemas:

```ts
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString,
  NEXT_PUBLIC_APP_URL: requiredString,
});
const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  DATABASE_URL: requiredString,
  OPENAI_API_KEY: optionalString,
  // ...
});
```

`requireServerEnv()` throws an `EnvValidationError` that lists every missing key with its formatted Zod issue — so the agent reading a CI failure can fix all problems in one pass instead of one-per-rerun. The `booleanFromEnv` preprocess converts `"1" / "true" / "yes" / "on"` → `true` and `"0" / "false" / "no" / "off"` → `false`, which removes the most common env-parsing bug (string `"false"` being truthy).

### 4.6 Provider wrapper pattern

`lib/providers/openai.ts`, `tavily.ts`, `fal.ts` follow one shape: a `ProviderOptions` injection seam and a `ProviderResult<T>` discriminated union (`{ status: "ready" | "skipped" | "failed", ... }`).

```ts
export async function generateOpenAIStructuredObject<T>(
  input: { prompt, requestId, schema, schemaName, system? },
  options: ProviderOptions & { model?: string } = {},
): Promise<ProviderResult<{ object: T; model; responseId; usage }>> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_EXTRACTION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const fetcher = options.fetcher ?? fetch;
  if (!apiKey) return { provider: "openai", status: "skipped", reason: "OPENAI_API_KEY is not configured", requestId };
  // ...
}
```

Three patterns worth lifting:

1. **`status: "skipped"` is a first-class outcome.** Missing keys do not crash the route; they return a structured "skipped" so the deterministic / demo fallback path can run.
2. **`fetcher` / `tavilyClient` injection** keeps tests independent of network mocking. Tests pass a stub that resolves to a canned `Response` or a stub `TavilyClient`; production passes nothing and gets the real one.
3. **`requestId` is always returned** alongside the result so the caller can persist it into the row's `provider_request_json` without a second look-up.

The OpenAI wrapper additionally **strips strict-mode-incompatible JSON-Schema keywords** before sending to Structured Outputs:

```ts
const unsupportedStrictSchemaKeywords = new Set([
  "minLength","maxLength","pattern","format","minimum","maximum","multipleOf",
  "patternProperties","minItems","maxItems",
]);
```

This is the kind of platform quirk that costs hours when you hit it cold. Encoding it in one helper means every phase schema benefits.

### 4.7 Streaming HITL via Supabase Realtime + polling fallback

A single 28-line helper (`lib/motive/realtime.client.ts`) drives all three live dashboards:

```ts
export function subscribeToProjectTables<Table extends string>({
  projectId, tables, channelName, onRow, onStatus,
}: { ... }) {
  const channel = supabase.channel(channelName);
  for (const table of tables) {
    channel.on("postgres_changes",
      { event: "*", schema: "public", table, filter: `project_id=eq.${projectId}` },
      ({ new: row }) => { if (row?.id) onRow(table, row); });
  }
  channel.subscribe(s => onStatus?.(s === "SUBSCRIBED" ? "live" : "polling"));
  return () => { supabase.removeChannel(channel); };
}
```

Per-domain wrappers (`reviews.client.ts`, `creatives.client.ts`, `deployments.client.ts`) each declare a `const TABLES = [...] as const satisfies readonly Table[]` and re-export typed subscriptions. The consumer pages (`live-review-workspace.tsx`, `creative-grid.tsx`, `monitoring-dashboard.tsx`) run **both** a polling interval and the subscription. Two of the three skip polling while `connection === "live"`; the third (`live-review-workspace`) polls unconditionally — a small inconsistency Section 9 flags.

The UI status pill flips between **Realtime live** (CheckCircle2, acid-green) and **Polling updates** (RefreshCw, cyan) without any "loading" flicker. The phase rail recomputes from `counts` and `runs` via `useMemo`, so every realtime row that lands just causes the rail to re-render.

**Best-pattern lesson.** Treat realtime as the primary path and polling as the backstop, not the other way around. The cost of a stale row is minutes of confused HITL operators; the cost of redundant polling is a single DB query per project per few seconds.

### 4.8 Inngest event-driven workflow

`apps/web/src/inngest/extraction.ts` is the canonical example:

```ts
export const extractionPipeline = inngest.createFunction(
  {
    id: "motive-extraction-pipeline",
    triggers: [{ event: MOTIVE_EVENTS.extractionRequested }],
    concurrency: { limit: 1, key: "event.data.projectId" },
    retries: 3,
  },
  async ({ event, step }) => {
    return step.run("run-spec-04-extraction-pipeline", async () => {
      const { runExtractionPipeline } = await import("@/lib/motive/extraction");
      const { createSupabaseExtractionRepository } = await import("@/lib/motive/extraction.server");
      const { generateOpenAIStructuredObject } = await import("@/lib/providers/openai");
      return runExtractionPipeline(
        { projectId: String(event.data.projectId), sourceIds: ..., requestId: String(event.data.requestId ?? crypto.randomUUID()), demoMode: ... },
        { repository: createSupabaseExtractionRepository(), provider: { isConfigured, generate } },
      );
    });
  },
);
```

Patterns to lift:

1. **`concurrency.key: "event.data.projectId"`** — at most one extraction in flight per project. Spam clicks on "extract" never queue up duplicate runs.
2. **`retries: 3`** — Inngest's built-in retry, no in-app retry logic needed.
3. **`step.run("...")` wraps the entire pipeline** — Inngest treats it as one durable step; if the worker crashes mid-pipeline the next attempt re-runs the whole thing rather than partial-fail.
4. **Dynamic `await import(...)` inside the step** — keeps the route bundle small (the heavy domain code only loads when the worker actually runs) and avoids importing server-only code into the Inngest registration path.
5. **Events are namespaced and centralised** in `inngest/events.ts`:

   ```ts
   export const MOTIVE_EVENTS = {
     projectCreated: "motive/project.created",
     sourceIngestRequested: "motive/source.ingest.requested",
     extractionRequested: "motive/extraction.requested",
     creativesRequested: "motive/creatives.requested",
     fakeDeploymentRequested: "motive/deployment.fake_requested",
     monitoringRequested: "motive/monitoring.requested",
     demoExtractionReplayRequested: "demo/extraction.replay.requested",
   } as const;
   ```

6. **The route handler is a pure dispatcher** (`app/api/projects/[projectId]/extract/route.ts`):
   - Zod-parse the body (`extractRequestSchema`).
   - Generate the `requestId` if the caller didn't provide one.
   - Fetch processed source IDs via the repository, reject with `409 no_processed_sources` if empty.
   - `inngest.send(...)` and wrap the call in try/catch to translate failures to `503 extraction_job_not_started`.

   The route never directly mutates state; the worker does. The route's only job is to validate, persist intent, and acknowledge.

### 4.9 Deterministic-then-LLM scoring (story KPIs)

`lib/motive/performance.ts` shows the pattern that satisfies RELIABILITY Invariant 6 ("story KPIs, not random noise"):

1. **Deterministic build first** (`buildDeterministicPerformanceOutput`). Inputs: the deployed package's `ad_groups`, `creative_variants`, `landing_gaps`. Outputs: `performance_snapshots` rows with `snapshot_kind = 'simulated'` and a `quality_score` driven by hard-coded but qualitative `ScoreComponent`s (e.g., copy specificity, landing-gap coverage, intent fit).
2. **Optional LLM narration on top.** A system prompt voiced as "a senior B2B SaaS growth marketer narrating a Monday-morning paid-social review" rewrites only the `insight`, `recommended_action`, `notes`, `recommended_owner`, and `dashboard_summary` fields. Numeric metrics other than `quality_score` are explicitly off-limits.
3. **Self-check schema fields:** `tied_to_hypothesis`, `names_one_bet`, `acknowledges_simulation`, `prose_not_numbers`. The model emits booleans; the UI can surface failures.
4. **Banned-puff list in the prompt:** "revolutionary, supercharge, leverage, unlock, seamless, game-changing, 10x, empower, streamline." The model is told once; the test enforces.
5. **Insight → Action → Owner shape.** Every snapshot is voiced in this trio (`recommendedOwnerRoleValues = ["growth_pm", "creative_lead", "landing_page_owner", "lifecycle_owner"]`). The schema is the discipline.

**Best-pattern lesson.** Separate "what's true" (deterministic scorer) from "how it sounds" (LLM narration). The LLM does what only LLMs can do (prose); the code does what only code can do (correctness).

### 4.10 Vertical-expert framework as enums

`lib/motive/types.ts:96–179` encodes a stack of established marketing frameworks as Zod enums, then references them across phase schemas:

- Schwartz 5 awareness levels (`awarenessLevelValues`)
- Direct-response copy formulas (`copyFormulaValues`: PAS / BAB / FAB / 4Us / PASTOR)
- Hook archetype taxonomy (`hookArchetypeValues`)
- Image composition archetypes for FLUX paid-social ads (`imageCompositionArchetypeValues`)
- Paid-social funnel stage (`funnelStageValues`: tofu / mofu / bofu)
- Gartner B2B buying jobs (`buyingJobValues`)
- Bob Moesta Forces of Progress (`forceTagValues`)
- CXL ResearchXL heuristic axes (`heuristicAxisValues`)
- Cialdini's six principles (`cialdiniPrincipleValues`)
- Notional owner roles for the monitoring narrative (`recommendedOwnerRoleValues`)

These aren't "labels the LLM might use" — they're closed enums. The Structured Outputs response is rejected if the LLM invents a value. Domain expertise becomes a typed constraint.

**Best-pattern lesson.** When you want an LLM to operate inside a framework (Cialdini, Gartner, Moesta, whatever), bake the framework's vocabulary into the schema. The model cannot drift.

---

## 5. Agent harness as product

The repository treats the agent's environment — file layout, hooks, lints, slash commands, CI gates — as the product. The ADR-0005 lineage explicitly traces this to the OpenAI Codex playbook ("ship software with no hand-written code by treating the harness as the actual product").

### 5.1 Knowledge graph (lean TOC + dedicated depth files)

`AGENTS.md` is ≤120 lines (a strict budget — "every byte costs context every turn"). It is a *table of contents*: a four-row "where to look first", an authoritative-source table, a path map, and a pointer to `agent-memory/`. Depth lives in:

- `CLAUDE.md` — 17 non-negotiables + GitNexus rules.
- `ARCHITECTURE.md` — domain layers + 14 tables + build order.
- `RELIABILITY.md` — 10 invariants the system must preserve.
- `SECURITY.md` — sensitive material inventory, server/client boundary, logging policy.
- `RUNBOOK.md` — local bring-up.
- `docs/design-docs/core-beliefs.md` (12 axioms) + `golden-principles.md` (10 mechanical rules).
- `docs/briefing-files/index.md` → authoritative product memo.
- `docs/superpowers/specs/INDEX.md` — 10 specs + `SHARED_CONTRACT.md`.

The lean-TOC pattern dominates the readability of every other harness asset. Core-belief #2: *"A monolithic instruction file crowds out the task."*

### 5.2 Append-only memory (`docs/agent-memory/`)

Seven files, each with a clear role and a single rule about how it changes:

| File | Rule | Why |
|---|---|---|
| `PROGRESS.md` | Append-only event log with tags `START / DONE / STUB / FIX / REFACTOR / NOTE / COMMIT`. `COMMIT` lines are auto-appended by a hook. | One source of "what happened, when." Never edit. |
| `DECISIONS.md` | ADR-lite format. `Status: Accepted` once stable; supersede with a new ADR, never rewrite. | ADRs are decisions, not opinions. |
| `BLOCKERS.md` | One entry per stub. Format: What / What I found / What I tried / Resolution / Follow-up. Cross-referenced by `TODO(blocker: YYYY-MM-DD)` tags in code. | The "30-min wall" rule (CLAUDE.md non-neg #5): if stuck > 30 min, stub it, log it, continue. |
| `VERSIONS.md` | Pinned versions for every dep + toolchain + provider API + infra image. | Drift is the leading cause of "it worked yesterday." |
| `STACK.md` | One-pager: Responsibility → Component → Why + ASCII data-flow diagram. | 60-second elevator description of the repo. |
| `SECRETS.md` | Env var inventory (no values), rotation procedure, incident log. | Sensitive metadata without sensitive values. |
| `PERF.md` | p50 / p95 / p99 targets per critical path. | The "we'll measure later" backlog with explicit targets. |

The 2026-05-16 deploy incident is logged with full forensic detail in `SECRETS.md`: three API keys were exposed in a Slack channel during the Vercel deploy, rotated within 24h, and the post-incident note names the chain of custody. This is the *opposite* of "fix and move on" — the failure becomes part of the harness.

### 5.3 Hooks (`.claude/hooks/`)

Four shell scripts wired in `.claude/settings.json`. All non-blocking except the safety gate; all sub-second.

| Hook | Event | Action |
|---|---|---|
| `block_dangerous_bash.sh` | `PreToolUse Bash` | Denies `rm -rf /`, `rm -rf ~`, `git push --force`, `DROP DATABASE`, `mkfs.`, `dd if=/dev/zero`, `chmod -R 777 /`, `vercel deploy --prod`, `vercel promote`, `supabase db reset --linked`, etc. (26 patterns total.) Explicit exemption for `git commit` (the message text is not executed). Denial reason is the literal matched pattern. |
| `log_commit_to_progress.sh` | `PostToolUse Bash` matching `git commit *` | Auto-appends `- [UTC ts] COMMIT [commit <sha>] <subject>` to `docs/agent-memory/PROGRESS.md`. Idempotent (`grep -q "\[commit $sha\]"`). |
| `post_edit_layer_check.sh` | `PostToolUse Edit|Write` matching `apps/web/src/*` | Runs ESLint with **only** the `motive/no-cross-layer-import` rule on the just-edited file; returns warnings via `systemMessage`. Sub-second. |
| `session_start_load_context.sh` | `SessionStart` | Prints last 8 non-blank lines of `PROGRESS.md`, newest `YYYY-MM-DD-*.md` file in `docs/exec-plans/active/`, and a count of `BLOCKERS.md` entries. |
| `remind_tests_on_stop.sh` | `Stop` | If `git status --porcelain` shows changes, suggests `pnpm test` and (if dirty files are tests) a focused test command. |

**Best-pattern lesson.** Hooks are non-blocking by default. They *inform* the agent via `systemMessage`; only the safety gate denies. Speed matters more than completeness for hooks that fire on every tool call.

### 5.4 Custom ESLint plugin (`apps/web/eslint-rules/`)

Two rules in a project-local plugin namespace (`motive/`), no publishing required:

- **`no-cross-layer-import`** — the file-suffix layer enforcer (4.1). Severity `error`.
- **`no-unstructured-log`** — bans `console.log/warn/error/info/debug` in app code; suggests `import { log } from "@/lib/motive/log"`. Severity `warn` (will promote once full coverage lands). Exemptions: the logger file itself (`src/lib/motive/log.ts`) and all tests (`src/**/*.test.{ts,tsx}`).

Both rules' error messages name *what to do* and *which doc explains why*:

```js
messages: {
  noConsole:
    "Do not call `console.{{method}}` in app code. " +
    "Import `log` from '@/lib/motive/log' and use log.{{method}}({ request_id, ... }, message). " +
    "See golden-principles.md R2.",
}
```

**Best-pattern lesson.** Every lint error is a teachable moment if the message names the doc cross-reference and the remediation snippet. Agents read lint output and need both *what to do* and *why* in one shot.

### 5.5 Slash commands as workflows (`.claude/commands/`)

Four commands, each running 5–10 sub-steps:

| Command | What it actually does |
|---|---|
| `/feature <description>` | Loads `CLAUDE.md`, `ARCHITECTURE.md`, `RELIABILITY.md`, newest active plan, matching spec, `golden-principles.md`, `QUALITY_SCORE.md`. Forces a confirm-the-acceptance-criteria pause **before** writing code. |
| `/review [focus]` | Self-review pipeline: `git status` / `diff main...HEAD` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm db:schema:doc:check` → `pnpm verify:freshness`. Then a spec-grounding pass against each `lib/motive/` and `app/api/` file in the diff, checking RELIABILITY invariants 1, 2, 3, 8 and golden-principles R1–R10. Output groups findings into BLOCKER / SHOULD FIX / NIT / NOT REVIEWED. |
| `/gc` | Ten read-only doc-gardening scans (stale paths, unblockered TODOs, untested services, oversized files, layer-warn counts, spec ↔ PROGRESS drift, db-schema staleness, plan-filename convention, completed plans still in `active/`). Outputs a worklist. **Does not edit anything.** |
| `/grade` | Re-grades `docs/QUALITY_SCORE.md`'s 10 domains × 5 dimensions (Tests / Schema / Errors / Obs / Legibility), writes the diff to `PROGRESS.md`, and flags regressions for `tech-debt-tracker.md`. |

**Best-pattern lesson.** Commands are *workflows*, not single actions. Each encodes the team's playbook for one recurring activity.

### 5.6 CI as docs-as-code enforcement (`.github/workflows/ci.yml`)

Single job, single Ubuntu runner, 15-minute timeout, ordered to fail cheap first:

```
pnpm install --frozen-lockfile
pnpm lint                                # custom plugin runs here
pnpm typecheck
pnpm test                                # vitest, Node env
pnpm db:schema:doc:check                 # regenerate + diff db-schema.md
pnpm verify:freshness                    # TODO(blocker:) accountability + plan-filename convention
node scripts/verify-spec2-schema.mjs     # spec-02 enum / table invariants
```

The non-obvious wins:

- **`db:schema:doc:check`** is CI-blocking. Migration edits without regenerated docs cannot land.
- **`verify:freshness`** walks the tree, gathers every `TODO(blocker: YYYY-MM-DD)` tag, and verifies that the date exists in `BLOCKERS.md`. Stubs that aren't logged fail CI.
- **Plan filename convention** (`^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$`) is enforced so the `SessionStart` hook can sort them deterministically.

**Best-pattern lesson.** Don't just run tests in CI — enforce the contracts that make the codebase agent-legible. The cost of writing a docs-freshness verifier is one afternoon; the savings compound forever.

### 5.7 GitNexus (call-graph-aware impact analysis)

`CLAUDE.md` non-negotiable #4: *"`gitnexus_impact` upstream on every target symbol with ≥2 callers; warn on HIGH/CRITICAL. `gitnexus_detect_changes` before commit. Never find-and-replace rename — use `gitnexus_rename`."*

The codebase is indexed as a symbol graph (3 468 symbols, 5 526 relationships, 165 execution flows). Six skill files in `.claude/skills/gitnexus/` cover exploring, impact analysis, debugging, refactoring, CLI, and the schema reference.

**Best-pattern lesson.** Treat the codebase as a graph, not a tree. The agent's first instinct on a rename or extraction should be "what's the blast radius?" — answered by tooling, not by guessing.

### 5.8 In-repo `llms.txt` cache (`docs/references/`)

Seven cheatsheets, 1.4–2.9 KB each, version-pinned: `nextjs-llms.txt`, `supabase-llms.txt`, `inngest-llms.txt`, `openai-responses-llms.txt`, `fal-llms.txt`, `tavily-llms.txt`, `zod-llms.txt`. The lookup precedence (CLAUDE.md non-neg #8): **read these first → fall back to Context7 → web search only if Context7 has no entry.**

**Best-pattern lesson.** Cache the 50-line library reference you actually use rather than re-deriving from upstream every session. Pin the cheatsheet header to the exact version so the agent knows when to refresh.

---

## 6. AI engineering patterns

### 6.1 OpenAI Responses API + strict Structured Outputs + Zod schemas

The repo runs raw `fetch` against `https://api.openai.com/v1/responses` with `text.format.type: "json_schema"`, `strict: true`. As of June 2026 this is the official recommended path — Structured Outputs is the production default, JSON Mode is legacy. (For new work, the `openai-node@6.x` SDK exposes the same surface with auto-generated type hints; the migration is mechanical.)

The wrapper does three things the docs don't make obvious:

1. **`z.toJSONSchema(schema)`** then `delete jsonSchema.$schema` (the OpenAI endpoint rejects the `$schema` key).
2. **Strict-mode keyword stripping** for `minLength / maxLength / pattern / format / minimum / maximum / multipleOf / patternProperties / minItems / maxItems` — strict mode rejects these even though they're valid JSON Schema. The wrapper centralises the workaround.
3. **`parseSchema?: ZodType<T>` override.** If the strict request schema needs to drop a constraint (e.g., `minItems`) but the parse-side wants to enforce it, the caller can pass two schemas. The wrapper sends the relaxed one and parses with the strict one.

```ts
const parsedJson = extractResponseJson(raw);
const parseSchema = input.parseSchema ?? input.schema;
const parsedObject = parseSchema.safeParse(parsedJson);
if (!parsedObject.success) {
  return {
    provider: "openai", status: "failed",
    reason: `OpenAI response did not match the requested schema: ${summarizeZodIssues(parsedObject.error.issues)}`,
    raw: { response: raw, issues: parsedObject.error.issues },
    requestId,
  };
}
```

Failure cases preserve the raw response **and** the Zod issues for downstream debugging. The error surfaces in `extraction_runs.error` and `output_json.issues` so a HITL operator can see exactly why a phase failed.

### 6.2 Anti-hallucination guards in the schema

Two patterns stand out in `extraction-schemas.ts`:

- **`fix_artifact_status: z.enum(["present_in_source", "request_from_brand"]).nullable()`** (line 140). When the LLM proposes a fix for a landing gap, it must declare whether the proposed artefact already exists in the sources or has to be requested. This makes hallucinated proof-points visible.
- **`runner_up_stage` + `runner_up_reason`** on intent classifications (lines 116–117). Forces a chain-of-verification: the model has to name what it considered and rejected. Operators can audit the reasoning.

**Best-pattern lesson.** When you can't fully trust the model, schema it. Closed enums + "explain your runner-up" make hallucinations visible at the data layer.

### 6.3 Provider-payload persistence

Every external call writes its full request and response JSON to a `jsonb` column **before** any post-processing (RELIABILITY Invariant 3). This is the persisted-evidence pattern:

- `sources.provider_request_json` + `provider_response_json` for Tavily.
- `extraction_runs.input_json` + `output_json` for OpenAI.
- `creative_variants.provider_request_json` + `provider_response_json` + `asset_url` for OpenAI text + fal.ai assets.
- `performance_snapshots.provider_request_json` + `provider_response_json` for OpenAI monitoring.

The acceptance test: *"Run with `OPENAI_API_KEY` set to a sentinel; verify each call's full payload is recoverable from the DB without hitting the API."*

**Best-pattern lesson.** The DB is the audit trail. If you can't replay a failed pipeline from `jsonb` columns alone, you've lost the most valuable artefact in the run.

### 6.4 Tavily crawl + search + extract orchestration (ADR-0006 / 0007)

The intake flow runs `tavily.crawl` against the brand homepage with hand-tuned instructions, path allow / block lists, and `extractDepth: "advanced"`. Failed crawls fall back to single-page `tavily.extract` (basic → advanced). Each crawled page goes through `pruneScrapedMarkdown` (image strip, social-link strip, cookie-banner heuristic, dedupe, 10 K char cap). Then `tavily.search` adds third-party context with `excludeDomains: [brandHost]`. The N resulting `sources` rows link to the homepage anchor via a `parent_source_id` column, and a single `extractionRequested` event carries the full list.

ADR-0007 then replaced the hand-rolled `fetch` wrapper with `@tavily/core`. Net effect: ~150 lines of provider code (down from ~300), SDK types drive option/response surface, and test isolation uses an injected `TavilyClient` stub rather than a `fetch` mock.

**Best-pattern lesson.** For "feed an LLM with brand context" workflows, one-page extract is rarely enough. Crawl + prune + search is the right shape — *and* the SDK adoption is worth the version-drift cost because the surface change becomes a TS error at the call site, not a silent Zod parse failure.

### 6.5 Demo-mode fallbacks

`shouldUseSeededExtraction()` is the canonical pattern:

```ts
function shouldUseSeededExtraction(): boolean {
  return process.env.DEMO_MODE === "seeded"
    || (process.env.DEMO_MODE === "auto" && !process.env.OPENAI_API_KEY);
}
```

Three modes:
- `DEMO_MODE=live` — always call OpenAI; fail loud if no key.
- `DEMO_MODE=seeded` — always use the deterministic fixture (AtlasDesk).
- `DEMO_MODE=auto` (default) — use OpenAI if the key is set, deterministic otherwise.

The deterministic path materialises into the same tables with the same shape, so the downstream UI cannot tell the difference. The demo never has a "no API key configured" error path that judges see.

**Best-pattern lesson.** Treat the deterministic fixture as a first-class extraction provider, not a "mock for tests." The same code path serves demo resilience, offline development, and CI.

---

## 7. Frontend / design-system patterns

### 7.1 `@motive/ds` package shape

`packages/design-system/` exports under `.` (everything), `./styles`, `./primitives`, `./tokens`, `./state`, `./hooks`, `./fonts`. `sideEffects: ["**/*.css"]` so JS is tree-shaken but CSS is preserved. Peer-deps pin **React 19.2.6, Next 16.2.6, Tailwind 4.3.0** — the package is internal but disciplined about peer compatibility.

39 primitives in `src/primitives/`, all wrapping React Aria Components (RAC) where overlays / focus / selection are involved.

### 7.2 Full state-surface coverage

The `Button` primitive (`packages/design-system/src/primitives/Button.tsx`) extends RAC's `Button`, translates `onClick → onPress`, surfaces `disabled → isDisabled`, and adds an `onPressAsync` that auto-drives a loading → success → error state machine via timers. The machine exposes itself through both `data-loading` and `data-state="success|error"` attributes — so CSS can target one-shot animations without React re-renders.

The same machine is exposed as a hook (`useAsyncAction`) for non-Button surfaces:

```ts
const { state, error, isLoading, isSuccess, isError, reset, run } = useAsyncAction(...);
```

Skeletons match production shapes via variant primitives (`SkeletonText`, `SkeletonHeading`, `SkeletonButton`, `SkeletonAvatar`) keyed off heading levels and button sizes.

**Best-pattern lesson.** The full state surface (idle / hover / pressed / focus-visible / disabled / loading / success / error) is one state machine — expose it through `data-` attributes so CSS, hooks, and components all read the same source.

### 7.3 Tailwind v4 with zero JS config

- No `tailwind.config.{js,ts}` exists.
- `postcss.config.mjs` loads only `@tailwindcss/postcss`.
- The entry stylesheet does `@import "tailwindcss";` then composes `tokens.css → theme.css → base.css → utilities.css → motion.css`.
- `@source` globs in CSS declare which trees Tailwind scans.
- `@theme inline { --color-acid: var(--acid); ... }` bridges raw CSS vars to Tailwind utilities, so `bg-acid` and `style={{ color: tokens.color.acid }}` read the same source.

The token system covers surfaces, 5-step ink scale, 3 line-opacity tokens, two accent colours (acid yellow + cyan), 7-step duration scale, 6 easing curves (including spring / snap / MD3-emphasized), 10-step spacing, container-query + breakpoint constants, Apple-3-layer shadow tokens, blur / icon / z scales.

### 7.4 Container queries over media queries

`AppShell.tsx` declares `container-type: inline-size` on the nav and uses `@container (max-width: 768px)` to flip `.nav-desktop-only` off. `WorkspaceShell` is a 3-column grid (rail / main / aside) that collapses to a single stacked column below 64rem via container query. The rail does **not** become an Accordion on mobile — sections render inline so scroll position is preserved when the layout flips.

**Best-pattern lesson.** Container queries are what media queries should have been. The component governs its own breakpoints; embedding it in a sidebar doesn't break it.

### 7.5 SSR → realtime handoff

The three workflow pages (`review/page.tsx`, `creatives/page.tsx`, `monitoring/page.tsx`) are textbook RSC:

1. `await params` for `projectId`.
2. Server-side load via the domain repository (`createSupabaseReviewRepository().getReviewData(projectId)`), with `Promise.all` if multiple loads are independent.
3. Empty-state branch if no data.
4. Otherwise hand the initial payload as `initialData` / `initialWorkspace` to a client component, which mounts realtime + polling for live updates.

This pattern means the first paint is server-rendered HTML, the second-and-onward updates are realtime, and the polling fallback covers the seam.

### 7.6 Static-markup tests in Node-env vitest

`apps/web/vitest.config.ts` sets `environment: "node"`, `globals: false`. Component tests use `renderToStaticMarkup` from `react-dom/server` and assert against the HTML string. No jsdom, no React Testing Library, no user-event.

**Trade-offs.** Click / keyboard / focus interactions are out of scope (no DOM). What's in scope: render correctness, prop-driven branching, `aria-current` / `aria-disabled` flags, deep links, empty states. The tests are sub-100 ms each.

**Best-pattern lesson.** Pick the minimum-viable test environment for what you actually test. If 80 % of your tests are "does this render the right HTML for this prop set", the jsdom + RTL overhead is not pulling its weight.

### 7.7 `motion` integration (`framer-motion` → `motion`)

- Tabs use `LayoutGroup` + per-tab `layoutId` for shared-element underline animation.
- `Reveal` is a stage-aware `useInView` wrapper that **bails to the end state if the document is hidden** — so vitest / jsdom test runs never render animated.
- `Press` wraps non-button surfaces with spring `whileTap` / `whileHover`.
- `Magnetic` uses `useMotionValue` + `useSpring` for cursor-pull, with `disableOnTouch` default `true`.

Note: the package is `motion`, not `framer-motion`. Imports are `from "motion/react"`. This is the 2026 default after the rename.

---

## 8. Operational patterns

### 8.1 Demo reset idempotency

`pnpm demo:reset` → `scripts/demo-reset.mjs` → `POST /api/demo/reset` → service-role client truncates child tables before parents → reseeds from `supabase/seed.sql`. Guarded by `MOTIVE_OPERATOR_TOKEN`. RELIABILITY Invariant 4 demands byte-identical output (modulo timestamps) across repeated runs.

**Best-pattern lesson.** Demos drift; idempotent resets don't. Every demo-shaped app needs a "snap back to the canonical fixture" command, callable by `pnpm` and an HTTP route.

### 8.2 Deploy path documented as an ADR (`ADR-0004`)

The ADR records the *exact* deploy sequence that worked:

- Vercel CLI 54.1.0 (pinned).
- Supabase via `vercel integration add supabase -m region=cdg1`. 16 env vars auto-injected.
- Root Directory typo fixed via `PATCH /v9/projects` (not the dashboard).
- Migrations applied via `psql` against `POSTGRES_URL_NON_POOLING` (skips the `supabase login` browser OAuth dance).
- Inngest functions registered via `PUT /api/inngest`.
- `DATABASE_URL` aliased to pooled `POSTGRES_URL`.
- `NEXT_PUBLIC_APP_URL` hardcoded to the prod URL (with a note: if preview-correct URLs become needed, `env.ts` must learn to fall back to `VERCEL_URL`).

**Best-pattern lesson.** Document the deploy as an ADR with command-by-command receipts, including failed attempts. The next agent doing the deploy has a runbook, not a guessing game.

### 8.3 `pnpm setup:env` bootstrap

`scripts/setup-env.mjs` runs `supabase status -o env`, parses the output, and writes `apps/web/.env.local` from `.env.example` placeholders with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` filled in. Refuses to overwrite an existing non-empty `.env.local` without `--force`.

**Best-pattern lesson.** Local bring-up should be a single command. The script can be paranoid; agents and humans alike benefit.

### 8.4 Versions are committed and rationalised

`docs/agent-memory/VERSIONS.md` is the inventory; CLAUDE.md non-negotiable #9 bans `latest` everywhere. Every dep has an exact version; every infra image has a rationale (or, currently, a "TBD" with a note). The `onlyBuiltDependencies` entry in root `package.json` (`["inngest-cli", "protobufjs", "sharp", "supabase", "unrs-resolver"]`) limits which packages can run postinstall scripts — a supply-chain guard.

### 8.5 Secrets policy

`SECURITY.md` lists every sensitive asset, where it lives, and where it must never appear. The logging policy is explicit (Invariant 8 + R2): JSON-line structured logs only, `request_id` carried end-to-end, brand URLs logged as `hostname + path length` rather than the full URL, provider payloads never echoed through API responses.

Two route-handler norms worth lifting:

- The single service-role endpoint (`/api/demo/reset`) checks the `MOTIVE_OPERATOR_TOKEN` header **first thing**.
- Token mismatches return `401`, not `403` — `403` would imply the token was recognized.
- The submitted token is never logged, even on mismatch.

---

## 9. Anti-patterns paired with the best pattern

This section is the explicit anti-pattern → pattern map. Items in the **Spotted** column are real findings in the audit (file paths included where relevant). The "Reach for instead" column is the pattern the repo demonstrates, or what current SOTA recommends.

| # | Anti-pattern (spotted) | Where | Reach for instead |
|---|---|---|---|
| 1 | **Find-and-replace rename across a 3 468-symbol graph.** | (general risk) | `gitnexus_rename` understands the call graph; rename is a graph mutation, not a text substitution. CLAUDE.md non-neg #4 bans the text approach. |
| 2 | **`console.log` in service / route code.** | Eliminated by `motive/no-unstructured-log`. | Structured JSON via `lib/motive/log.ts` with `request_id`, `actor`, `route`. Filterable by `request_id` across all layers. |
| 3 | **Routes / components calling Supabase directly.** | Banned by `motive/no-cross-layer-import` (severity `error`). 23 historical warnings tracked in `tech-debt-tracker.md`. | Routes go through `lib/motive/<domain>.{ts,server.ts}`; components go through `lib/motive/<domain>.client.ts`. The data-access boundary is mechanical. |
| 4 | **`as` cast across an HTTP / event boundary.** | Golden-principle R1; future ESLint rule planned. | `schema.safeParse(input)` — every untrusted input gets a Zod schema. Casting hides bad data four files deep. |
| 5 | **`as Array<Record<string, unknown>>` to satisfy a union of typed row arrays.** | `live-review-workspace.tsx`, `creative-grid.tsx`, `monitoring-dashboard.tsx` (the realtime upsert merge). | Typed dispatcher: a `Record<TableName, (row: TableRow) => void>` keyed by table. Removes every cast. |
| 6 | **Three near-identical `upsertById` / `asRecord` / `mergeReviewResult` helpers** across three dashboards. | `live-review-workspace.tsx:1015–1025`, `creative-grid.tsx:481–502`, `monitoring-dashboard.tsx:453–467`. | One `lib/motive/realtime-merge.ts` module. R5 (reimplement small utilities) doesn't mean "duplicate the same 20 lines three times." |
| 7 | **Polling unconditionally even while realtime says `live`.** | `live-review-workspace.tsx:131–146`. | Skip polling while `connection === "live"` (the pattern the other two dashboards use). Net effect: zero redundant DB queries while realtime is healthy. |
| 8 | **No realtime fallback on source-status panel** (polls every 2 s only). | `source-status-panel.tsx:28–42`. | Same `subscribeToProjectTables` helper used by the other dashboards; polling stays as backstop. |
| 9 | **`crypto.randomUUID()` at every call site** instead of a typed `newRequestId()` helper. | `live-review-workspace.tsx:173, 219, 241`; `creative-grid.tsx:113, 146`; `monitoring-dashboard.tsx:106`. | One `newRequestId(): string` helper so logging / audit / event payload stamping all use the same source. |
| 10 | **Service-role key in a non-`server-only` module.** | Avoided: `lib/supabase/service-role.ts:1` is `import "server-only";`. | The `server-only` package fails the build if the module ever ends up in a client bundle. Cheaper than runtime detection. |
| 11 | **Logging the user's brand URL at info level.** | Avoided per SECURITY.md. | Log `hostname + path length`; full URL stays in `sources.uri`. |
| 12 | **Logging the operator token on mismatch.** | Explicitly banned. | Return `401` (not `403`) and never echo the submitted token, even in the error message. |
| 13 | **Force-pushing the demo branch.** | Blocked by `block_dangerous_bash.sh`. | Investigate the merge, never `--force` on a shared branch. |
| 14 | **Random-number monitoring KPIs ("vaporware metrics").** | Avoided. RELIABILITY Invariant 6 demands story-driven KPIs. | Deterministic scorer first (`performance.ts`), LLM narration only on prose fields, banned-puff list in the prompt, self-check booleans in the schema. |
| 15 | **Long-running extraction with only a spinner.** | Avoided. RELIABILITY Invariant 5 demands streaming via Supabase Realtime or Inngest events. | The phase rail recomputes from `useMemo` on every realtime row that lands; the UI never blocks on a single multi-second op. |
| 16 | **Calling a "GPT-labelled GPT outputs" loop *self-improving*.** | Core-belief #12 names this as distillation, not self-improvement. | Self-improvement requires new production traces: human corrections, rejected rows, campaign outcomes. Pioneer (post-v1) is the place those traces feed. |
| 17 | **`latest` Docker tag for Postgres / Inngest dev.** | CLAUDE.md non-neg #9 bans. | Pin to an exact known-good tag in `supabase/config.toml` with rationale in `VERSIONS.md § Infrastructure images`. |
| 18 | **Committing `.env`, `.claude/settings.local.json`, `.gitnexus/lbug`.** | `.gitignore` guards. | `.env.example` is committed with placeholder sentinels; real `.env` is gitignored; lockfile (`pnpm-lock.yaml`) is committed; CI uses `--frozen-lockfile`. |
| 19 | **`pnpm add` a new dep without rationale.** | Discouraged by R5 + ADR convention. | Reimplement small utilities in-repo; if a dep is needed, justify in `DECISIONS.md` and pin in `VERSIONS.md`. |
| 20 | **Monolithic `AGENTS.md` (the "encyclopedia" mode).** | Core-belief #2 names this anti-pattern explicitly. | ≤120-line TOC; depth lives in `ARCHITECTURE.md`, `RELIABILITY.md`, `SECURITY.md`, design docs, specs. |
| 21 | **Editing `PROGRESS.md` / `DECISIONS.md` / `BLOCKERS.md` to "fix" history.** | All three are append-only. | Add a new entry; supersede an ADR rather than rewrite it. The chain of decisions stays auditable. |
| 22 | **Untagged `TODO` comments.** | Banned. `verify-doc-freshness.mjs` fails CI. | Every `TODO` carries `(blocker: YYYY-MM-DD)` and an entry in `BLOCKERS.md`. |
| 23 | **Long-running PRs.** | Core-belief #9: "with high agent throughput, waiting is more expensive than correcting after the fact." | Short-lived PRs, flake-tolerant CI, fast follow-up commits. Reversibility > gatekeeping. |
| 24 | **A 1 000-line service file.** | `creatives.ts` (1 020 L), `demo.ts` (1 089 L), `extraction.ts` (876 L), `ad-groups.ts` (801 L) — surfaced by `/gc`, tracked in `tech-debt-tracker.md`. | Files in `lib/motive/` stay under 400 lines (R6 — soft cap). Split along sub-domain boundaries: `creatives.ts` → `creatives-generation.ts` + `creatives-review.ts`. |
| 25 | **Hand-rolled `fetch` against a provider where an official SDK exists.** | ADR-0007 names this and corrects it for Tavily. | Adopt the official SDK once it stabilises. SDK types drive option/response surface, surfacing API changes as TS errors at the call site. |
| 26 | **Strict-mode JSON Schema with `minLength` / `pattern` / `format`.** | OpenAI rejects these. The wrapper strips them. | Either strip in the wrapper (current) or use the `parseSchema` override to keep parse-side strictness while relaxing send-side. |
| 27 | **No `concurrency.key` on an Inngest function that handles per-project events.** | Avoided: `concurrency: { limit: 1, key: "event.data.projectId" }`. | Always key concurrency on the natural dedup unit. Spam clicks can no longer queue up duplicate extractions. |
| 28 | **Materialising LLM output rows without persisting the raw payload.** | Avoided — `extraction_runs.input_json` + `output_json` capture both. | Persist the raw provider request and response first; materialise into typed tables second. Replay-from-DB becomes free. |
| 29 | **Service-role client in a public path without an operator-token check.** | Avoided in `/api/demo/reset`. | Token check first; `401` on mismatch; never log the token. |
| 30 | **Hardcoded `Math.random()` in performance synthesis.** | Avoided. The deterministic scorer is seeded by the project's actual ad-group / creative / landing-gap data. | RELIABILITY Invariant 6: snapshot KPI variance for an identical project across runs must be near-zero. |
| 31 | **Node 25.x in CI / dev** (EOL 2026-06-01). | Currently pinned in `VERSIONS.md`. | Move to Node 24 (Active LTS). Highest-priority finding. |
| 32 | **ESLint 9.x past its EOL date** (2026-08-06). | Currently pinned at `9.39.4`. | Migrate to ESLint 10.x before August 2026. `includeIgnoreFile()` moved from `@eslint/compat` to `@eslint/config-helpers`. |
| 33 | **Drift between code and `docs/generated/db-schema.md`.** | Blocked by CI (`pnpm db:schema:doc:check`). | `scripts/generate-db-schema-doc.mjs` produces byte-identical output from the same migrations; CI diffs against the committed copy. |
| 34 | **Conditional spawning of multiple GPT requests inside a route handler.** | Avoided. Routes acknowledge; Inngest workers run the multi-call pipelines. | Routes are dispatchers; workers are durable. The 30 s serverless route timeout never bites the user. |
| 35 | **A single `request_id` per extraction phase** (one per OpenAI call) instead of one per pipeline. | RELIABILITY Invariant 1 + Invariant 10 require the inverse. | One `request_id` per *entrypoint*, threaded through every Inngest event payload and every provider call's `metadata` field. |
| 36 | **No `image domains` allowlist for generated assets.** | Worked around in `creative-grid.tsx` with `<NextImage ... unoptimized>`. | Allowlist the fal.ai asset domains in `next.config.js` so the optimiser still runs in production. |

---

## 10. SOTA grounding (June 2026)

This is the version-by-version delta of where the repo sits versus current stable. Sources are cited at the end of the section.

### 10.1 Runtime & toolchain

- **Node.js 25 EOL on 2026-06-01.** Move dev + CI to **Node 24 (Active LTS)**. Node 26 is GA (released 2026-05-05) but doesn't enter LTS until Oct 2026 — only adopt if you need Temporal-by-default or V8 14.6 features.
- **pnpm 11.3 is current** (you're on `11.1.2`). v11 itself was the big jump — Node 22+ required, store is single SQLite DB, native publish, `minimumReleaseAge` supply-chain guard on by default. Patches in 11.1 → 11.3 add `pnpm stage` (staged publishing), `trustLockfile`, `--skip-manifest-obfuscation`, lower memory for `minimumReleaseAge` verification.
- **TypeScript 6.0 is the last JS-based release** before the Go-native TS 7. Stay on 6.0.x for now; plan TS 7 migration narrative.

### 10.2 Framework & UI

- **Next.js 16.2.x** — current. React Compiler is on by default in 16; Adapters API stable in 16.2; Turbopack FS caching for `next dev` stable in 16.1.
- **React 19.2.x** — current; React Compiler is the 2026 default.
- **Tailwind v4.3.0** — current. CSS-first config is the new norm; if you're starting fresh today, no `tailwind.config.{js,ts}` is the right shape.
- **motion@^12** — current. Imports must be `from "motion/react"`, not `framer-motion`.

### 10.3 Lint

- **ESLint 10.4.1 is current; v9 EOL 2026-08-06.** Migrate before August. Within v10, flat config remains default; `includeIgnoreFile()` moved from `@eslint/compat` to `@eslint/config-helpers`.

### 10.4 Data & validation

- **Zod 4.x** — current line. The repo already absorbed the 3 → 4 break (`z.email()`, `z.uuid()`, `z.url()` top-level; `z.strictObject()` / `z.looseObject()`; unified `error` parameter).
- **@supabase/supabase-js@2.107.0** is current (you're at `2.105.4`). Bump safely. **@supabase/server** is the announced successor to **@supabase/ssr** — not urgent, but if starting a new project today you'd evaluate it.
- **Supabase CLI 2.104.0** is current (you're at `2.98.2`). Rolling-release; safe to bump.

### 10.5 Background workflows

- **Inngest TS SDK v4** GA on 2026-03-16. v3 → v4 break: middleware rewritten; Standard Schema replaces `EventSchemas`; triggers moved into the options object; serve options on the client constructor; `step.invoke()` no longer accepts a string function ID; parallel-step optimization + checkpointing on by default. Repo is on v4; safe.

### 10.6 AI providers

- **OpenAI Responses API + Structured Outputs + GPT-5.5** is the 2026 default for extraction / generation. Chat Completions still exists but new features (hosted tools, computer use, Skills, MCP, web search, apply-patch, hosted shell, tuned prompt caching) ship to Responses first.
- **GPT-5.5** (snapshot `2026-04-23`) and **GPT-5.5 Pro** — flagship reasoning + coding, 1M-token context, image input, function calling, prompt caching, Batch.
- **GPT-5.4-mini / GPT-5.4-nano** — cost/latency tier; useful for high-volume / low-stakes hops.
- **openai-node 6.x** is the recommended TS SDK; requires TypeScript ≥ 4.9, Node 20 LTS+. The repo's hand-rolled `fetch` works fine but the SDK migration is mechanical and gets you type hints for free.
- **fal.ai 2026 SOTA:** **FLUX.2** family (Pro / Dev / Schnell) for images; **Veo 3.1** (Google, with audio) and **Kling 3.0 Pro** for video; **Seedream 5.0** for open-weights image; **ImagineArt 1.5** for sharp on-image text.
- **Tavily 2026 surface:** `search`, `extract`, `crawl`, `map`, plus the new **research** endpoint (single API call that iterates and returns a cited report — worth piloting for the brand-link kickoff). `@tavily/core` SDK is current.

### 10.7 Tests, state, forms

- **Vitest 4.1 is in backport-only mode; v5 is the active branch.** Patch lag of 4.1.6 → 4.1.8 plus a major decision to make. Schedule v5 evaluation after the demo lock.
- **TanStack Query 5.101** and **Zustand 5.0.14** — current.
- **react-hook-form 7.77** with **@hookform/resolvers 5.4** — one minor behind on each. Stay on RHF 7.x; 8.x is beta.
- **Sonner 2.0.7** — current.

### 10.8 Suspicious pins to verify in the lockfile

- `@tavily/core 0.7.3` — search results lag at `0.7.2`. Either a fresh patch or a typo; `npm view @tavily/core versions` clears it up.
- `inngest-cli 1.19.4` — search results lag at `1.19.1`. Same check.

**Sources used in the SOTA grounding** (one of each — full list in the parallel agent's audit notes):

- Next.js: nextjs.org/blog/next-16 · nextjs.org/blog/next-16-1 · nextjs.org/blog/next-16-2 · github.com/vercel/next.js/releases
- React: react.dev/versions · react.dev/blog/2025/10/01/react-19-2
- TypeScript: devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- ESLint: eslint.org/blog/2026/02/eslint-v10.0.0-released/ · eslint.org/version-support/
- Tailwind: tailwindcss.com/blog/tailwindcss-v4 · infoq.com/news/2026/04/tailwind-css-4-2-webpack/
- Zod: zod.dev/v4
- Supabase JS: github.com/supabase/supabase-js/releases · supabase.com/blog/introducing-supabase-server
- Inngest: inngest.com/changelog/2026-03-17-typescript-sdk-v4-ga
- OpenAI: developers.openai.com/api/docs/guides/structured-outputs · developers.openai.com/api/docs/guides/latest-model · developers.openai.com/api/docs/models/gpt-5.5
- fal.ai: fal.ai/explore/models · fal.ai/models/fal-ai/veo3/image-to-video
- Tavily: docs.tavily.com/welcome · docs.tavily.com/documentation/api-reference/endpoint/extract
- pnpm: pnpm.io/blog/releases/11.0 · pnpm.io/blog/releases/11.3
- Node.js: nodejs.org/en/about/previous-releases · nodejs.org/en/blog/release/v26.0.0
- Vitest: vitest.dev/blog/vitest-4-1.html · vitest.dev/blog/vitest-4
- Motion: motion.dev/changelog · motion.dev/docs/react-upgrade-guide
- TanStack Query: github.com/tanstack/query/releases
- Zustand: github.com/pmndrs/zustand/releases
- RHF: github.com/react-hook-form/react-hook-form/releases

---

## 11. Lessons distilled for agentic-coding teams

The ten patterns most worth lifting into a team training curriculum, ordered by how often they compound across a project's lifetime.

1. **Treat the agent harness as the product.** Hooks, lint rules, slash commands, CI gates, append-only memory files. Each compounds session over session. The OpenAI Codex playbook lineage is explicit; ADR-0005 in this repo is a worked example of the migration.

2. **Lean TOC + dedicated depth files.** `AGENTS.md` ≤ 120 lines; depth in `ARCHITECTURE.md`, `RELIABILITY.md`, `SECURITY.md`, design docs, specs. Token cost of context is real; a monolithic instruction file crowds out the task.

3. **Append-only memory beats editable state.** `PROGRESS.md` (auto-appended by hook), `DECISIONS.md` (ADRs supersede), `BLOCKERS.md` (cross-referenced by `TODO(blocker:)` tags). Auditable, mergeable, agent-friendly.

4. **Encode the architectural diagram as a lint rule.** File-suffix layering (`*.ts` / `*.server.ts` / `*.client.ts`) is more agent-legible than directory layering. The custom `motive/no-cross-layer-import` rule is a 118-line file that pays back every commit.

5. **Schemas at every boundary.** Zod 4 over Request bodies, Inngest event payloads, env vars, and LLM responses. Closed enums for domain vocabularies (Schwartz / Gartner / Moesta / CXL / Cialdini). Anti-hallucination guards (`fix_artifact_status`, `runner_up_stage`).

6. **Persist every provider payload, then materialise.** `extraction_runs.input_json` + `output_json`, `creative_variants.provider_*_json`, `performance_snapshots.provider_*_json`. The DB is the audit trail; replay-from-DB is free.

7. **Deterministic-then-LLM scoring for any "synthesised KPI" surface.** Code computes what's true; LLM rewrites the prose with a self-check schema and a banned-puff list. Story KPIs, not random noise.

8. **One `request_id` per entrypoint, threaded everywhere.** Logs, Supabase writes, Inngest event payloads, provider metadata. Without it, multi-phase pipelines are unobservable.

9. **Realtime as primary, polling as backstop.** A 28-line `subscribeToProjectTables` helper drives every live dashboard; polling skips while `connection === "live"`. The status pill in the UI tells the user which path is active.

10. **CI enforces docs-as-code.** Lint + typecheck + test + db-schema-doc regeneration + plan-filename convention + TODO-blocker accountability. Drift between code and docs cannot land.

Honourable mentions:

- **Pinned versions, never `latest`.** Drift is the leading cause of "it worked yesterday."
- **`server-only` package** as a build-time guard for service-role modules.
- **Atomic Postgres RPC for HITL mutations.** One function, one audit-log row, one optimistic-concurrency check.
- **Demo-mode fallback as a first-class extraction provider.** Same code path serves demo resilience, offline dev, and CI.
- **GitNexus impact analysis before any rename / extraction.** Treat the codebase as a graph.

---

## 12. Appendix

### 12.1 File map index (the things worth knowing exist)

```
Root
├─ CLAUDE.md                  17 non-negotiables + GitNexus rules
├─ AGENTS.md                  ≤120-line TOC
├─ ARCHITECTURE.md            Domain layers + 14 tables + build order
├─ RELIABILITY.md             10 invariants
├─ SECURITY.md                Sensitive material policy
├─ RUNBOOK.md                 Local bring-up
├─ pnpm-workspace.yaml
├─ package.json               root scripts + onlyBuiltDependencies
├─ supabase/
│  ├─ migrations/202605160001_motive_core.sql            14 tables, enums, indexes, RLS
│  ├─ migrations/202605160002_review_actions.sql         review_entity_action RPC
│  ├─ migrations/202605160003_creative_review_actions.sql RPC extension for creatives
│  └─ seed.sql                                           AtlasDesk fixture
├─ apps/web/
│  ├─ eslint.config.mjs                                  motive plugin wiring
│  ├─ eslint-rules/no-cross-layer-import.mjs             layer enforcer
│  ├─ eslint-rules/no-unstructured-log.mjs               structured-log enforcer
│  ├─ postcss.config.mjs                                 @tailwindcss/postcss only
│  ├─ vitest.config.ts                                   environment: node
│  └─ src/
│     ├─ app/                                            Next 16 App Router
│     │  ├─ (app)/                                       app shell layout
│     │  ├─ api/                                         route handlers
│     │  ├─ layout.tsx + page.tsx + loading.tsx + error.tsx
│     ├─ components/                                     React presentational
│     │  ├─ layout/                                      shell primitives
│     │  ├─ sections/                                    marketing sections
│     │  └─ live-review-workspace.tsx
│     │  └─ creative-grid.tsx
│     │  └─ monitoring-dashboard.tsx
│     │  └─ extraction-phase-rail.tsx
│     │  └─ source-status-panel.tsx
│     │  └─ intake-workbench.tsx
│     ├─ inngest/                                        Inngest client + functions + events
│     ├─ lib/
│     │  ├─ env.ts                                       Zod-validated env
│     │  ├─ public-env.ts
│     │  ├─ motive/                                      domain layer
│     │  │  ├─ types.ts                                  source-of-truth schemas
│     │  │  ├─ extraction-schemas.ts                     OpenAI Structured Outputs
│     │  │  ├─ extraction.ts + .server.ts                pipeline contract
│     │  │  ├─ ad-groups.ts + .server.ts
│     │  │  ├─ creatives.ts + .server.ts + .client.ts
│     │  │  ├─ reviews.ts + .server.ts + .client.ts
│     │  │  ├─ deployments.ts + .server.ts + .client.ts
│     │  │  ├─ performance.ts                            deterministic + LLM monitoring
│     │  │  ├─ realtime.client.ts                        subscribeToProjectTables
│     │  │  ├─ brand-discovery.ts                        ADR-0006 orchestrator
│     │  │  ├─ scrape-pruning.ts
│     │  │  ├─ log.ts                                    structured logger
│     │  │  └─ demo.ts + demo.server.ts                  AtlasDesk fixture
│     │  ├─ providers/                                   openai.ts, tavily.ts, fal.ts, types.ts
│     │  └─ supabase/                                    browser, server, service-role, client
│     └─ marketing/data.ts                               marketing copy
├─ packages/design-system/                               @motive/ds
│  ├─ src/primitives/                                    39 primitives (RAC + motion)
│  ├─ src/state/                                         MotiveProviders + QueryProvider + ui-store
│  ├─ src/hooks/use-async-action.ts                      state-machine hook
│  └─ src/styles/                                        tokens.css, theme.css, base.css, motion.css
├─ scripts/
│  ├─ generate-db-schema-doc.mjs                         deterministic regenerator
│  ├─ verify-doc-freshness.mjs                           TODO-blocker + plan-filename
│  ├─ demo-reset.mjs                                     idempotent reset
│  ├─ setup-env.mjs                                      .env.local bootstrap
│  └─ verify-spec2-schema.mjs                            spec-02 invariants
├─ .claude/
│  ├─ settings.json                                      hook wiring
│  ├─ hooks/                                             5 shell scripts
│  ├─ commands/                                          /feature /review /gc /grade
│  └─ skills/                                            doc-gardening + 6 gitnexus skills
├─ .github/workflows/ci.yml                              lint → typecheck → test → docs-freshness
├─ .gitnexus/meta.json                                   index pointer
└─ docs/
   ├─ briefing-files/                                    authoritative product memos
   ├─ design-docs/                                       core-beliefs.md, golden-principles.md
   ├─ superpowers/specs/                                 10 specs + SHARED_CONTRACT.md
   ├─ exec-plans/{active,completed}/                     plans + tech-debt-tracker
   ├─ agent-memory/                                      PROGRESS, DECISIONS, BLOCKERS, VERSIONS, STACK, SECRETS, PERF
   ├─ references/                                        7 cached llms.txt files
   ├─ generated/db-schema.md                             produced by script, verified by CI
   ├─ audits/                                            this report
   └─ post-hackathon/                                    deferred work logs
```

### 12.2 Glossary

- **AGENTS.md** — the table of contents for any agent landing in the repo. ≤120 lines by design.
- **Append-only log** — a file whose entries are written once and never edited (`PROGRESS.md`, `BLOCKERS.md`).
- **ADR (architecture decision record)** — one entry per decision in `DECISIONS.md`. `Status: Accepted` once stable; supersede with a new ADR rather than rewriting.
- **Boundary** — any place where untrusted data enters the system (HTTP body, Inngest event, env var, LLM response). Every boundary is parsed by a Zod schema.
- **Demo-mode fallback** — a deterministic fixture path that runs when no API key is configured or `DEMO_MODE=seeded`. Materialises into the same tables with the same shape as the real path.
- **GitNexus** — call-graph-aware code-intelligence index, used for impact analysis before edits and rename operations.
- **HITL** — human-in-the-loop. The review workspace where every extracted row can be approved / edited / rejected / enriched.
- **`provider_payload`** — the `jsonb` columns that store the full request + response of every external API call (RELIABILITY Invariant 3).
- **`request_id`** — UUID v4 generated at every entrypoint, threaded through logs, Supabase writes, Inngest event payloads, and provider metadata (RELIABILITY Invariant 1 + 10).
- **RLS** — row-level security. Every Supabase table enables it; the `owner_user_id is null OR owner_user_id = auth.uid()` pattern is the policy.
- **Spec / plan / execute** — the multi-step task discipline. Spec encodes *what* and *why*; plan encodes *how and in what order*; execution is one PR per checkbox.
- **State surface** — the full set of UI states a component can express (idle / hover / pressed / focus-visible / disabled / loading / success / error). Exposed through `data-state` attributes so CSS, hooks, and components share one source.
- **Story KPI** — a performance metric generated as a coherent insight tied to ad-group / creative / landing-gap quality, not random noise (RELIABILITY Invariant 6).
- **Structured Outputs** — OpenAI's strict-mode JSON Schema response format. Default for extraction / generation as of 2026.
- **Suffix layering** — file-suffix convention for the architectural layer (`*.ts` shared, `*.server.ts` service / data-access, `*.client.ts` browser-only). Enforced by `motive/no-cross-layer-import`.

---

*End of report. For deeper inspection of any pattern, the file paths in §12.1 are the ground truth; the timeline in §2 is reconstructed from `git log` and `docs/agent-memory/PROGRESS.md`; the SOTA delta in §10 is sourced from upstream release pages as of 2026-06-03.*

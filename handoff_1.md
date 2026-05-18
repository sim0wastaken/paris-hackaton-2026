# Handoff 1 — Spec Generation Brief

> Purpose: this file is the input for the next wave of agents. Their job is **not implementation**. Their job is to ground, research, and draft detailed `spec.md` files for each phase of the Motive OpenAI-first hackathon build.

## Read First

Agents must read these files before drafting any spec:

1. `docs/briefing-files/motive-openai-first-hackathon-plan.md`
2. Latest plan in `docs/exec-plans/active/` (e.g. `2026-05-16-openai-first-demo-plan.md`)
3. `README.md`
4. `RUNBOOK.md`
5. `CLAUDE.md` → `AGENTS.md` → `ARCHITECTURE.md`
6. `docs/agent-memory/DECISIONS.md`
7. `docs/agent-memory/STACK.md`
8. `parishack.excalidraw`

The canonical product direction is:

```text
Brand URL + context
  -> streaming OpenAI extraction
  -> live HITL review
  -> ad groups
  -> creatives
  -> fake deploy
  -> story-driven monitoring
  -> future Pioneer classifier after data exists
```

## Global Non-negotiables

- V1 is **OpenAI-first** and must be fully independent from Pioneer.
- Do not block the demo on Pioneer fine-tuning, Pioneer inference, or Adaptive Inference.
- Extraction must not be a spinner. Use phase-by-phase updates through Supabase Realtime and/or Inngest/background jobs.
- Persist every provider input/output and every generated artifact.
- Monitoring KPIs must tell a coherent story tied to ad-group/creative quality. No random KPI mocks.
- Fake deploy is in scope. Real ad-platform deployment is out of scope.
- Specs must be hackathon-lean: enough to build, no enterprise bloat.
- Each spec must define acceptance criteria and the minimal demo path.

## Required Output

Generate **10 specs** under:

```text
docs/superpowers/specs/
```

Use this filename format:

```text
2026-05-16-XX-<phase-name>-spec.md
```

Each spec should contain:

- Problem / user value
- Scope
- Non-goals
- Required research and grounding notes
- Data model touched
- API/server boundaries
- UI states and interactions
- Background jobs / realtime events, if relevant
- Provider calls, prompts, and persistence requirements
- Failure states
- Acceptance criteria
- Demo script for that phase
- Open questions / risks

## Spec List

### Spec 01 — Project Scaffold and Runtime

**File:** `docs/superpowers/specs/2026-05-16-01-project-scaffold-runtime-spec.md`

Define the app foundation.

Must cover:

- Next.js app under `apps/web`
- TypeScript, Tailwind, React UI structure
- Supabase client/server setup
- Inngest setup
- Provider env parsing
- Route/layout structure
- Shared workflow navigation: Intake, Extraction/Review, Creatives, Monitoring
- Local dev commands
- `.env.example` requirements

Research:

- Current Next.js app-router best practices
- Supabase JS client setup for server/client contexts
- Inngest with Next.js route handlers

Acceptance:

- App boots locally.
- Env validation is clear.
- Empty shell has the workflow navigation.

### Spec 02 — Database Schema and Persistence Contract

**File:** `docs/superpowers/specs/2026-05-16-02-database-schema-spec.md`

Define the complete database contract before workflow implementation.

Must cover tables:

- `projects`
- `sources`
- `extraction_runs`
- `brand_features`
- `conversations`
- `landing_gaps`
- `ad_groups`
- `creative_variants`
- `human_reviews`
- `deployments`
- `performance_snapshots`

Must define:

- UUID primary keys
- timestamps
- JSONB fields
- foreign keys
- indexes for project workspace queries
- review status enums
- extraction phase enums
- performance fields: `quality_score`, `insight`, `recommended_action`
- seed data strategy

Research:

- Supabase migration conventions
- Realtime requirements for tables used by live HITL
- Minimal RLS posture for hackathon demo

Acceptance:

- Schema supports the entire demo path.
- Every OpenAI input/output can be stored.
- Future Pioneer export can be generated from stored rows.

### Spec 03 — Intake and Source Ingestion

**File:** `docs/superpowers/specs/2026-05-16-03-intake-source-ingestion-spec.md`

Define the first user-facing flow.

Must cover:

- Brand/homepage URL input
- Optional context: text, Markdown, PDFs if feasible
- Source records
- Source extraction status
- Tavily usage for URL extraction if available
- Fallback manual text path if Tavily/files are not ready
- Immediate route into the project workspace

Research:

- Tavily extract/search APIs from local docs
- Minimal file upload path with Supabase Storage, or a lean text-only fallback
- PDF/Markdown parsing feasibility for hackathon time

Acceptance:

- User can create a project from a URL.
- User can add extra context.
- Sources are persisted and visible.
- The flow works with a seeded/demo source if providers fail.

### Spec 04 — Streaming OpenAI Extraction Pipeline

**File:** `docs/superpowers/specs/2026-05-16-04-streaming-openai-extraction-spec.md`

Define the core extraction engine.

Must cover extraction phases:

1. `source_recap`
2. `feature_map`
3. `conversation_map`
4. `intent_classification`
5. `landing_gaps`
6. `ad_groups`
7. `creative_text`
8. `monitoring_synthesis`

Must cover:

- OpenAI prompt contract per phase
- Zod output schemas per phase
- `extraction_runs` write pattern
- Materialization into domain tables
- Inngest/background job orchestration
- Supabase Realtime event model
- Retry/failure handling
- Phase rail status model

Research:

- Current OpenAI structured outputs / JSON schema usage
- Inngest step orchestration and retries
- Supabase Realtime subscriptions for inserted/updated rows

Acceptance:

- No spinner-only waiting state.
- HITL page receives useful rows as phases complete.
- Every phase persists input, output, model, status, and errors.

### Spec 05 — Live HITL Review Workspace

**File:** `docs/superpowers/specs/2026-05-16-05-live-hitl-review-spec.md`

Define the review UI where the demo becomes memorable.

Must cover:

- Phase rail
- Live panels for recap, features, conversations, intents/stages, landing gaps, ad-group ideas
- Approve/edit/reject/enrich actions
- `human_reviews` write contract
- Entity `review_status` updates
- Inline loading states per phase, not whole-page spinner
- Demo-friendly table/card layouts

Research:

- TanStack Table vs simple editable cards for speed
- Supabase Realtime client patterns
- Accessible editable row patterns

Acceptance:

- Rows visibly appear while extraction runs.
- User can edit and approve enough data to generate ad groups/creatives.
- Every human action is persisted.

### Spec 06 — Ad Group Generation

**File:** `docs/superpowers/specs/2026-05-16-06-ad-group-generation-spec.md`

Define how validated extraction output becomes campaign structure.

Must cover:

- Inputs: approved conversations, brand features, landing gaps
- OpenAI generation or deterministic grouping fallback
- Ad group fields: name, rationale, linked conversations, status
- Human approval flow
- Regeneration/enrichment behavior
- Persistence in `ad_groups`

Research:

- Prompt patterns for grouping and deduplication
- Minimal campaign/ad-group semantics for conversational ads

Acceptance:

- Approved extraction rows produce understandable ad groups.
- Each ad group has a clear rationale.
- User can approve/edit groups before creatives.

### Spec 07 — Creative Generation

**File:** `docs/superpowers/specs/2026-05-16-07-creative-generation-spec.md`

Define creative generation per approved ad group.

Must cover:

- Title generation
- Description generation
- Creative angle
- Image/video prompt
- Optional fal.ai asset generation
- Fallback if fal.ai is unavailable
- Review/approve/reject variants
- Persistence in `creative_variants`

Research:

- fal.ai API shape and fastest reliable model/workflow for hackathon
- OpenAI prompt contract for ad copy variants
- Simple asset card UI patterns

Acceptance:

- Each approved ad group can generate at least one title, description, and visual prompt/asset.
- User can review results.
- Output is persisted and available to fake deploy.

### Spec 08 — Fake Deploy and Story-driven Monitoring

**File:** `docs/superpowers/specs/2026-05-16-08-fake-deploy-story-monitoring-spec.md`

Define the final demo loop.

Must cover:

- Fake deploy button
- `deployments` row
- `performance_snapshots` generation
- KPI generation tied to quality, not randomness
- `quality_score`
- `insight`
- `recommended_action`
- Dashboard cards/charts/tables
- Explicit internal labeling that KPIs are simulated

Story rules:

- Specific, time-bound, constraint-aware angles outperform generic angles.
- Strong CTR but weak CVR can indicate unresolved landing gaps.
- Proof-seeking conversations reward proof-heavy copy.
- Pricing-check conversations underperform if pricing clarity is missing.
- Migration/switching conversations reward setup-path and comparison copy.

Research:

- Minimal charting approach with Recharts
- GPT prompt for coherent simulated campaign performance
- Dashboard storytelling patterns

Acceptance:

- Dashboard surfaces an actual insight, not random numbers.
- User can point to the chart and explain where Pioneer would later learn.

### Spec 09 — Seeded Demo Path and Resilience

**File:** `docs/superpowers/specs/2026-05-16-09-seeded-demo-resilience-spec.md`

Define the no-surprises hackathon safety path.

Must cover:

- Seed project
- Seed extraction events that replay progressively
- Seed ad groups and creatives
- Seed story KPIs
- Provider failure fallbacks
- One-click reset demo data
- Smoke test script/manual checklist

Research:

- Best way to seed Supabase locally/remotely
- Inngest local replay or deterministic mock event sequence

Acceptance:

- Demo can run without live provider calls.
- Progressive extraction still appears live.
- Reset is fast enough between judging attempts.

### Spec 10 — Pioneer After-v1 Classifier Path

**File:** `docs/superpowers/specs/2026-05-16-10-pioneer-after-v1-spec.md`

Define Pioneer as the post-v1 layer. This is **not** required for the first working demo, but it must be grounded enough for the pitch and later implementation.

Must cover:

- Exporting training rows from `conversations`, `ad_groups`, `creative_variants`, `human_reviews`, and `performance_snapshots`
- Candidate label heads: stage, intent type, buyer role, constraints, ad group, landing gap, creative angle
- GLiNER2 constraint extraction
- Evaluation against OpenAI labels and/or human-reviewed holdout
- Agreement/latency/cost chart
- Adaptive Inference / retraining narrative
- What not to claim during demo

Research:

- Current Pioneer docs for fine-tuning, inference, feedback, Adaptive Inference, and GLiNER2
- Dataset format required by Pioneer
- Minimal export format from Supabase/Postgres

Acceptance:

- Spec explains exactly how v1 data becomes a Pioneer training/eval set.
- Spec keeps Pioneer out of the v1 critical path.
- Pitch language is honest: OpenAI-first today, Pioneer classifier tomorrow.

## Cross-spec Dependencies

Specs must coordinate around these interfaces:

- `projects.id` is the root ID for all workflow data.
- `extraction_runs.phase` drives the live phase rail and materialization.
- HITL edits write to `human_reviews` and update entity status.
- Only approved ad groups feed creative generation.
- Only approved creatives feed fake deploy and performance snapshots.
- `performance_snapshots` must include story fields for future Pioneer training.
- Seeded demo data must exercise the same paths as live provider data.

## Required Research Standard

Each spec-writing agent should:

- Prefer official docs and existing repo docs.
- Use Context7 for current library/API docs where available.
- Record any assumptions and API uncertainties.
- Keep the spec grounded in what can be built in a hackathon.
- Avoid designing unused enterprise architecture.

## Final Packaging

After all specs are drafted, create an index:

```text
docs/superpowers/specs/INDEX.md
```

The index should list:

- spec filename
- owner/agent
- phase
- dependencies
- implementation priority
- whether it is required for demo or post-v1

Implementation priority:

1. Specs 01-03: foundation
2. Specs 04-05: memorable extraction/HITL demo
3. Specs 06-08: campaign output and monitoring
4. Spec 09: safety path
5. Spec 10: post-v1 Pioneer narrative

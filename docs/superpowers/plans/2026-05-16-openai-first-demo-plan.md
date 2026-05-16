# OpenAI-first Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the lean hackathon demo loop: brand URL/context ingestion, streaming OpenAI extraction, persisted reviewable data, ad groups, creatives, fake deploy, and story-driven monitoring.

**Architecture:** Keep v1 independent from Pioneer. The database is the system of record for every source, OpenAI request/response, generated artifact, review action, creative, and story KPI. Provider integrations should be thin services called by Inngest/background jobs or server actions, with Supabase Realtime updating the HITL page as each phase completes.

**Tech Stack:** Next.js / React / TypeScript, Supabase Postgres/Auth/Realtime/Storage, Inngest, OpenAI, Tavily optional for URL extraction, fal.ai optional for creative assets, Zod for schemas, TanStack Query/Table, Tailwind, Lucide.

---

## File Structure

- Create app scaffold under `apps/web/`.
- Create database schema/migrations under `supabase/migrations/`.
- Create provider clients under `apps/web/src/lib/providers/`.
- Create domain services under `apps/web/src/lib/motive/`.
- Create background jobs under `apps/web/src/inngest/`.
- Create pages under `apps/web/src/app/`.
- Create UI components under `apps/web/src/components/`.

## Task 1: Scaffold App + Providers

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/web/package.json`
- Create: `apps/web/src/lib/env.ts`
- Create: `apps/web/src/lib/providers/openai.ts`
- Create: `apps/web/src/lib/providers/tavily.ts`
- Create: `apps/web/src/lib/providers/fal.ts`
- Create: `apps/web/src/inngest/client.ts`

- [ ] Create the Next.js app and install only the packages needed for the demo.
- [ ] Add env parsing for `OPENAI_API_KEY`, `TAVILY_API_KEY`, `FAL_KEY`, `DATABASE_URL`, and Supabase vars.
- [ ] Add thin provider clients. Each client should expose one function used by the domain layer, not provider details scattered across UI code.
- [ ] Add an Inngest client for extraction and creative jobs.
- [ ] Run the scaffold locally and confirm the default page loads.

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/20260516_motive_core.sql`
- Create: `apps/web/src/lib/motive/types.ts`

- [ ] Create tables: `projects`, `sources`, `extraction_runs`, `brand_features`, `conversations`, `landing_gaps`, `ad_groups`, `creative_variants`, `human_reviews`, `deployments`, `performance_snapshots`.
- [ ] Add UUID primary keys and timestamps to every table.
- [ ] Add foreign keys from child tables to `projects`.
- [ ] Use JSONB for provider inputs/outputs, constraints, source refs, and fake deployment payloads.
- [ ] Include `quality_score`, `insight`, and `recommended_action` columns on `performance_snapshots`.
- [ ] Add TypeScript/Zod types matching the schema.
- [ ] Seed one demo project so dashboards are not empty during development.

## Task 3: Project Intake

**Files:**
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/projects/[id]/page.tsx`
- Create: `apps/web/src/components/project-intake.tsx`
- Create: `apps/web/src/lib/motive/projects.ts`

- [ ] Build the landing intake form: brand URL plus optional text/Markdown context.
- [ ] On submit, create `projects` and `sources` rows.
- [ ] Route to the project workspace.
- [ ] Show source processing status.

## Task 4: OpenAI Extraction Pipeline

**Files:**
- Create: `apps/web/src/lib/motive/extraction.ts`
- Create: `apps/web/src/app/api/projects/[id]/extract/route.ts`
- Create: `apps/web/src/inngest/extraction.ts`
- Create: `apps/web/src/components/extraction-phase-rail.tsx`

- [ ] Implement extraction phases: source recap, feature map, conversation map, landing gaps, ad-group proposal.
- [ ] Persist every phase in `extraction_runs` with `input_json`, `output_json`, model, prompt version, status, and errors.
- [ ] Materialize accepted output into `brand_features`, `conversations`, `landing_gaps`, and draft `ad_groups`.
- [ ] Trigger extraction through Inngest/background jobs instead of making the request wait on all OpenAI calls.
- [ ] Stream phase completion into the review UI using Supabase Realtime subscriptions.
- [ ] Avoid a spinner-only waiting state. The review page should fill in progressively: recap, features, conversations, intents/stages, landing gaps, ad groups.

## Task 5: HITL Review

**Files:**
- Create: `apps/web/src/app/projects/[id]/review/page.tsx`
- Create: `apps/web/src/components/review-table.tsx`
- Create: `apps/web/src/components/live-review-workspace.tsx`
- Create: `apps/web/src/lib/motive/reviews.ts`

- [ ] Show extracted features, conversations, landing gaps, and ad groups in editable tables as soon as each phase completes.
- [ ] Keep the phase rail visible so the judge sees progress and new rows appearing.
- [ ] Support approve, edit, reject, and enrich actions.
- [ ] Write every action to `human_reviews`.
- [ ] Update each entity's `review_status`.

## Task 6: Creative Generation

**Files:**
- Create: `apps/web/src/app/projects/[id]/creatives/page.tsx`
- Create: `apps/web/src/app/api/projects/[id]/creatives/route.ts`
- Create: `apps/web/src/lib/motive/creatives.ts`
- Create: `apps/web/src/components/creative-grid.tsx`

- [ ] Generate title, description, creative angle, and image/video prompt for each approved ad group.
- [ ] Persist every variant in `creative_variants`.
- [ ] If fal.ai is available, generate one image per approved ad group; otherwise persist the prompt and mark asset generation as skipped.
- [ ] Let the user approve/reject variants.

## Task 7: Fake Deploy + Monitoring

**Files:**
- Create: `apps/web/src/app/projects/[id]/monitoring/page.tsx`
- Create: `apps/web/src/app/api/projects/[id]/deploy/route.ts`
- Create: `apps/web/src/lib/motive/deployments.ts`
- Create: `apps/web/src/lib/motive/performance.ts`
- Create: `apps/web/src/components/monitoring-dashboard.tsx`

- [ ] Add a fake deploy button that writes a `deployments` row.
- [ ] Generate story-driven `performance_snapshots` for approved creatives. Use GPT or deterministic rules to correlate metrics with creative specificity, landing gaps, and buyer intent.
- [ ] Show KPI cards and a table by conversation, ad group, and creative.
- [ ] Surface insight text and recommended action, not just numbers.
- [ ] Include clear internal labeling that KPIs are simulated for the hackathon demo.

## Task 8: Demo Polish

**Files:**
- Modify: project navigation/layout files
- Modify: `README.md`
- Modify: `RUNBOOK.md`

- [ ] Add a left-nav or top workflow stepper: Intake, Extraction, Review, Creatives, Monitoring.
- [ ] Add empty/loading/error states for every page.
- [ ] Add a seeded demo path that can be completed without external providers, including progressive extraction events and story KPIs.
- [ ] Update run instructions once the app runs locally.
- [ ] Run the full smoke path from URL intake to monitoring.

## Post-v1: Pioneer Layer

Do this only after Tasks 1-8 work:

- Export training rows from `conversations`, `ad_groups`, `creative_variants`, `human_reviews`, and `performance_snapshots`.
- Train or evaluate a Pioneer classifier for repeated labeling.
- Use GLiNER2 for constraint extraction.
- Compare Pioneer to GPT labels on agreement, latency, and cost.

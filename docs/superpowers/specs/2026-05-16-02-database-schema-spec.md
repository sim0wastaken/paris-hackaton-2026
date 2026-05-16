# Spec 02: Database Schema and Persistence Contract

Date: 2026-05-16  
Owner: Worker A  
Status: Draft  
Phase: Data Foundation

## Problem / User Value

Motive's demo is only credible if every AI input, output, review action, generated artifact, fake deployment, and monitoring insight is persisted. The database is the product substrate, the audit trail, and the future Pioneer training corpus.

This spec defines the complete Postgres contract before workflow implementation so extraction, HITL review, creative generation, fake deploy, and monitoring workers can build independently against the same durable model.

## Goals

- Define concrete Supabase Postgres tables, columns, enums, indexes, realtime posture, and RLS posture for the full demo loop.
- Ensure every OpenAI provider request/response and every generated artifact can be replayed or exported.
- Support progressive HITL updates through project-scoped Realtime subscriptions.
- Keep the schema hackathon-lean while preserving a clean future Pioneer export path.

## Scope

P0 schema tables:

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

P0 database features:

- UUID primary keys.
- `created_at` and `updated_at` timestamps on every table.
- JSONB fields for provider payloads, source references, constraints, and flexible demo metadata.
- Foreign keys from child rows to `projects`.
- Concrete enums for project status, source type/status, extraction phase/status, review status/action, ad group status, creative status/type, deployment status, and performance snapshot kind.
- Project workspace indexes.
- Realtime publication for tables used by live review and monitoring.
- Minimal RLS posture for hackathon demo.
- Seed strategy for a resilient demo path.

## Non-Goals

- No enterprise tenant/org model in v1.
- No billing, invitation, team role, SSO, or user administration schema.
- No Pioneer training tables yet. V1 only stores enough normalized rows and JSON payloads to export later.
- No real ad-platform campaign/ad IDs beyond fake deployment payload fields.
- No data warehouse, vector store, or analytics mart.
- No irreversible destructive migrations during the hackathon; prefer additive migrations after the first core migration.

## Research Notes

- Supabase local development docs recommend migration files under `supabase/migrations`, `supabase db reset` to apply current migrations and seed data, and `supabase/seed.sql` for repeatable local seed rows. Source: [Supabase local development with migrations](https://supabase.com/docs/guides/cli/local-development).
- Supabase RLS docs state RLS should be enabled on tables in exposed schemas, policies control API access, `service_role` bypasses RLS and must never be exposed in the browser, and indexes should exist on policy columns. Source: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Supabase Realtime docs require adding tables to the `supabase_realtime` publication for Postgres change subscriptions; clients subscribe to `postgres_changes` events and can filter by table/column; RLS governs visible records. Source: [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- Supabase SSR docs support separate browser/server clients for Next.js App Router; this schema assumes browser reads and realtime are safe under RLS, while server jobs use service-role writes. Source: [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- Supabase Storage docs support direct standard uploads for small files and note that unique paths avoid overwrite/CDN staleness. Source: [Supabase Storage standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads).
- PostgreSQL JSONB is appropriate for provider request/response payloads and source references that need auditability but do not need heavy relational querying in v1.
- Future Pioneer export should come from normalized rows plus `human_reviews`, `extraction_runs`, `creative_variants`, and `performance_snapshots`; no Pioneer dependency is required in this schema.

## Migration Files

Create:

```text
supabase/migrations/202605160001_motive_core.sql
supabase/seed.sql
```

The first migration should be self-contained:

- Enable `pgcrypto` or `uuid-ossp` for UUID generation. Prefer `gen_random_uuid()` via `pgcrypto`.
- Create enums first.
- Create tables in dependency order.
- Add `updated_at` trigger function and per-table triggers.
- Enable RLS on all public tables.
- Add policies.
- Add indexes.
- Add realtime publication entries.

## Enums

```sql
create type project_status as enum (
  'draft',
  'extracting',
  'review',
  'creative_ready',
  'deployed',
  'failed'
);

create type source_type as enum (
  'url',
  'pdf',
  'markdown',
  'text',
  'screenshot'
);

create type source_status as enum (
  'pending',
  'processing',
  'processed',
  'failed',
  'skipped'
);

create type extraction_phase as enum (
  'source_recap',
  'feature_map',
  'conversation_map',
  'intent_classification',
  'landing_gaps',
  'ad_groups',
  'creative_text',
  'monitoring_synthesis'
);

create type run_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

create type review_status as enum (
  'pending',
  'approved',
  'edited',
  'rejected',
  'enriched'
);

create type feature_type as enum (
  'feature',
  'value_prop',
  'usp',
  'use_case',
  'proof_point',
  'objection'
);

create type review_entity_type as enum (
  'brand_feature',
  'conversation',
  'landing_gap',
  'ad_group',
  'creative_variant',
  'performance_snapshot'
);

create type review_action as enum (
  'approve',
  'edit',
  'reject',
  'enrich'
);

create type ad_group_status as enum (
  'draft',
  'approved',
  'creative_generated',
  'deployed',
  'rejected'
);

create type creative_asset_type as enum (
  'image',
  'video',
  'none'
);

create type creative_status as enum (
  'draft',
  'approved',
  'rejected',
  'asset_pending',
  'asset_ready',
  'asset_failed'
);

create type deployment_status as enum (
  'fake_deployed',
  'failed'
);

create type performance_snapshot_kind as enum (
  'simulated',
  'imported'
);
```

## Common Columns

Every table:

- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Use one shared trigger:

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Add `before update` triggers for every table.

## Tables

### `projects`

Stores one brand/campaign workspace.

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  brand_url text not null,
  status project_status not null default 'draft',
  extra_context text,
  demo_slug text unique,
  metadata jsonb not null default '{}'::jsonb
);
```

Notes:

- `owner_user_id` is nullable so seed/demo mode can work before auth is fully implemented.
- `demo_slug` supports stable demo lookup, for example `motive-demo`.
- `metadata` can hold category, ICP summary, or one-off demo flags without schema churn.

Indexes:

```sql
create index projects_owner_created_idx on projects(owner_user_id, created_at desc);
create index projects_status_created_idx on projects(status, created_at desc);
create index projects_demo_slug_idx on projects(demo_slug);
```

### `sources`

Stores URL, file, text, or screenshot inputs plus extracted content.

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  type source_type not null,
  name text not null,
  uri text,
  storage_path text,
  mime_type text,
  raw_text text,
  extracted_text text,
  status source_status not null default 'pending',
  provider text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index sources_project_created_idx on sources(project_id, created_at desc);
create index sources_project_status_idx on sources(project_id, status);
create index sources_project_type_idx on sources(project_id, type);
```

### `extraction_runs`

Stores phase execution, provider payloads, model metadata, status, and errors.

```sql
create table extraction_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  phase extraction_phase not null,
  status run_status not null default 'queued',
  model text,
  provider text not null default 'openai',
  prompt_version text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  attempt integer not null default 0,
  inngest_run_id text,
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index extraction_runs_project_created_idx on extraction_runs(project_id, created_at desc);
create index extraction_runs_project_phase_idx on extraction_runs(project_id, phase);
create index extraction_runs_project_status_idx on extraction_runs(project_id, status);
create unique index extraction_runs_project_phase_attempt_idx
  on extraction_runs(project_id, phase, attempt);
```

The unique index prevents accidental duplicate phase attempts while still allowing explicit retries with incremented `attempt`.

### `brand_features`

Stores extracted product facts, value props, USPs, proof points, use cases, and objections.

```sql
create table brand_features (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  extraction_run_id uuid references extraction_runs(id) on delete set null,
  type feature_type not null,
  title text not null,
  description text not null,
  evidence text,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4,3),
  review_status review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index brand_features_project_created_idx on brand_features(project_id, created_at desc);
create index brand_features_project_review_idx on brand_features(project_id, review_status);
create index brand_features_project_type_idx on brand_features(project_id, type);
```

### `conversations`

Stores buying conversations, stages, intents, roles, constraints, and source grounding.

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  extraction_run_id uuid references extraction_runs(id) on delete set null,
  text text not null,
  stage text not null,
  intent_type text not null,
  buyer_role text,
  constraints_json jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4,3),
  review_status review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index conversations_project_created_idx on conversations(project_id, created_at desc);
create index conversations_project_review_idx on conversations(project_id, review_status);
create index conversations_project_stage_idx on conversations(project_id, stage);
create index conversations_project_intent_idx on conversations(project_id, intent_type);
create index conversations_constraints_gin_idx on conversations using gin (constraints_json);
```

Use text for `stage` and `intent_type` in v1 because OpenAI labels may evolve during the hackathon. If the labels stabilize, add enums later.

### `landing_gaps`

Stores missing proof, comparison, setup, pricing, trust, and compliance gaps linked to conversations when possible.

```sql
create table landing_gaps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  extraction_run_id uuid references extraction_runs(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  gap_type text not null,
  description text not null,
  suggested_fix text not null,
  severity smallint not null default 2 check (severity between 1 and 5),
  source_refs jsonb not null default '[]'::jsonb,
  review_status review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index landing_gaps_project_created_idx on landing_gaps(project_id, created_at desc);
create index landing_gaps_project_review_idx on landing_gaps(project_id, review_status);
create index landing_gaps_project_conversation_idx on landing_gaps(project_id, conversation_id);
create index landing_gaps_project_type_idx on landing_gaps(project_id, gap_type);
```

### `ad_groups`

Stores campaign-ready groupings generated from validated conversations/features/gaps.

```sql
create table ad_groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  extraction_run_id uuid references extraction_runs(id) on delete set null,
  name text not null,
  rationale text not null,
  target_stage text,
  target_intent text,
  conversation_ids uuid[] not null default '{}'::uuid[],
  feature_ids uuid[] not null default '{}'::uuid[],
  landing_gap_ids uuid[] not null default '{}'::uuid[],
  status ad_group_status not null default 'draft',
  review_status review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index ad_groups_project_created_idx on ad_groups(project_id, created_at desc);
create index ad_groups_project_status_idx on ad_groups(project_id, status);
create index ad_groups_project_review_idx on ad_groups(project_id, review_status);
create index ad_groups_conversation_ids_gin_idx on ad_groups using gin (conversation_ids);
```

Arrays are acceptable for the hackathon because ad-group relationships are read mostly as project-scoped bundles. If relation-level analytics become important, replace with join tables after v1.

### `creative_variants`

Stores copy variants, creative angles, image/video prompts, and optional generated asset references.

```sql
create table creative_variants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  ad_group_id uuid not null references ad_groups(id) on delete cascade,
  extraction_run_id uuid references extraction_runs(id) on delete set null,
  title text not null,
  description text not null,
  creative_angle text not null,
  asset_type creative_asset_type not null default 'none',
  asset_prompt text,
  asset_url text,
  asset_storage_path text,
  provider text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  status creative_status not null default 'draft',
  review_status review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index creative_variants_project_created_idx on creative_variants(project_id, created_at desc);
create index creative_variants_project_status_idx on creative_variants(project_id, status);
create index creative_variants_ad_group_idx on creative_variants(ad_group_id, created_at desc);
create index creative_variants_project_review_idx on creative_variants(project_id, review_status);
```

### `human_reviews`

Append-only history of approvals, edits, rejections, and enrichments.

```sql
create table human_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  entity_type review_entity_type not null,
  entity_id uuid not null,
  action review_action not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  comment text,
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index human_reviews_project_created_idx on human_reviews(project_id, created_at desc);
create index human_reviews_entity_idx on human_reviews(entity_type, entity_id, created_at desc);
create index human_reviews_project_action_idx on human_reviews(project_id, action);
```

Do not update old review rows except for `updated_at` if unavoidable. Treat this table as append-only in application code.

### `deployments`

Stores fake deploy records and payloads for demo continuity.

```sql
create table deployments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  status deployment_status not null default 'fake_deployed',
  deployed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index deployments_project_created_idx on deployments(project_id, created_at desc);
create index deployments_project_status_idx on deployments(project_id, status);
```

### `performance_snapshots`

Stores simulated or imported KPI rows tied to ad-group/creative quality.

```sql
create table performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references projects(id) on delete cascade,
  deployment_id uuid references deployments(id) on delete set null,
  ad_group_id uuid references ad_groups(id) on delete set null,
  creative_variant_id uuid references creative_variants(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  snapshot_kind performance_snapshot_kind not null default 'simulated',
  period_start timestamptz not null default now(),
  period_end timestamptz not null default now(),
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  ctr numeric(7,4) not null default 0 check (ctr >= 0),
  conversions integer not null default 0 check (conversions >= 0),
  cvr numeric(7,4) not null default 0 check (cvr >= 0),
  spend numeric(12,2) not null default 0 check (spend >= 0),
  quality_score numeric(4,2) not null check (quality_score >= 0 and quality_score <= 10),
  insight text not null,
  recommended_action text not null,
  notes text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);
```

Indexes:

```sql
create index performance_snapshots_project_created_idx on performance_snapshots(project_id, created_at desc);
create index performance_snapshots_project_ad_group_idx on performance_snapshots(project_id, ad_group_id);
create index performance_snapshots_project_creative_idx on performance_snapshots(project_id, creative_variant_id);
create index performance_snapshots_project_conversation_idx on performance_snapshots(project_id, conversation_id);
create index performance_snapshots_quality_idx on performance_snapshots(project_id, quality_score desc);
```

Quality fields are required because monitoring must tell a coherent story, not show random KPI mocks.

## Realtime Posture

Add to `supabase_realtime` publication:

```sql
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table sources;
alter publication supabase_realtime add table extraction_runs;
alter publication supabase_realtime add table brand_features;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table landing_gaps;
alter publication supabase_realtime add table ad_groups;
alter publication supabase_realtime add table creative_variants;
alter publication supabase_realtime add table human_reviews;
alter publication supabase_realtime add table deployments;
alter publication supabase_realtime add table performance_snapshots;
```

Primary client subscriptions:

- Review workspace subscribes by `project_id` to `extraction_runs`, `brand_features`, `conversations`, `landing_gaps`, `ad_groups`, and `human_reviews`.
- Creatives page subscribes by `project_id` to `ad_groups`, `creative_variants`, and `human_reviews`.
- Monitoring page subscribes by `project_id` to `deployments` and `performance_snapshots`.

No table should use spaces in names. Payload sizes should stay modest; large provider responses belong in JSONB but UI subscriptions should select only needed columns where possible.

## RLS Posture

Hackathon v1 should be secure enough without slowing the build.

Principles:

- Enable RLS on all public tables.
- Browser clients may read and mutate only rows visible to their project/session policy.
- Inngest and server-side materialization use `SUPABASE_SERVICE_ROLE_KEY` from server-only code.
- Service-role key must never be imported in Client Components.
- Index `owner_user_id` and `project_id` columns used by policies.

Minimal demo policies:

```sql
alter table projects enable row level security;
-- repeat for every table

create policy "demo projects are readable"
on projects for select
to anon, authenticated
using (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy "demo projects are insertable"
on projects for insert
to anon, authenticated
with check (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy "demo projects are updateable"
on projects for update
to anon, authenticated
using (owner_user_id is null or owner_user_id = (select auth.uid()))
with check (owner_user_id is null or owner_user_id = (select auth.uid()));
```

For child tables, repeat project membership through an `exists` check:

```sql
create policy "project rows are readable"
on sources for select
to anon, authenticated
using (
  exists (
    select 1
    from projects
    where projects.id = sources.project_id
      and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))
  )
);
```

Apply equivalent `select`, `insert`, `update`, and limited `delete` policies to child tables during implementation. If time is tight, allow deletes only from service-role server code and skip browser delete policies.

Risk note: Allowing `owner_user_id is null` gives a low-friction public demo mode. Before any real deployment, require authenticated owners or signed demo access tokens.

## Storage Posture

Use one private bucket:

```text
motive-sources
```

Paths:

```text
projects/{project_id}/sources/{source_id}/{filename}
projects/{project_id}/creatives/{creative_variant_id}/{filename}
```

Storage rows are referenced from:

- `sources.storage_path`
- `creative_variants.asset_storage_path`

P0 can skip file uploads and store raw text/url context only. If uploads are implemented, use unique paths and RLS-aware storage policies in a later migration.

## Seed Strategy

Create `supabase/seed.sql` with one complete demo project that can exercise all screens without provider keys.

Seed should include:

- One `projects` row with `demo_slug = 'motive-demo'`, status `review` or `creative_ready`.
- Two `sources`: one URL source and one text/markdown context source.
- Successful `extraction_runs` rows for `source_recap`, `feature_map`, `conversation_map`, `intent_classification`, `landing_gaps`, and `ad_groups`.
- At least 10 `brand_features` across feature, value prop, USP, use case, proof point, and objection.
- At least 6 `conversations` across different stages/intents.
- At least 4 `landing_gaps`, each with suggested fix.
- At least 3 `ad_groups` linking conversations/features/gaps.
- At least 2 `creative_variants` per ad group.
- Several `human_reviews` showing approve/edit/reject/enrich actions.
- One `deployments` fake deploy row.
- At least 6 `performance_snapshots` where `quality_score`, `insight`, and `recommended_action` tell a coherent story.

Seed narrative should mirror the brief:

- Specific, constraint-aware creative outperforms generic copy.
- Landing-gap-aligned creative earns higher CTR but can lag CVR if the page gap remains unresolved.
- Proof-seeking conversations reward proof-heavy copy.
- Pricing-check conversations underperform when pricing clarity is missing.

## API / Server Contract

Server routes and Inngest jobs should write using this pattern:

1. Insert `extraction_runs` row with `queued`.
2. Update to `running` with `started_at`.
3. Store full provider `input_json`, `model`, `prompt_version`, and provider name.
4. Store full provider `output_json` on success.
5. Materialize normalized rows into domain tables.
6. Update `extraction_runs.status`, `completed_at`, and `duration_ms`.
7. On failure, store `error`, keep `input_json`, and mark `failed`.

HITL update pattern:

1. Read current row.
2. Insert `human_reviews` with `before_json`, `after_json`, `action`, and `comment`.
3. Update target entity `review_status`.
4. Preserve original extraction grounding in `source_refs` and `metadata`.

Creative/fake deploy pattern:

- Creative generation writes both `creative_variants` and provider payload JSON.
- Fake deploy writes one `deployments` row with the payload that would have gone to an ad platform.
- Monitoring synthesis writes `performance_snapshots` tied to `ad_group_id`, `creative_variant_id`, and ideally `conversation_id`.

## UI States Supported by Schema

- Intake empty state: no `projects` row yet.
- Project created: `projects.status = 'draft'` with at least one `sources` row.
- Source processing: `sources.status in ('pending', 'processing')`.
- Extraction running: `projects.status = 'extracting'` and phase rows in `extraction_runs` with `queued` or `running`.
- Live review filling in: inserted `brand_features`, `conversations`, `landing_gaps`, and `ad_groups` rows with `review_status = 'pending'`.
- Human validation: target row `review_status` changes and append-only `human_reviews` rows appear.
- Creative generation ready: approved ad groups exist.
- Creative review: `creative_variants.review_status` and `creative_variants.status` drive draft/approved/rejected/asset states.
- Fake deployed: `deployments.status = 'fake_deployed'` and project status can move to `deployed`.
- Monitoring ready: `performance_snapshots` exists with `quality_score`, `insight`, and `recommended_action`.
- Recoverable failure: per-row `status = 'failed'` and `error` columns preserve enough context for retry UI.

## Provider and Prompt Persistence Requirements

- Every OpenAI extraction phase must create or update an `extraction_runs` row with `provider = 'openai'`, `model`, `prompt_version`, `input_json`, `output_json`, and `status`.
- Tavily/source extraction, if used, must store request/response JSON on `sources`.
- fal.ai or other asset generation, if used, must store request/response JSON on `creative_variants`.
- Monitoring synthesis must store request/response JSON on `performance_snapshots` when generated by OpenAI.
- Normalized domain rows must keep `extraction_run_id` where available so a demo row can be traced back to its prompt and model output.
- Prompt text can live in application code, but prompt version must be persisted in each run; if prompt text changes during the hackathon, increment `prompt_version`.
- Failed provider calls should still persist input payload, model/provider, error text, and timestamps.

## Future Pioneer Export Contract

The schema supports a future export without new v1 tables:

- Inputs: `sources.extracted_text`, `brand_features`, `conversations`, `landing_gaps`.
- Labels: `conversations.stage`, `conversations.intent_type`, `constraints_json`, `ad_groups.target_intent`.
- Corrections: `human_reviews.before_json`, `human_reviews.after_json`, `action`.
- Outcomes: `creative_variants`, `performance_snapshots.quality_score`, `insight`, `recommended_action`.
- Provenance: `extraction_runs.model`, `prompt_version`, `input_json`, `output_json`.

Do not add Pioneer columns in v1. Use export queries when Pioneer work starts.

## Failure States

- Provider failure: `extraction_runs.status = 'failed'`, `error` set, no partial normalized writes unless the phase can be safely retried.
- Source extraction failure: `sources.status = 'failed'`, `error` set, project remains usable with manual text fallback.
- Partial materialization failure: keep failed phase in `extraction_runs`; later retry should upsert by `project_id` and phase attempt rather than duplicate rows.
- Realtime unavailable: rows remain queryable by normal page reload because Postgres is source of truth.
- Review conflict: application should insert a review row with the stale `before_json` and reject or reapply based on latest `updated_at`.
- Invalid KPI generation: reject snapshots missing `quality_score`, `insight`, or `recommended_action`.

## Acceptance Criteria

- Migration creates all required tables with UUID primary keys and timestamps.
- Every child table has a foreign key to `projects`.
- Provider inputs/outputs can be stored for sources, extraction runs, creative variants, and performance snapshots.
- `extraction_phase` includes all eight OpenAI-first phases: `source_recap`, `feature_map`, `conversation_map`, `intent_classification`, `landing_gaps`, `ad_groups`, `creative_text`, and `monitoring_synthesis`.
- `review_status` and `human_reviews.action` support approve, edit, reject, and enrich flows.
- Workspace queries are indexed by `project_id`, status/review status, and creation time.
- Tables used by live HITL are added to `supabase_realtime`.
- RLS is enabled on public tables with a documented demo policy.
- Seed data can load a complete demo path without provider keys.
- The schema can store every OpenAI input/output and every generated artifact.
- Future Pioneer export can be generated from stored rows without changing v1 workflow tables.

## Demo Script

1. Run `pnpm db:start`.
2. Run `pnpm db:reset` to apply `202605160001_motive_core.sql` and `supabase/seed.sql`.
3. Open Supabase Studio locally and confirm all core tables exist.
4. Query `projects` by `demo_slug = 'motive-demo'`.
5. Open the app and load the seeded project.
6. Confirm Review can read extraction runs, features, conversations, landing gaps, and ad groups.
7. Approve or edit one row and confirm `human_reviews` receives an append-only row.
8. Confirm Creatives can read ad groups and creative variants.
9. Confirm Monitoring can read fake deployment and story KPI snapshots.
10. Confirm a future Pioneer export query can join conversations, reviews, creatives, and performance snapshots by `project_id`.

## Open Questions / Risks

- `owner_user_id is null` is convenient for the hackathon but too permissive for real users. Tighten before production.
- Arrays on `ad_groups` are lean but less relational than join tables. This is acceptable for v1; add join tables only if implementation needs per-link metadata.
- `stage`, `intent_type`, and `gap_type` are text to keep prompt iteration flexible. Promote to enums after labels stabilize.
- Realtime publication for every table is demo-friendly but may be noisy. If payload volume becomes a problem, remove low-value tables from Realtime and subscribe only to phase/review tables.
- Full provider responses can be large. If rows approach Realtime payload limits, store compact UI fields in normalized columns and keep large payloads server-read only.

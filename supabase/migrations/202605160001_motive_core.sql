-- Motive core persistence schema.
-- Spec: docs/superpowers/specs/2026-05-16-02-database-schema-spec.md

create extension if not exists pgcrypto;

create type public.project_status as enum (
  'draft',
  'extracting',
  'review',
  'creative_ready',
  'deployed',
  'failed'
);

create type public.source_type as enum (
  'url',
  'pdf',
  'markdown',
  'text',
  'screenshot',
  'product_feed'
);

create type public.source_status as enum (
  'pending',
  'processing',
  'processed',
  'failed',
  'skipped',
  'needs_manual_text'
);

create type public.extraction_phase as enum (
  'source_recap',
  'feature_map',
  'conversation_map',
  'intent_classification',
  'landing_gaps',
  'ad_groups',
  'creative_text',
  'monitoring_synthesis'
);

create type public.run_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

create type public.review_status as enum (
  'pending',
  'approved',
  'edited',
  'rejected',
  'enriched'
);

create type public.feature_type as enum (
  'feature',
  'value_prop',
  'usp',
  'use_case',
  'proof_point',
  'objection'
);

create type public.review_entity_type as enum (
  'extraction_run',
  'brand_feature',
  'conversation',
  'landing_gap',
  'campaign',
  'ad_group',
  'creative_variant',
  'performance_snapshot'
);

create type public.review_action as enum (
  'approve',
  'edit',
  'reject',
  'enrich'
);

create type public.ad_group_status as enum (
  'draft',
  'approved',
  'creative_generated',
  'deployed',
  'rejected'
);

create type public.campaign_objective as enum (
  'Views',
  'Clicks'
);

create type public.campaign_status as enum (
  'draft',
  'approved',
  'deployed',
  'rejected'
);

create type public.creative_asset_type as enum (
  'image',
  'video',
  'none'
);

create type public.asset_generation_status as enum (
  'not_requested',
  'pending',
  'skipped',
  'ready',
  'failed'
);

create type public.creative_status as enum (
  'draft',
  'approved',
  'rejected',
  'archived'
);

create type public.deployment_status as enum (
  'fake_deployed',
  'failed'
);

create type public.performance_snapshot_kind as enum (
  'simulated',
  'imported'
);

create type public.product_feed_status as enum (
  'draft',
  'uploaded',
  'processed',
  'failed',
  'export_ready'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  brand_url text not null,
  status public.project_status not null default 'draft',
  extra_context text,
  demo_slug text unique,
  metadata jsonb not null default '{}'::jsonb
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type public.source_type not null,
  name text not null,
  uri text,
  storage_path text,
  mime_type text,
  raw_text text,
  extracted_text text,
  status public.source_status not null default 'pending',
  provider text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extraction_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase public.extraction_phase not null,
  status public.run_status not null default 'queued',
  model text,
  provider text not null default 'openai',
  prompt_version text not null,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  attempt integer not null default 0 check (attempt >= 0),
  inngest_run_id text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.brand_features (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  type public.feature_type not null,
  title text not null,
  description text not null,
  evidence text,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  text text not null,
  stage text not null,
  intent_type text not null,
  buyer_role text,
  constraints_json jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table public.landing_gaps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  gap_type text not null,
  description text not null,
  suggested_fix text not null,
  severity smallint not null default 2 check (severity between 1 and 5),
  source_refs jsonb not null default '[]'::jsonb,
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  name text not null check (char_length(name) >= 3),
  objective public.campaign_objective not null default 'Clicks',
  status public.campaign_status not null default 'draft',
  start_date date,
  end_date date,
  lifetime_spend_limit_micros bigint not null default 5000000 check (lifetime_spend_limit_micros >= 1000000),
  countries text[] not null default array['US']::text[],
  custom_instruction text,
  rationale text,
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.ad_groups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  name text not null check (char_length(name) >= 3),
  rationale text not null,
  context_hints jsonb not null default '[]'::jsonb,
  billing_event_type text not null default 'click',
  max_bid_micros bigint not null default 3000000 check (max_bid_micros > 0),
  target_stage text,
  target_intent text,
  conversation_ids uuid[] not null default '{}'::uuid[],
  feature_ids uuid[] not null default '{}'::uuid[],
  landing_gap_ids uuid[] not null default '{}'::uuid[],
  product_feed_item_ids uuid[] not null default '{}'::uuid[],
  status public.ad_group_status not null default 'draft',
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table public.creative_variants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  ad_group_id uuid not null references public.ad_groups(id) on delete cascade,
  extraction_run_id uuid references public.extraction_runs(id) on delete set null,
  title text not null check (char_length(title) between 3 and 50),
  description text not null check (char_length(description) <= 100),
  creative_angle text not null,
  asset_type public.creative_asset_type not null default 'none',
  asset_prompt text,
  asset_url text,
  asset_storage_path text,
  asset_generation_status public.asset_generation_status not null default 'not_requested',
  asset_width integer check (asset_width is null or asset_width > 0),
  asset_height integer check (asset_height is null or asset_height > 0),
  asset_mime_type text,
  openai_file_id text,
  target_url text,
  openai_ad_type text not null default 'chat_card',
  openai_ad_status text not null default 'paused',
  provider text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  openai_validation_json jsonb not null default '{}'::jsonb,
  status public.creative_status not null default 'draft',
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table public.human_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  entity_type public.review_entity_type not null,
  entity_id uuid not null,
  action public.review_action not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  comment text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status public.deployment_status not null default 'fake_deployed',
  deployed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  deployment_id uuid references public.deployments(id) on delete set null,
  ad_group_id uuid references public.ad_groups(id) on delete set null,
  creative_variant_id uuid references public.creative_variants(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  snapshot_kind public.performance_snapshot_kind not null default 'simulated',
  period_start timestamptz not null default now(),
  period_end timestamptz not null default now(),
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  ctr numeric(7,4) not null default 0 check (ctr >= 0),
  conversions integer not null default 0 check (conversions >= 0),
  cvr numeric(7,4) not null default 0 check (cvr >= 0),
  spend numeric(12,2) not null default 0 check (spend >= 0),
  quality_score integer not null check (quality_score >= 1 and quality_score <= 100),
  insight text not null,
  recommended_action text not null,
  metric_basis_json jsonb not null default '{}'::jsonb,
  confidence text not null default 'medium',
  notes text,
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  check (period_end >= period_start),
  check (clicks <= impressions),
  check (conversions <= clicks)
);

create table public.product_feeds (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  source_type text not null default 'manual',
  source_uri text,
  storage_path text,
  format text,
  status public.product_feed_status not null default 'draft',
  item_count integer not null default 0 check (item_count >= 0),
  provider_request_json jsonb not null default '{}'::jsonb,
  provider_response_json jsonb not null default '{}'::jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.product_feed_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  product_feed_id uuid not null references public.product_feeds(id) on delete cascade,
  item_id text not null,
  title text not null,
  description text,
  link text,
  image_link text,
  availability text,
  price text,
  brand text,
  google_product_category text,
  product_type text,
  condition text,
  raw_json jsonb not null default '{}'::jsonb,
  review_status public.review_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger sources_set_updated_at
  before update on public.sources
  for each row execute function public.set_updated_at();

create trigger extraction_runs_set_updated_at
  before update on public.extraction_runs
  for each row execute function public.set_updated_at();

create trigger brand_features_set_updated_at
  before update on public.brand_features
  for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create trigger landing_gaps_set_updated_at
  before update on public.landing_gaps
  for each row execute function public.set_updated_at();

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create trigger ad_groups_set_updated_at
  before update on public.ad_groups
  for each row execute function public.set_updated_at();

create trigger creative_variants_set_updated_at
  before update on public.creative_variants
  for each row execute function public.set_updated_at();

create trigger human_reviews_set_updated_at
  before update on public.human_reviews
  for each row execute function public.set_updated_at();

create trigger deployments_set_updated_at
  before update on public.deployments
  for each row execute function public.set_updated_at();

create trigger performance_snapshots_set_updated_at
  before update on public.performance_snapshots
  for each row execute function public.set_updated_at();

create trigger product_feeds_set_updated_at
  before update on public.product_feeds
  for each row execute function public.set_updated_at();

create trigger product_feed_items_set_updated_at
  before update on public.product_feed_items
  for each row execute function public.set_updated_at();

create index projects_owner_created_idx on public.projects(owner_user_id, created_at desc);
create index projects_status_created_idx on public.projects(status, created_at desc);
create index projects_demo_slug_idx on public.projects(demo_slug);

create index sources_project_created_idx on public.sources(project_id, created_at desc);
create index sources_project_status_idx on public.sources(project_id, status);
create index sources_project_type_idx on public.sources(project_id, type);

create index extraction_runs_project_created_idx on public.extraction_runs(project_id, created_at desc);
create index extraction_runs_project_phase_idx on public.extraction_runs(project_id, phase);
create index extraction_runs_project_status_idx on public.extraction_runs(project_id, status);
create unique index extraction_runs_project_phase_attempt_idx on public.extraction_runs(project_id, phase, attempt);

create index brand_features_project_created_idx on public.brand_features(project_id, created_at desc);
create index brand_features_project_review_idx on public.brand_features(project_id, review_status);
create index brand_features_project_type_idx on public.brand_features(project_id, type);

create index conversations_project_created_idx on public.conversations(project_id, created_at desc);
create index conversations_project_review_idx on public.conversations(project_id, review_status);
create index conversations_project_stage_idx on public.conversations(project_id, stage);
create index conversations_project_intent_idx on public.conversations(project_id, intent_type);
create index conversations_constraints_gin_idx on public.conversations using gin (constraints_json);

create index landing_gaps_project_created_idx on public.landing_gaps(project_id, created_at desc);
create index landing_gaps_project_review_idx on public.landing_gaps(project_id, review_status);
create index landing_gaps_project_conversation_idx on public.landing_gaps(project_id, conversation_id);
create index landing_gaps_project_type_idx on public.landing_gaps(project_id, gap_type);

create index campaigns_project_created_idx on public.campaigns(project_id, created_at desc);
create index campaigns_project_status_idx on public.campaigns(project_id, status);
create index campaigns_project_review_idx on public.campaigns(project_id, review_status);

create index ad_groups_project_created_idx on public.ad_groups(project_id, created_at desc);
create index ad_groups_campaign_created_idx on public.ad_groups(campaign_id, created_at desc);
create index ad_groups_project_status_idx on public.ad_groups(project_id, status);
create index ad_groups_project_review_idx on public.ad_groups(project_id, review_status);
create index ad_groups_conversation_ids_gin_idx on public.ad_groups using gin (conversation_ids);
create index ad_groups_context_hints_gin_idx on public.ad_groups using gin (context_hints);
create index ad_groups_product_feed_item_ids_gin_idx on public.ad_groups using gin (product_feed_item_ids);

create index creative_variants_project_created_idx on public.creative_variants(project_id, created_at desc);
create index creative_variants_project_status_idx on public.creative_variants(project_id, status);
create index creative_variants_ad_group_idx on public.creative_variants(ad_group_id, created_at desc);
create index creative_variants_project_review_idx on public.creative_variants(project_id, review_status);

create index human_reviews_project_created_idx on public.human_reviews(project_id, created_at desc);
create index human_reviews_entity_idx on public.human_reviews(entity_type, entity_id, created_at desc);
create index human_reviews_project_action_idx on public.human_reviews(project_id, action);

create index deployments_project_created_idx on public.deployments(project_id, created_at desc);
create index deployments_project_status_idx on public.deployments(project_id, status);

create index performance_snapshots_project_created_idx on public.performance_snapshots(project_id, created_at desc);
create index performance_snapshots_project_ad_group_idx on public.performance_snapshots(project_id, ad_group_id);
create index performance_snapshots_project_creative_idx on public.performance_snapshots(project_id, creative_variant_id);
create index performance_snapshots_project_conversation_idx on public.performance_snapshots(project_id, conversation_id);
create index performance_snapshots_quality_idx on public.performance_snapshots(project_id, quality_score desc);

create index product_feeds_project_created_idx on public.product_feeds(project_id, created_at desc);
create index product_feeds_project_status_idx on public.product_feeds(project_id, status);
create index product_feed_items_project_created_idx on public.product_feed_items(project_id, created_at desc);
create index product_feed_items_project_feed_idx on public.product_feed_items(project_id, product_feed_id);
create unique index product_feed_items_feed_item_idx on public.product_feed_items(product_feed_id, item_id);

alter table public.projects enable row level security;
alter table public.sources enable row level security;
alter table public.extraction_runs enable row level security;
alter table public.brand_features enable row level security;
alter table public.conversations enable row level security;
alter table public.landing_gaps enable row level security;
alter table public.campaigns enable row level security;
alter table public.ad_groups enable row level security;
alter table public.creative_variants enable row level security;
alter table public.human_reviews enable row level security;
alter table public.deployments enable row level security;
alter table public.performance_snapshots enable row level security;
alter table public.product_feeds enable row level security;
alter table public.product_feed_items enable row level security;

create policy projects_select_access
on public.projects for select
to anon, authenticated
using (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy projects_insert_access
on public.projects for insert
to anon, authenticated
with check (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy projects_update_access
on public.projects for update
to anon, authenticated
using (owner_user_id is null or owner_user_id = (select auth.uid()))
with check (owner_user_id is null or owner_user_id = (select auth.uid()));

create policy sources_select_project_access on public.sources for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = sources.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy sources_insert_project_access on public.sources for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = sources.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy sources_update_project_access on public.sources for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = sources.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = sources.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy extraction_runs_select_project_access on public.extraction_runs for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = extraction_runs.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy extraction_runs_insert_project_access on public.extraction_runs for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = extraction_runs.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy extraction_runs_update_project_access on public.extraction_runs for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = extraction_runs.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = extraction_runs.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy brand_features_select_project_access on public.brand_features for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = brand_features.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy brand_features_insert_project_access on public.brand_features for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = brand_features.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy brand_features_update_project_access on public.brand_features for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = brand_features.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = brand_features.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy conversations_select_project_access on public.conversations for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = conversations.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy conversations_insert_project_access on public.conversations for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = conversations.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy conversations_update_project_access on public.conversations for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = conversations.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = conversations.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy landing_gaps_select_project_access on public.landing_gaps for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = landing_gaps.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy landing_gaps_insert_project_access on public.landing_gaps for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = landing_gaps.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy landing_gaps_update_project_access on public.landing_gaps for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = landing_gaps.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = landing_gaps.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy campaigns_select_project_access on public.campaigns for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = campaigns.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy campaigns_insert_project_access on public.campaigns for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = campaigns.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy campaigns_update_project_access on public.campaigns for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = campaigns.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = campaigns.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy ad_groups_select_project_access on public.ad_groups for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = ad_groups.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy ad_groups_insert_project_access on public.ad_groups for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = ad_groups.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy ad_groups_update_project_access on public.ad_groups for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = ad_groups.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = ad_groups.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy creative_variants_select_project_access on public.creative_variants for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = creative_variants.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy creative_variants_insert_project_access on public.creative_variants for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = creative_variants.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy creative_variants_update_project_access on public.creative_variants for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = creative_variants.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = creative_variants.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy human_reviews_select_project_access on public.human_reviews for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = human_reviews.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy human_reviews_insert_project_access on public.human_reviews for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = human_reviews.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy human_reviews_update_project_access on public.human_reviews for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = human_reviews.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = human_reviews.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy deployments_select_project_access on public.deployments for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = deployments.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy deployments_insert_project_access on public.deployments for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = deployments.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy deployments_update_project_access on public.deployments for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = deployments.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = deployments.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy performance_snapshots_select_project_access on public.performance_snapshots for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = performance_snapshots.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy performance_snapshots_insert_project_access on public.performance_snapshots for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = performance_snapshots.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy performance_snapshots_update_project_access on public.performance_snapshots for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = performance_snapshots.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = performance_snapshots.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy product_feeds_select_project_access on public.product_feeds for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = product_feeds.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy product_feeds_insert_project_access on public.product_feeds for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = product_feeds.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy product_feeds_update_project_access on public.product_feeds for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = product_feeds.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = product_feeds.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

create policy product_feed_items_select_project_access on public.product_feed_items for select to anon, authenticated
using (exists (select 1 from public.projects where projects.id = product_feed_items.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy product_feed_items_insert_project_access on public.product_feed_items for insert to anon, authenticated
with check (exists (select 1 from public.projects where projects.id = product_feed_items.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));
create policy product_feed_items_update_project_access on public.product_feed_items for update to anon, authenticated
using (exists (select 1 from public.projects where projects.id = product_feed_items.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))))
with check (exists (select 1 from public.projects where projects.id = product_feed_items.project_id and (projects.owner_user_id is null or projects.owner_user_id = (select auth.uid()))));

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.sources;
alter publication supabase_realtime add table public.extraction_runs;
alter publication supabase_realtime add table public.brand_features;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.landing_gaps;
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.ad_groups;
alter publication supabase_realtime add table public.creative_variants;
alter publication supabase_realtime add table public.human_reviews;
alter publication supabase_realtime add table public.deployments;
alter publication supabase_realtime add table public.performance_snapshots;
alter publication supabase_realtime add table public.product_feeds;
alter publication supabase_realtime add table public.product_feed_items;

-- Adds a parent_source_id link so the Tavily brand-discovery orchestrator can
-- attach N child page sources to the anchor homepage source row. Nullable,
-- self-referential, no backfill needed.

alter table public.sources
  add column if not exists parent_source_id uuid
    references public.sources(id) on delete cascade;

create index if not exists sources_parent_idx
  on public.sources(parent_source_id);

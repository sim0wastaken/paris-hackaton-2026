# 2026-05-19 — Brand discovery via Tavily crawl + search

> Status: shipped • Owner: intake subsystem • Supersedes [2026-05-16-03 intake source ingestion](./2026-05-16-03-intake-source-ingestion-spec.md) for the URL ingestion path only.

## Why

The original intake called a single `tavily.extract` on the brand homepage and dumped the markdown blob — typically dominated by image markdown, nav chrome, cookie banners, and social-link clusters — into one `sources` row. The downstream 6-phase extractor (`source_recap → … → ad_groups`) was forced to hallucinate around the noise. This spec replaces that single call with a crawl-and-search pipeline that:

1. Discovers ~10 brand-relevant pages with `tavily.crawl` (instructions + path allow/block lists).
2. Prunes each page's markdown through `pruneScrapedMarkdown` before any LLM touches it.
3. Adds external third-party context via `tavily.search` (news, reviews, directory entries).
4. Persists **N child `sources` rows** linked to the homepage anchor via `parent_source_id`, so per-claim `source_refs` in `source_recap`, `feature_map`, and `landing_gaps` resolve to specific pages.

## Pipeline

```
sourceIngestRequested
└─ processSourceIngestion(parentSourceId)
   └─ discoverBrandSources()
      ├─ tavily.crawl(brand_url, { instructions, select_paths, exclude_paths, max_depth: 2, limit: 12, extract_depth: "advanced", allow_external: false })
      ├─ Zod-validate crawl response → fall back to single-page extract (basic → advanced) if crawl is empty
      ├─ pruneScrapedMarkdown() per page (image markdown, nav, social links, cookie banners, dedupe, hard cap 10_000 chars)
      ├─ Anchor page (homepage) → update parent source row in-place
      ├─ Other pages → appendChildSource(parent_source_id) per page
      ├─ tavily.search("<host> brand company overview reviews", exclude_domains=[brand_host])
      ├─ Zod-validate search → formatSearchMarkdown() → appendChildSource(parent_source_id) as type=markdown
      └─ sendExtractionRequested(projectId, [parent.id, ...child_ids], demoMode=false)
```

## Files

| File | Role |
|---|---|
| [supabase/migrations/202605190001_sources_parent_link.sql](../../../supabase/migrations/202605190001_sources_parent_link.sql) | Adds `sources.parent_source_id` self-reference + index. |
| [apps/web/src/lib/motive/scrape-pruning.ts](../../../apps/web/src/lib/motive/scrape-pruning.ts) | Pure markdown pruner. |
| [apps/web/src/lib/providers/tavily.ts](../../../apps/web/src/lib/providers/tavily.ts) | `crawlBrandSite`, `searchBrandContext`, `extractUrlWithTavily` (shim). All responses Zod-validated. |
| [apps/web/src/lib/motive/brand-discovery.ts](../../../apps/web/src/lib/motive/brand-discovery.ts) | `discoverBrandSources` orchestrator. |
| [apps/web/src/lib/motive/source-ingestion.ts](../../../apps/web/src/lib/motive/source-ingestion.ts) | Calls `discoverBrandSources`. |
| [apps/web/src/inngest/source-ingestion.ts](../../../apps/web/src/inngest/source-ingestion.ts) | Wires real Tavily client into the Inngest step. |
| [apps/web/src/lib/motive/supabase-projects.ts](../../../apps/web/src/lib/motive/supabase-projects.ts) | Implements `appendChildSource`. |

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Context window blow-out on long pages | `pruneScrapedMarkdown` caps at 10K chars per page; `buildPhaseInput` slices a further 10K per source on the LLM side. |
| Bad/unexpected Tavily response shape | Every response runs through a Zod `safeParse` — failure → source row marked `failed` with `error: "tavily_invalid_response_shape:<path>"`, raw payload preserved in `provider_response_json`. |
| Crawl returns zero pages (bot protection / SPA) | Fall back to single-page `tavily.extract` (basic → advanced) on the homepage. |
| External search fails or times out | Wrapped in `try/catch`; intake continues without external context. |
| `TAVILY_API_KEY` missing | Parent source marked `skipped` with `error: "tavily_not_configured"`. Demo still runs against pasted context / seeded sources (Non-Negotiable #13). |

## Configuration

| Env var | Default | Effect |
|---|---|---|
| `TAVILY_API_KEY` | — | Required for live crawl/search. |
| `TAVILY_CRAWL_MAX_DEPTH` | `2` | `crawl.max_depth`. |
| `TAVILY_CRAWL_LIMIT` | `12` | `crawl.limit` (max pages). |
| `TAVILY_SEARCH_MAX_RESULTS` | `5` | `search.max_results`. |
| `OPENAI_EXTRACTION_MODEL` | `gpt-5.5` | Phase model. |

## Tests

- [apps/web/src/lib/motive/scrape-pruning.test.ts](../../../apps/web/src/lib/motive/scrape-pruning.test.ts) — fixture uses the user-supplied intarget.net sample.
- [apps/web/src/lib/motive/brand-discovery.test.ts](../../../apps/web/src/lib/motive/brand-discovery.test.ts) — happy path, empty crawl, search-failure, missing-uri, search-throws.
- [apps/web/src/lib/providers/providers.test.ts](../../../apps/web/src/lib/providers/providers.test.ts) — extract shim still validates the endpoint URL contract.

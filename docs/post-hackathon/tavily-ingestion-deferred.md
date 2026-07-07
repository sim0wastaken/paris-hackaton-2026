# Post-Hackathon Deferred — Tavily Ingestion Strategy

**Status:** CLOSED 2026-07-07 — core work shipped 2026-05-19 (ADR-0006/0007); the remaining polish items (rate-limit observability, deep-scan crawl flag) are permanently descoped per ADR-0008: product continuity moved to `sim0wastaken/motive`, which uses its own crawler + ScrapeGraph rather than Tavily. Previous status: Shipped 2026-05-19 — see [ADR-0006](../agent-memory/DECISIONS.md) and [the 2026-05-19 brand-discovery spec](../superpowers/specs/2026-05-19-brand-discovery-tavily-spec.md). What landed: a `tavily.crawl` + `tavily.search` orchestrator (`apps/web/src/lib/motive/brand-discovery.ts`), per-page markdown pruning, Zod-validated responses, single-page `tavily.extract` fallback, N child `sources` rows linked via `parent_source_id`. The notes below are kept for historical reference; future polish items (rate-limit observability, deep-scan crawl flag) remain open.
**Captured:** 2026-05-16
**Owner (post-hackathon):** TBD
**Related code:**
- `apps/web/src/lib/providers/tavily.ts`
- `apps/web/src/lib/motive/source-ingestion.ts`
- `apps/web/src/inngest/source-ingestion.ts`
**Related spec:** `docs/superpowers/specs/2026-05-16-03-intake-source-ingestion-spec.md` (§"Tavily Ingestion Strategy" already documents Map+Extract and Search fallbacks; implementation never landed those branches.)

## Why this exists

Audit on 2026-05-16 confirmed:
1. The current ingestion pipeline only calls Tavily `/extract` on the submitted URL and marks the source `failed` on empty content with no fallback.
2. Spec 03 already prescribes Map+Extract and Search fallbacks; implementation diverged under hackathon time pressure.
3. The role of URL ingestion is **brand-corpus acquisition for downstream conversation/intent mapping**. Homepage-only text is marketing-laundered and lacks the user-voice vocabulary the OpenAI conversation/intent phases need to ground their outputs. Coverage breadth, not URL fidelity, is what moves downstream quality.

The hackathon demo can ship with single-Extract because the seeded demo path (Spec 09) and manual context masks ingestion thinness. Real production usage with arbitrary brand URLs will not.

## Deferred work items (priority order for post-hackathon)

### P0 — Search fallback on empty/thin content

**Where:** `apps/web/src/lib/motive/source-ingestion.ts` empty-content branch (currently marks `failed` immediately).

**What:** When Extract returns less than ~1,500 chars of usable text (Spec 03's threshold), invoke Tavily Search with:
- `include_domains: [normalizedDomain]` (structured param — **not** the engine-style `site:` operator)
- `include_raw_content: true`
- `search_depth: "fast"` or `"basic"` (avoid `"advanced"` — 2 credits, and `chunks_per_source` only works with advanced)
- `max_results: 5`
- query shaped around brand grounding: `"<brand> product features pricing customers use cases"`

Persist results as additional `sources` rows (one per discovered URL) so the audit trail stays intact. Reference: [Search endpoint docs](https://docs.tavily.com/documentation/api-reference/endpoint/search).

### P0 — `query` + `chunks_per_source` on existing Extract call

**Where:** `apps/web/src/lib/providers/tavily.ts:28-35`.

**What:** Add to the Extract request body:
- `query`: brand-relevance string (same shape as Search above)
- `chunks_per_source`: 3-5

Per [Extract reference](https://docs.tavily.com/documentation/api-reference/endpoint/extract) and [Extract best practices](https://docs.tavily.com/documentation/best-practices/best-practices-extract), this reranks `raw_content` chunks (each capped 500 chars) by relevance to the query. **Free** intent-relevant filtering with no additional cost over basic depth — direct downstream-quality win for the conversation/intent phases.

### P1 — Off-domain Search enrichment (highest leverage for intent grounding)

**Where:** New file `apps/web/src/lib/motive/source-enrichment.ts`, triggered by Inngest event *after* primary source has `processed` status.

**What:** A second, off-domain Search pass that **deliberately leaves the brand site** to harvest user-voice text:
- No `include_domains` filter
- `topic: "general"`
- `max_results: 5-10`
- query shaped around customer language: `"<brand> review pricing problems alternatives"` or `"<brand> vs <competitor> case study"`

Persist as `sources` rows with `metadata_json.kind = "off_domain_enrichment"` so HITL can distinguish brand-owned text from third-party text. This is the **highest-leverage** addition for the conversation/intent phases because the brand site systematically launders user-voice vocabulary; reviews, comparison pages, and competitor docs carry the language real users use.

### P1 — Map+Extract for thin-but-not-empty homepages

**Where:** Same fallback ladder as the Search fallback above; runs **before** Search if the homepage extracted *some* text but less than the threshold.

**What:** Spec 03 §"Thin homepage fallback" already prescribes this. Implementation:
1. Tavily Map with `max_depth: 1`, `limit: 5-8`, `allow_external: false`, path filters favoring `/pricing /product /customers /docs /security /solutions`.
2. Filter Map results by relevance score > 0.5 (per Extract best-practices doc).
3. Tavily Extract on the top 5 discovered URLs (Extract accepts up to 20 URLs/call).

Per [Crawl tutorial](https://docs.tavily.com/examples/quick-tutorials/crawl-api): *"Map finds pages, Crawl reads pages."* Map+Extract is **cheaper and faster than Crawl** for this case.

### P2 — Deep-scan Crawl mode behind explicit flag

**Where:** New code path, gated by a `deep_scan` flag on the intake form (UI not in critical path).

**What:** For doc sites, help centers, multi-page product sites — Tavily Crawl with:
- `max_depth: 1` (depth cost is exponential)
- `limit: 10` (always set an explicit limit)
- `extract_depth: "basic"`
- `select_paths`: regex for `/pricing /security /docs /customers /integrations /blog`
- `instructions`: `"Extract product features, pricing, customer use cases, integrations"` (the `instructions` param enables semantic filtering — free signal for the intent phase)

Reference: [Crawl tutorial](https://docs.tavily.com/examples/quick-tutorials/crawl-api).

### P2 — Provider observability

**Where:** `apps/web/src/lib/providers/tavily.ts` wrapper + persistence layer.

**What:** Every Tavily call already returns `request_id` and `usage` (the wrapper requests `include_usage: true`). Surface these as queryable columns or indexed JSON paths on `sources` so:
- Cost analysis is possible per project / per provider
- Failed `request_id`s can be referenced in Tavily support tickets
- Rate-limit / 429 `retry-after` values can drive backoff

Currently they're buried inside `provider_response_json`.

## Cross-cutting discipline (apply to all of the above)

- **Default to cheap.** `extract_depth: "basic"` (1 credit / 5 extractions, 10s timeout). Only escalate to `"advanced"` (2 credits, 30s) for JS-heavy or table-heavy pages.
- **No `auto_parameters: true` on Search** — can silently promote to advanced (2 credits). Spec 03 line 119 already flags this.
- **Structured filtering, not query operators.** `include_domains` / `exclude_domains` as arrays. Never `site:` in the query string for Tavily — it ships as part of the natural-language query, not as a filter.
- **Respect rate limits.** Dev keys are rate-limited; 429 returns `retry-after`. The fallback chain compounds requests — throttle and persist usage from every call.
- **Don't block intake.** Fallbacks run as **background enrichment** that streams a second wave of source text into the same project via Supabase Realtime. The first redirect to the project workspace must remain instant (Spec 03 acceptance: "No page requires a spinner-only wait").

## Out of scope for this backlog item

- Replacing Tavily with another extractor.
- Custom crawler infrastructure.
- Caching layer in front of Tavily (separate concern — see Vercel Runtime Cache if it becomes relevant).
- Tavily MCP integration (separate exploration).

## Verification when picked up

- Add tests for each new fallback branch using `ProviderOptions.fetcher` injection (same pattern as existing `tavily.test.ts`).
- Verify against Spec 03 §"Acceptance Criteria" — specifically that "Tavily Extract is used when configured, but the demo still works without Tavily" remains true when fallbacks are layered in.
- Re-grep `apps/web/src/lib/motive/source-ingestion.ts` to confirm the empty-content branch no longer terminates without trying fallbacks.

## Sources

- [Tavily Extract endpoint](https://docs.tavily.com/documentation/api-reference/endpoint/extract)
- [Tavily Search endpoint](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Tavily Extract best practices](https://docs.tavily.com/documentation/best-practices/best-practices-extract)
- [Tavily Crawl tutorial](https://docs.tavily.com/examples/quick-tutorials/crawl-api)
- [Tavily rate limits](https://docs.tavily.com/documentation/rate-limits)

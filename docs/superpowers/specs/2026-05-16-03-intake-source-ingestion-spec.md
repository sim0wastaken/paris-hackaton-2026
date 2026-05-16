# Spec 03 - Intake and Source Ingestion

Status: Draft  
Owner: Worker B  
Date: 2026-05-16  
Write scope: `docs/superpowers/specs/2026-05-16-03-intake-source-ingestion-spec.md`

## Problem / User Value

The demo starts when a user gives Motive a brand homepage URL and optional context. The intake flow must turn that input into a durable project workspace, persist source material, and move the user directly into the review workspace while source processing and extraction continue in the background.

The user value is speed and trust: the user should see that Motive captured the source, understands whether extraction succeeded, and can keep going even if Tavily, file parsing, or provider credentials are unavailable during a live hackathon demo.

This spec follows `docs/superpowers/specs/SHARED_CONTRACT.md` for product-feed support and source-to-campaign compatibility.

## Scope

- Create a project from a brand or homepage URL.
- Accept optional context as pasted text or Markdown in the first build.
- Accept optional product feed input for ecommerce brands as pasted CSV/JSONL or uploaded feed file if storage is ready.
- Represent every submitted or discovered source as a `sources` row.
- Represent every submitted product feed as `product_feeds` plus `product_feed_items` rows.
- Run a lean source ingestion step that tries Tavily Extract for the primary URL when `TAVILY_API_KEY` is configured.
- Optionally use Tavily Search/Map/Crawl in a constrained way only when the homepage content is too thin.
- Provide a manual text fallback that fully supports the demo without Tavily.
- Route immediately to the project workspace or review page after project creation.
- Surface source status per source: pending, processing, processed, failed, skipped, or needs_manual_text.
- Trigger the streaming OpenAI extraction pipeline after at least one usable source text bundle exists.
- Support a seeded demo source path so the demo works without live providers.

## Non-goals

- No broad autonomous web crawler for v1.
- No production-grade document ingestion pipeline.
- No OCR, screenshot parsing, spreadsheet parsing, or rich PDF understanding in the critical path.
- No real competitor research sweep unless later specs explicitly add it.
- No million-SKU feed processing in the critical path. V1 must support a small representative feed end-to-end and keep the full-scale feed importer additive.
- No Pioneer, GLiNER2, fine-tuning, or classifier dependency.
- No blocking intake on all source extraction work completing.
- No whole-page waiting screen after submit.

## User Flow

1. User opens the intake page.
2. User enters a brand URL.
3. User optionally adds pasted notes or Markdown: positioning notes, product docs, feature bullets, campaign constraints, pricing notes, or customer language.
4. User submits.
5. Server validates and normalizes the URL, creates a `projects` row, creates one URL `sources` row, and creates one text/Markdown `sources` row if extra context exists.
6. Server sends an ingestion/extraction event and immediately redirects to `/projects/:id/review` or `/projects/:id`.
7. Source cards show status updates as ingestion proceeds.
8. Once source text exists, Spec 04 begins phase-by-phase OpenAI extraction and the HITL workspace starts filling.

## Intake Form Contract

Required fields:

- `brand_url`: absolute URL or domain that can be normalized to `https://...`.

Optional fields:

- `project_name`: if empty, derive from hostname or source recap later.
- `extra_context`: freeform plain text or Markdown, max 50,000 characters for v1.
- `product_feed_sample`: optional pasted CSV or JSONL for ecommerce brands.
- `demo_mode`: internal toggle or query param that uses seeded source text and bypasses providers.

Validation:

- Reject unsupported schemes; only `http` and `https`.
- Normalize trailing slash and lowercase hostname.
- Keep the original submitted URL in source metadata for audit.
- Show a clear inline error for invalid URL or empty submission.
- Allow submit when Tavily is unavailable as long as a URL or manual context exists.

## Source Types and Statuses

Source types:

- `url`: primary brand URL or discovered URL.
- `text`: pasted user context.
- `markdown`: pasted Markdown or uploaded Markdown if implemented.
- `pdf`: optional file metadata only unless PDF text extraction is completed.
- `product_feed`: uploaded or pasted ecommerce feed source metadata.

Source statuses:

- `pending`: source row has been created but no processing has started.
- `processing`: ingestion job is attempting extraction.
- `processed`: `raw_text` or `extracted_text` is usable by OpenAI.
- `failed`: extraction failed and no usable text exists for that source.
- `skipped`: provider not configured or source intentionally bypassed.
- `needs_manual_text`: file exists but the app cannot extract text reliably in v1.

For v1, `processed` means enough source text exists to feed Spec 04. It does not mean the source was exhaustively crawled.

## Tavily Ingestion Strategy

Primary path:

- Use Tavily Extract against the submitted URL.
- Request Markdown output.
- Start with `extract_depth: "basic"` for speed and credits.
- Use `include_images: false` and `include_favicon: true` if favicon support is useful for UI polish.
- Store Tavily `request_id`, usage, response time, failed URLs, and provider parameters in `sources.metadata_json`.
- Store returned `raw_content` or `content` in `sources.extracted_text`.

Thin homepage fallback:

- If Extract returns less than a useful text threshold, for example fewer than 1,500 characters, run one constrained enrichment step:
  - Tavily Map with `max_depth: 1`, low `limit` such as 5-8, `allow_external: false`, and path filters that prefer product, pricing, customer, docs, security, solutions, or use-case pages.
  - Tavily Extract on selected discovered URLs, capped at 5 URLs.
- Do not crawl more than one level in the critical path.
- If Map/Crawl is too slow or unavailable, continue with the homepage plus manual context.

Search fallback:

- Use Tavily Search only when the URL fails or returns very thin content.
- Query pattern: `<brand/domain> product pricing features customers security`.
- Keep `search_depth: "basic"`, `max_results` low, and do not use `auto_parameters` unless explicitly enabled because it can promote requests to higher-cost advanced search.
- Persist search snippets as a separate `url` or `text` source with provider metadata.

Provider failure fallback:

- If `TAVILY_API_KEY` is missing, mark the URL source `skipped` with error code `tavily_not_configured`.
- If Tavily times out, returns 429, or returns no content, mark `failed` or `needs_manual_text`, persist error details, and continue with any manual context.
- If neither Tavily nor manual context produces source text, offer "Use demo source" and "Paste text instead" actions.

## Optional File Path

The required v1 path is pasted text/Markdown. File upload is optional and should be implemented only if it does not delay the main demo path.

Lean optional implementation:

- Create a private Supabase Storage bucket such as `source-files`.
- Upload files under `projects/{project_id}/sources/{source_id}/{filename}`.
- Create a `sources` row with `type`, `name`, `uri`, `status`, and metadata including file size and content type.
- For `.md` or `.txt`, extract text server-side and mark `processed`.
- For `.pdf`, store the file and mark `needs_manual_text` unless a reliable parser is already present and tested.

PDF stance:

- PDFs are acceptable as uploaded evidence, but live PDF parsing is not a required acceptance path.
- The UI should ask the user to paste the key PDF text into the context box if PDF parsing is not implemented.
- Do not add OCR or complex parser dependencies in the hackathon critical path.

## Product Feed Intake

Motive must support ecommerce/product-feed ads end-to-end without blocking the B2B SaaS demo path.

P0 path:

- Accept a small pasted product feed sample in CSV or JSONL.
- Create one `product_feeds` row with `status = "processed"` when parsing succeeds.
- Create `product_feed_items` rows using Google Shopping-style fields where present: `id`, `title`, `description`, `link`, `image_link`, `availability`, `price`, `brand`, `google_product_category`, and `product_type`.
- Store the raw row in `product_feed_items.raw_json` for replay/export.
- Also create a `sources` row of type `product_feed` or metadata-linked text summary so Spec 04 can use product context in extraction.

Fallback:

- If parsing fails, keep the raw feed as a `sources` row with `status = "needs_manual_text"` and ask the user to paste 3-5 representative products as text.
- Do not block non-ecommerce demos on feed errors.

Non-goal:

- Do not implement large-file streaming, feed validation at 1M SKU scale, or merchant-center-grade diagnostics during the hackathon.

## Data Model Touched

`projects`:

- Create one row per intake submission.
- Required fields from earlier specs: `id`, `name`, `brand_url`, `status`, `extra_context`, timestamps.
- Initial `status`: `extracting` if source processing starts, otherwise `draft` if no usable source text exists.

`sources`:

- Create one or more rows per project.
- Required fields from earlier specs: `id`, `project_id`, `type`, `name`, `uri`, `raw_text`, `extracted_text`, `status`, timestamps.
- Recommended supporting fields if Spec 02 allows them:
  - `metadata_json`: provider request IDs, Tavily usage, normalized URL, content type, file size, favicon, discovered URL source.
  - `error_json`: provider status, error message, retry-after, failed URLs.

`product_feeds` and `product_feed_items`:

- Create when the user provides product feed context.
- Must follow Spec 02 and `SHARED_CONTRACT.md`.
- Feed rows are optional for B2B SaaS projects but required for ecommerce demo coverage.

`extraction_runs`:

- Intake does not write OpenAI phase rows directly.
- It may enqueue Spec 04 after source processing and should pass project/source IDs into the first extraction input.

## API / Server Boundaries

Recommended boundaries:

- `POST /api/projects`
  - Validates intake payload.
  - Creates `projects` and initial `sources` rows.
  - Emits `motive/source.ingest.requested` or directly emits `motive/extraction.requested` when manual text is already available.
  - Returns `{ project_id, redirect_url }`.

- `apps/web/src/lib/motive/projects.ts`
  - Owns project/source creation in one server-side transaction where feasible.

- `apps/web/src/lib/motive/source-ingestion.ts`
  - Owns Tavily/manual source processing.
  - Has no UI imports.

- `apps/web/src/lib/providers/tavily.ts`
  - Thin wrapper around Extract, Search, Map/Crawl.
  - Normalizes provider errors into typed application errors.

- `apps/web/src/inngest/source-ingestion.ts`
  - Optional if ingestion runs as a background job.
  - Updates `sources.status` and emits extraction event when source text is ready.

The UI must never call Tavily directly. Provider calls belong in server code or Inngest functions so API keys remain server-only.

## Background Jobs / Realtime

Minimum path:

- Project creation is synchronous.
- Source ingestion can be a server-side async step or Inngest job.
- Extraction request is queued after at least one source has `processed` status.

Preferred event flow:

1. `POST /api/projects` creates project and sources.
2. Emit `motive/source.ingest.requested` with `project_id` and source IDs.
3. Inngest updates source status to `processing`.
4. Inngest processes Tavily/manual sources.
5. Inngest updates source status to `processed`, `failed`, `skipped`, or `needs_manual_text`.
6. If source bundle is usable, emit `motive/extraction.requested` for Spec 04.

Realtime expectations:

- Source status cards can update through Supabase Realtime if `sources` is included in the publication.
- If realtime is not yet wired, use TanStack Query polling every 1-2 seconds on the project workspace.
- Do not block navigation on realtime setup.

## UI States and Interactions

Intake page:

- Empty state with URL input and optional context textarea.
- Inline validation for URL and overly long context.
- Submit button disabled only for invalid input, not for missing Tavily key.
- Internal demo mode control if needed by Spec 09.

After submit:

- Immediate route into project workspace/review.
- Source panel shows each submitted source with status.
- URL source card shows normalized URL, provider status, text length, and retry action on failure.
- Manual context card shows processed immediately if text exists.
- If all sources fail, show "Paste context" and "Use demo source" actions.

No spinner-only state:

- The review workspace can show source cards and queued phase rail while background work proceeds.
- Loading indicators must be attached to specific sources or phases.

## Failure States

- Invalid URL: keep user on intake and show field error.
- Tavily missing key: mark URL source `skipped`, continue with manual or demo source.
- Tavily 429: store provider error, respect `retry-after` when available, show retry later.
- Tavily timeout: mark failed with retry action; do not block manual context.
- Thin extraction: continue with warning and optional one-level enrichment.
- Duplicate URL submitted repeatedly: create separate projects unless product later adds dedupe.
- File too large or unsupported: reject file, keep text path available.
- PDF parser unavailable: store file metadata if upload exists, mark `needs_manual_text`.
- No usable text: project remains `draft` or `source_needed`; extraction is not triggered.

## Acceptance Criteria

- User can create a project from a URL.
- User can add extra pasted text or Markdown context.
- `projects` and `sources` rows are persisted before redirect.
- User lands in a project workspace immediately after submit.
- Source status is visible and updates through realtime or polling.
- Tavily Extract is used when configured, but the demo still works without Tavily.
- Manual text context alone can produce a usable source bundle for Spec 04.
- A seeded/demo source path can be selected if providers fail.
- No page requires a spinner-only wait before the user sees project state.

## Demo Script

1. Open Motive intake.
2. Paste a brand URL.
3. Add two to four lines of positioning context in the textarea.
4. Submit.
5. Point out that the project workspace opens immediately.
6. Show the source panel:
   - URL source is processing or processed.
   - Manual context is already processed.
7. If Tavily succeeds, show extracted homepage text length and provider metadata.
8. If Tavily fails or is disabled, click "Use demo source" or continue with manual context.
9. Transition to Spec 04: phase rail starts and extraction rows appear live.

## Research Notes

- Local hackathon Tavily guide: `docs/Hackathon-Briefs/{Tech Europe} Paris AI Hackathon Manual/Tavily_Hacker_Guide.md`.
- Tavily Search official docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
  - Search supports `search_depth`, `include_raw_content`, `max_results`, domains, and `auto_parameters`; advanced search costs more credits.
- Tavily Extract official docs: https://docs.tavily.com/documentation/api-reference/endpoint/extract
  - Extract accepts one or more URLs, `extract_depth`, `include_images`, `include_favicon`, output `format`, timeout, and returns `results`, `failed_results`, usage, and request ID.
- Tavily clean extraction guide: https://docs.tavily.com/examples/quick-tutorials/extract-api
  - Extract returns clean Markdown or text and can produce query-focused chunks to reduce LLM context size.
- Tavily Crawl/Map official docs: https://docs.tavily.com/documentation/api-reference/endpoint/crawl and https://docs.tavily.com/documentation/api-reference/endpoint/map
  - Crawl/Map can discover related site pages but should be constrained by depth, breadth, and limit for demo latency.
- Tavily crawl best practices: https://docs.tavily.com/documentation/best-practices/best-practices-crawl
  - Start shallow because depth increases latency quickly.
- Tavily rate limits: https://docs.tavily.com/documentation/rate-limits
  - Development keys are rate limited; 429 responses include `retry-after`.
- Supabase Storage upload reference: https://supabase.com/docs/reference/javascript/storage-from-upload
  - Uploads require an existing bucket and a path; file upload is optional for this spec.

## Open Questions / Risks

- Does Spec 02 include `metadata_json` and `error_json` on `sources`, or should provider metadata live only in `raw_text`/`extracted_text` plus a compact error string?
- Should project creation use server actions or route handlers once the app scaffold exists?
- If a reliable PDF parser is already installed by another worker, PDF text extraction can be enabled; otherwise it should remain out of the critical path.
- The seeded source path must exercise the same `sources` and extraction trigger paths as live ingestion so the demo is honest.

# Spec 04 - Streaming OpenAI Extraction Pipeline

Status: Draft  
Owner: Worker B  
Date: 2026-05-16  
Write scope: `docs/superpowers/specs/2026-05-16-04-streaming-openai-extraction-spec.md`

## Problem / User Value

Motive's core demo is not "submit URL, wait, then see results." The valuable experience is watching campaign intelligence appear phase by phase: source recap, feature map, conversations, intent labels, landing gaps, ad groups, creative text, and monitoring synthesis.

This spec defines the background extraction engine that turns source text into persisted, reviewable workflow objects. The system must make latency visible and useful by writing each phase status and output to the database as it happens. The HITL page subscribes to those writes and fills progressively.

## Scope

Implement the OpenAI-first extraction pipeline for these phases:

1. `source_recap`
2. `feature_map`
3. `conversation_map`
4. `intent_classification`
5. `landing_gaps`
6. `ad_groups`
7. `creative_text`
8. `monitoring_synthesis`

The pipeline must:

- Use OpenAI Structured Outputs / JSON schema through the Responses API or SDK parse helpers.
- Define a Zod output schema for every phase.
- Persist every phase input, output, model, prompt version, status, timestamps, and error in `extraction_runs`.
- Materialize successful phase outputs into domain tables.
- Run through Inngest or an equivalent background job runner, not inside the intake request.
- Update the HITL UI through Supabase Realtime Postgres change subscriptions.
- Provide retry and failure semantics that keep partial results visible.
- Support deterministic seeded/demo replay for Spec 09.

## Non-goals

- No Pioneer dependency in v1.
- No live fine-tuning or Adaptive Inference.
- No full agentic web browsing inside OpenAI prompts.
- No hidden in-memory-only extraction state.
- No replacing HITL review with automatic approval.
- No hard dependency on final creative assets or fal.ai.
- No spinner-only extraction screen.

## Architecture Summary

Data is the source of truth.

```text
processed sources
  -> motive/extraction.requested event
  -> Inngest extraction function
  -> extraction_runs rows for queued/running/succeeded/failed phases
  -> domain table inserts/updates per phase
  -> Supabase Realtime subscriptions
  -> HITL phase rail and panels update live
```

OpenAI calls are phase-local. Each phase receives a compact JSON input bundle assembled from persisted sources and previous materialized rows. Each phase writes to `extraction_runs` before and after the provider call. Each materialization step is idempotent.

## Data Model Touched

`extraction_runs` is mandatory for every phase.

Required columns from Spec 02 plus recommended additions:

- `id`
- `project_id`
- `phase`: enum containing all eight phases in this spec.
- `model`
- `prompt_version`
- `input_json`
- `output_json`
- `status`: `queued` / `running` / `succeeded` / `failed`
- `error`
- `created_at`
- `updated_at`
- Recommended:
  - `started_at`
  - `completed_at`
  - `attempt`
  - `provider_response_id`
  - `provider_usage_json`
  - `materialized_ids_json`

Domain tables updated:

- `brand_features`: from `feature_map`.
- `conversations`: from `conversation_map` and `intent_classification`.
- `landing_gaps`: from `landing_gaps`.
- `ad_groups`: from `ad_groups`.
- `creative_variants`: from `creative_text`.
- `performance_snapshots`: from `monitoring_synthesis`.
- `projects`: status moves through `extracting`, `review`, `creative_ready`, or `failed`.

Do not delete failed or superseded `extraction_runs`. They are the audit trail and future Pioneer training/eval substrate.

## Phase Status Model

Each phase has one visible status in the phase rail:

- `queued`: row exists, not yet started.
- `running`: OpenAI call or materialization is active.
- `succeeded`: output persisted and materialization attempted.
- `failed`: error persisted and user can retry.
- `skipped`: only for seeded/demo or dependent phase blocked by earlier failure, represented either as a failed row with `error.code = "skipped"` or an added enum if Spec 02 permits.

For a clean UI, create queued `extraction_runs` rows for all phases at pipeline start. Then update each row as it runs. This gives the HITL page a stable rail immediately after intake.

## OpenAI Call Contract

Use the Responses API parse path in TypeScript when available:

```ts
const response = await openai.responses.parse({
  model,
  input: [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(phaseInput) },
  ],
  text: {
    format: zodTextFormat(PhaseSchema, phaseName),
  },
});
```

Provider rules:

- Use a model that supports Structured Outputs.
- The model name is configuration, for example `OPENAI_EXTRACTION_MODEL`; do not hard-code across the codebase.
- Use one prompt version string per phase, for example `source_recap.v1`.
- Zod schemas are canonical in code; generated JSON schemas must remain within OpenAI Structured Outputs' supported subset.
- Prefer plain objects, arrays, strings, numbers, booleans, enums, and bounded arrays.
- Avoid recursive schemas, broad unions, and complex JSON Schema features in v1.
- Make all schema fields explicit and required; use empty arrays or empty strings when unknown.
- Set strict schema adherence when using raw JSON schema format.
- Store the parsed output and a compact provider response summary. Do not rely only on local variables.

Shared system prompt requirements:

- "You are Motive's campaign intelligence extractor for an OpenAI-first hackathon demo."
- "Use only the provided source bundle and previous persisted phase outputs."
- "When evidence is weak, mark low confidence and explain the missing source."
- "Include `source_refs` for concrete claims."
- "Do not invent customer names, integrations, prices, compliance claims, or metrics unless the phase explicitly asks for simulated monitoring."
- "Return only data that conforms to the provided schema."

## Extraction Run Write Pattern

For every phase:

1. Build `input_json` from persisted project, sources, and prior phase outputs.
2. Insert or update the phase row to `queued` if it does not exist.
3. Update the phase row to `running`, with `started_at`, `attempt`, `model`, `prompt_version`, and `input_json`.
4. Call OpenAI inside an Inngest `step.run()`.
5. Validate parsed output with the phase Zod schema.
6. Update the phase row to `succeeded`, with `output_json`, provider response ID, usage, and `completed_at`.
7. Materialize output into domain tables inside a separate idempotent step.
8. Update `materialized_ids_json` with inserted or updated row IDs.
9. On any error, update the phase row to `failed` with structured `error`, leave earlier successful phases untouched, and expose retry in UI.

Suggested `error` shape:

```json
{
  "code": "openai_rate_limited",
  "message": "Human-readable short message",
  "retryable": true,
  "provider_status": 429,
  "retry_after_seconds": 30,
  "phase": "feature_map",
  "attempt": 2
}
```

## Phase Contracts

### 1. `source_recap`

Purpose: convert source text into a compact brand understanding.

Input:

- Project ID, name, brand URL.
- Processed source bundle: source ID, type, URI, extracted text, source metadata.
- Optional user context.

Prompt contract:

- Summarize the brand, offer, ICP, category, proof, constraints, and source quality.
- Preserve uncertainty.
- Prefer direct source evidence over inference.

Output schema contract:

```ts
{
  brand_name: string;
  category: string;
  homepage_url: string;
  one_sentence_offer: string;
  positioning_summary: string;
  icp_segments: Array<{
    segment: string;
    pain: string;
    desired_outcome: string;
    source_refs: string[];
    confidence: "low" | "medium" | "high";
  }>;
  competitors: Array<{
    name: string;
    reason: string;
    source_refs: string[];
    confidence: "low" | "medium" | "high";
  }>;
  proof_points: Array<{
    claim: string;
    evidence: string;
    source_refs: string[];
    confidence: "low" | "medium" | "high";
  }>;
  constraints: Array<{
    type: "budget" | "timeline" | "integration" | "team_size" | "compliance" | "technical" | "other";
    value: string;
    evidence: string;
    source_refs: string[];
  }>;
  source_quality: {
    coverage: "thin" | "adequate" | "rich";
    missing_context: string[];
  };
  assumptions: string[];
}
```

Materialization:

- Keep in `extraction_runs.output_json`.
- Optionally update `projects.name` if empty and confidence is high.

### 2. `feature_map`

Purpose: extract campaign-relevant product facts and objections.

Input:

- Source bundle.
- `source_recap.output_json`.

Prompt contract:

- Extract at least 10 total items when source coverage permits.
- Use concise titles and buyer-relevant descriptions.
- Label weakly sourced items low confidence rather than padding.

Output schema contract:

```ts
{
  features: Array<{
    temp_id: string;
    type: "feature" | "value_prop" | "usp" | "use_case" | "proof_point" | "objection";
    title: string;
    description: string;
    buyer_relevance: string;
    evidence: string;
    source_refs: string[];
    confidence: "low" | "medium" | "high";
  }>;
  missing_feature_context: string[];
}
```

Materialization:

- Insert `brand_features` rows with `review_status = "pending"`.
- Store `source_refs` as JSONB.
- Keep `temp_id -> brand_features.id` in `materialized_ids_json`.

### 3. `conversation_map`

Purpose: generate buying conversations from the recap and features.

Input:

- `source_recap`.
- Materialized `brand_features`.
- Source bundle summary.

Prompt contract:

- Produce plausible acquisition conversations grounded in source evidence.
- Focus on user needs, objections, comparisons, and constraints.
- Do not assign final stage/intent here; leave that to `intent_classification`.

Output schema contract:

```ts
{
  conversations: Array<{
    temp_id: string;
    conversation_text: string;
    buyer_role: string;
    trigger: string;
    pain: string;
    desired_outcome: string;
    related_feature_temp_ids: string[];
    source_refs: string[];
    confidence: "low" | "medium" | "high";
  }>;
}
```

Materialization:

- Insert `conversations` rows with initial `stage = ""`, `intent_type = ""`, `buyer_role`, `constraints_json = []`, and `review_status = "pending"`.
- Store `temp_id -> conversations.id`.

### 4. `intent_classification`

Purpose: assign stage, intent type, buyer role, and constraints to conversations.

Input:

- Materialized conversations.
- Feature map.
- Source recap.

Prompt contract:

- Classify existing conversations; do not create new conversations.
- Prefer a small, stable label set so future Pioneer evaluation is possible.
- Extract constraints only when there is evidence or a clearly marked inference.

Output schema contract:

```ts
{
  classifications: Array<{
    conversation_temp_id: string;
    stage: "awareness" | "consideration" | "decision" | "retention";
    intent_type: "problem_aware" | "comparison" | "pricing" | "integration" | "implementation" | "proof" | "risk" | "urgency" | "general";
    buyer_role: string;
    constraints: Array<{
      type: "budget" | "timeline" | "integration" | "team_size" | "compliance" | "procurement" | "technical" | "other";
      value: string;
      evidence: string;
      source_refs: string[];
      confidence: "low" | "medium" | "high";
    }>;
    rationale: string;
    confidence: "low" | "medium" | "high";
  }>;
}
```

Materialization:

- Update existing `conversations` rows.
- Persist `stage`, `intent_type`, `buyer_role`, and `constraints_json`.

### 5. `landing_gaps`

Purpose: identify gaps between buyer conversations and what the source/landing page proves.

Input:

- Source recap.
- Conversations with intent labels.
- Feature map.
- Source bundle.

Prompt contract:

- Identify gaps that matter for conversion.
- Tie gaps to a conversation when possible.
- Suggest concrete fixes a marketer could add to the landing page.

Output schema contract:

```ts
{
  gaps: Array<{
    temp_id: string;
    conversation_temp_id: string;
    gap_type: "proof" | "comparison" | "setup_path" | "pricing" | "trust" | "compliance" | "integration" | "security" | "performance" | "other";
    severity: "low" | "medium" | "high";
    description: string;
    suggested_fix: string;
    page_area: string;
    source_refs: string[];
    rationale: string;
  }>;
}
```

Materialization:

- Insert `landing_gaps` rows with `review_status = "pending"`.
- Resolve `conversation_temp_id` to `conversation_id` when available.

### 6. `ad_groups`

Purpose: propose campaign-ready groupings from conversations, features, and gaps.

Input:

- Conversations with intent labels.
- Brand features.
- Landing gaps.
- Source recap.

Prompt contract:

- Group related conversations into understandable ad groups.
- Each group needs a clear rationale and linked conversation IDs.
- Avoid unsupported claims and note landing gaps that could affect conversion.

Output schema contract:

```ts
{
  ad_groups: Array<{
    temp_id: string;
    name: string;
    primary_intent: string;
    conversation_temp_ids: string[];
    angle: string;
    rationale: string;
    must_include_claims: string[];
    avoid_claims: string[];
    linked_landing_gap_temp_ids: string[];
    priority: "low" | "medium" | "high";
  }>;
}
```

Materialization:

- Insert `ad_groups` rows with `status = "draft"`.
- Store resolved `conversation_ids` as JSONB or array, per Spec 02.

### 7. `creative_text`

Purpose: create first-pass text variants for each draft ad group.

Input:

- Draft ad groups.
- Linked conversations.
- Brand features.
- Landing gaps.

Prompt contract:

- Produce title, description, angle, and image/video prompt text.
- Keep copy specific to conversation constraints.
- Avoid making claims not present in source references.
- This is a draft text phase; final asset generation belongs to Spec 07.

Output schema contract:

```ts
{
  variants: Array<{
    temp_id: string;
    ad_group_temp_id: string;
    title: string;
    description: string;
    creative_angle: string;
    primary_message: string;
    asset_type: "image" | "video" | "none";
    asset_prompt: string;
    source_refs: string[];
    compliance_notes: string[];
    rationale: string;
  }>;
}
```

Materialization:

- Insert `creative_variants` rows with `status = "draft"`.
- Set `asset_url = null`; asset generation is downstream.

### 8. `monitoring_synthesis`

Purpose: generate coherent simulated monitoring rows for the demo story.

Input:

- Draft or approved ad groups.
- Draft creative text variants.
- Landing gaps.
- Conversations and intent labels.

Prompt contract:

- Metrics are simulated and must be internally labeled as simulated.
- Metrics must tell a plausible story tied to specificity, intent fit, proof, pricing clarity, setup path, and unresolved landing gaps.
- Do not randomize numbers independently from the narrative.

Output schema contract:

```ts
{
  snapshots: Array<{
    temp_id: string;
    ad_group_temp_id: string;
    creative_variant_temp_id: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cvr: number;
    spend: number;
    quality_score: number;
    insight: string;
    recommended_action: string;
    story_driver: "specificity" | "intent_fit" | "proof_gap" | "pricing_gap" | "setup_gap" | "trust_gap" | "generic_copy";
    simulated_label: string;
    notes: string;
  }>;
}
```

Materialization:

- Insert `performance_snapshots` rows.
- Store `simulated_label` in `notes` or metadata if no dedicated column exists.
- This phase can be skipped in the first smoke build only if Spec 08 owns it, but the prompt and schema contract must remain defined here.

## Inngest Orchestration

Event:

```json
{
  "name": "motive/extraction.requested",
  "data": {
    "project_id": "uuid",
    "source_ids": ["uuid"],
    "requested_by": "user-or-demo",
    "demo_mode": false
  }
}
```

Function:

- ID: `motive-extraction-pipeline`.
- Trigger: `motive/extraction.requested`.
- Recommended retries: default or `retries: 3` for hackathon speed.
- Concurrency key: `event.data.project_id` with limit 1 to avoid two extraction pipelines writing overlapping rows for the same project.
- Use `step.run()` for each provider call and materialization step.
- Use `onFailure` to update the project and current phase when all retries are exhausted.

Sequencing:

1. `initialize-phase-rows`
2. `build-source-bundle`
3. `source_recap.call_openai`
4. `source_recap.persist`
5. `feature_map.call_openai`
6. `feature_map.materialize`
7. `conversation_map.call_openai`
8. `conversation_map.materialize`
9. `intent_classification.call_openai`
10. `intent_classification.materialize`
11. `landing_gaps.call_openai`
12. `landing_gaps.materialize`
13. `ad_groups.call_openai`
14. `ad_groups.materialize`
15. `creative_text.call_openai`
16. `creative_text.materialize`
17. `monitoring_synthesis.call_openai`
18. `monitoring_synthesis.materialize`
19. `mark-project-review-ready`

Use `step.sendEvent()` for optional analytics or phase-completed events, but the product UI must depend on persisted database rows and Supabase Realtime, not ephemeral Inngest events.

## Supabase Realtime Event Model

Tables that should be in the `supabase_realtime` publication:

- `extraction_runs`
- `brand_features`
- `conversations`
- `landing_gaps`
- `ad_groups`
- `creative_variants`
- `performance_snapshots`
- Optional: `sources`

Client subscriptions on the HITL page:

- `extraction_runs`: listen to `INSERT` and `UPDATE`, filter `project_id=eq.${projectId}`.
- `brand_features`: listen to `INSERT` and `UPDATE`, filter `project_id=eq.${projectId}`.
- `conversations`: listen to `INSERT` and `UPDATE`, filter `project_id=eq.${projectId}`.
- `landing_gaps`: listen to `INSERT` and `UPDATE`, filter `project_id=eq.${projectId}`.
- `ad_groups`: listen to `INSERT` and `UPDATE`, filter `project_id=eq.${projectId}`.
- `creative_variants`: listen to `INSERT` and `UPDATE` if the review or creative preview panel is visible.
- `performance_snapshots`: listen to `INSERT` if monitoring preview is visible.

UI behavior:

- On page load, fetch current rows first.
- Then subscribe to changes.
- Merge realtime payloads by row ID to avoid duplicates.
- Remove channels on unmount to avoid leaking subscriptions.
- If realtime disconnects, show a small connection badge and keep polling as fallback.

## API / Server Boundaries

Recommended routes and modules:

- `POST /api/projects/[id]/extract`
  - Authenticates user/demo access.
  - Verifies usable sources exist.
  - Emits `motive/extraction.requested`.
  - Does not call OpenAI directly.

- `apps/web/src/lib/motive/extraction.ts`
  - Phase definitions, prompt builders, input bundle builders, materializers.

- `apps/web/src/lib/motive/extraction-schemas.ts`
  - Zod schemas and TypeScript inferred types.

- `apps/web/src/lib/providers/openai.ts`
  - Thin OpenAI client and structured parse helper.

- `apps/web/src/inngest/extraction.ts`
  - Durable orchestration, retries, phase status writes.

- `apps/web/src/components/extraction-phase-rail.tsx`
  - Reads `extraction_runs`.

- `apps/web/src/components/live-review-workspace.tsx`
  - Subscribes to domain table changes and renders progressive panels.

## Idempotency and Retry Rules

- Phase rows should be unique by `(project_id, phase, prompt_version)` unless reruns intentionally create a new `attempt_group_id`.
- Materializers should upsert by `(project_id, extraction_run_id, temp_id)` if Spec 02 adds source extraction run references; otherwise store `temp_id` in metadata and guard duplicate inserts.
- Retrying a failed phase should not delete successful prior rows.
- Retrying from an earlier phase should either create a new prompt version/attempt group or mark downstream rows superseded if that status exists.
- For hackathon v1, simplest acceptable retry: retry only the failed phase and downstream phases, with a visible "Regenerate from here" action.

Provider retry handling:

- OpenAI rate limits and transient network errors are retryable.
- Schema construction errors, missing source text, and unsupported model errors are non-retryable until configuration changes.
- Persist refusal or safety stop as a failed phase with `error.code = "model_refusal"` and a user-visible explanation.

## UI States

Phase rail:

- Shows all eight phases immediately.
- Status icon per phase: queued, running, succeeded, failed.
- Displays elapsed time for running phase if available.
- Clicking a phase scrolls to its panel.
- Failed phase shows retry action and compact error.

Panels:

- Source recap panel appears after `source_recap`.
- Feature cards/table appears as `brand_features` rows insert.
- Conversation table appears as `conversations` rows insert.
- Intent columns fill when `intent_classification` updates conversations.
- Landing gaps appear as badges/cards tied to conversations.
- Ad groups appear as draft cards.
- Creative text preview appears when variants insert.
- Monitoring preview appears when snapshots insert or can defer to monitoring page.

No spinner-only extraction:

- Page skeleton is acceptable only before the first database fetch.
- After initial fetch, every waiting state must be phase-specific.
- The user should be able to approve/edit any rows that already exist while later phases run.

## Failure States

- No processed sources: do not start OpenAI; write a clear blocked error and return user to source panel.
- OpenAI key missing: mark first phase failed with `openai_not_configured`; allow seeded demo.
- Unsupported model for Structured Outputs: fail fast with configuration guidance.
- OpenAI 429 or timeout: retry through Inngest; if exhausted, persist failed status and retry-after if known.
- Structured output validation failure: retry once with same schema; if still failing, persist failed status and raw provider summary for debugging.
- Model refusal: persist failed status with refusal text, do not attempt materialization.
- Empty but valid output: persist succeeded but materialize no rows; UI shows "No rows found" with source-quality guidance.
- Partial materialization failure: phase remains failed or `succeeded_with_warnings` if Spec 02 allows; either way persist materialized IDs and error details.
- Realtime disconnected: keep data persisted, show reconnect/polling fallback.

## Acceptance Criteria

- `POST /api/projects/[id]/extract` or equivalent event trigger starts extraction without blocking the request on all OpenAI calls.
- All eight phases are represented in `extraction_runs`.
- Every phase persists `input_json`, `output_json`, model, prompt version, status, timestamps, and error when applicable.
- OpenAI outputs are validated against phase-specific Zod schemas.
- Successful phases materialize rows into the correct domain tables.
- The HITL page receives phase and row updates through Supabase Realtime or a polling fallback.
- Rows visibly appear while extraction is still running.
- A failed phase does not erase earlier successful phase outputs.
- User can retry a failed phase.
- Seeded/demo replay can mimic progressive phase completion without live OpenAI.

## Demo Script

1. Complete Spec 03 intake and land on the project review page.
2. Point to the phase rail with all eight phases queued.
3. Watch `source_recap` move to running, then succeeded; recap panel fills.
4. Watch `feature_map` succeed; feature/value prop rows appear.
5. Watch `conversation_map` insert conversation rows.
6. Watch `intent_classification` update each conversation with stage, intent, buyer role, and constraints.
7. Watch `landing_gaps` add gap cards tied to conversations.
8. Watch `ad_groups` create draft ad-group cards.
9. Watch `creative_text` create title/description/asset prompt drafts.
10. Watch `monitoring_synthesis` create simulated insight rows or hand off to the monitoring page.
11. Approve or edit at least one row while later phases are still running to demonstrate HITL is live.
12. If a provider fails during the live demo, switch to seeded replay and show that the same tables and phase rail update progressively.

## Research Notes

- OpenAI Structured Outputs guide: https://developers.openai.com/api/docs/guides/structured-outputs
  - Structured Outputs ensure responses adhere to supplied JSON Schema, support SDK helpers for Zod/Pydantic, and are suitable for extracting structured data from unstructured text.
- OpenAI Responses structured output examples: https://developers.openai.com/api/docs/guides/structured-outputs
  - The JavaScript SDK supports `openai.responses.parse` with `zodTextFormat(...)`; parsed output is available as `response.output_parsed`.
- OpenAI JSON schema strict example: https://developers.openai.com/api/docs/guides/structured-outputs
  - Raw JSON schema usage includes `type: "json_schema"`, `strict: true`, explicit `required`, and `additionalProperties: false`.
- OpenAI models docs: https://developers.openai.com/api/docs/models/compare
  - Current GPT-5-class models support the Responses API and Structured Outputs; the exact model should remain configurable.
- Inngest createFunction reference: https://www.inngest.com/docs/reference/typescript/v3/functions/create
  - Functions are defined with `createFunction`; retries and `onFailure` are configurable.
- Inngest steps guide: https://www.inngest.com/docs/learn/inngest-steps
  - `step.run()` memoizes successful step state and retries failed step code independently.
- Inngest retries docs: https://www.inngest.com/docs/features/inngest-functions/error-retries/retries
  - Default behavior retries functions/steps up to 4 times beyond the initial attempt; retry counts are configurable.
- Inngest Next.js serving docs: https://www.inngest.com/docs/learn/serving-inngest-functions
  - App Router support exports `GET`, `POST`, and `PUT` from `serve({ client, functions })`.
- Supabase Realtime Postgres changes: https://supabase.com/docs/guides/realtime/postgres-changes
  - Clients subscribe with `.channel(...).on("postgres_changes", { event, schema, table, filter }, callback).subscribe()`.
- Supabase database change setup: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
  - Tables must be added to the `supabase_realtime` publication for Postgres Changes.
- Supabase JavaScript remove channel: https://supabase.com/docs/reference/javascript/removechannel
  - Removing unused channels prevents subscription buildup during long-running pages.

## Open Questions / Risks

- Spec 02 must confirm whether `extraction_runs.phase` includes all eight names here or whether `creative_text` and `monitoring_synthesis` are separate generation phases.
- If Spec 02 does not include `materialized_ids_json`, materializer traceability should use `output_json.materialized_ids` instead.
- If realtime publication setup is delayed, polling can satisfy development but the final demo should use Supabase Realtime for the visible "rows appear live" moment.
- Monitoring synthesis overlaps with Spec 08; this spec defines the prompt/schema contract, while Spec 08 can own final dashboard UX and fake deploy timing.
- Creative text overlaps with Spec 07; this spec can generate draft text, while Spec 07 can own regeneration, approval workflow, and asset generation.

# Spec 07 - Creative Generation

Date: 2026-05-16
Owner: Worker D
Status: Draft
Phase: Approved ad groups -> persisted creative variants
Depends on: Spec 02 database contract, Spec 06 ad-group generation, Spec 05 HITL review

## Problem / User Value

After a reviewer approves ad groups, Motive needs to turn campaign structure into reviewable creative assets fast enough for a hackathon demo. The user value is a concrete output package per approved ad group: ad title, ad description, creative angle, and an image/video prompt or generated asset that can be approved and then fake-deployed.

The feature must make the future Pioneer story visible without depending on Pioneer. Each generated creative stores enough prompt, output, and review data to become later training/evaluation material for a smaller classifier or creative-quality model.

## Goals

- Generate at least one usable creative variant for every approved ad group.
- Persist title, description, creative angle, image/video prompt, optional asset URL, provider metadata, and review status.
- Keep fal.ai optional so the demo can continue with prompt-only creative cards when no `FAL_KEY` is present or generation fails.
- Make review decisions explicit and auditable through `creative_variants` and `human_reviews`.
- Produce assets that are grounded in approved conversations, brand features, landing gaps, and ad-group rationale rather than generic ad copy.

## Scope

- Add a Creatives page at `apps/web/src/app/projects/[id]/creatives/page.tsx`.
- Add a server boundary at `apps/web/src/app/api/projects/[id]/creatives/route.ts` for batch generation.
- Add a domain service at `apps/web/src/lib/motive/creatives.ts`.
- Add a provider wrapper at `apps/web/src/lib/providers/fal.ts` if not already present.
- Add a reusable creative grid/card UI at `apps/web/src/components/creative-grid.tsx`.
- Use OpenAI structured output to generate copy and visual prompts.
- Optionally call fal.ai from the server/background job to render one image for each generated creative.
- Allow approve, reject, and edit for creative variants.

## Non-goals

- No real ad-platform creative upload. Fake deploy is handled in Spec 08.
- No multi-channel campaign planner. V1 produces channel-agnostic paid-social/search-style creative cards that can support the demo.
- No full video rendering dependency for the live demo. The data model supports `asset_type = video`, but image generation is the default because it is faster and lower risk.
- No brand asset ingestion or design-system enforcement beyond prompt grounding from stored sources.
- No automatic creative learning loop. The feature stores the rows that make that loop possible later.

## Research Notes

- OpenAI Structured Outputs: official docs recommend Structured Outputs over JSON mode when schema adherence matters; Responses API uses `text.format` with a JSON schema and strict mode. Source: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI schema constraints: Structured Outputs support a subset of JSON Schema and should be validated against the same Zod/domain schema used by the app. Source: https://developers.openai.com/api/docs/guides/structured-outputs
- fal.ai JavaScript client: `@fal-ai/client` supports `fal.subscribe()` for queue-backed generation with queue updates, and exposes queue/result APIs. Source: https://docs.fal.ai/api-reference/client-libraries/javascript/index
- fal.ai server credentials: server-side code should use `FAL_KEY`; browser code must not expose the key and should go through a proxy if client-side calls are ever needed. Source: https://fal.ai/docs/documentation/model-apis/inference/client-setup
- fal.ai model choice: default to `fal-ai/flux/schnell` for hackathon image generation because it is documented as a fast text-to-image model, supports 1-4 default steps, exposes `prompt`, `image_size`, `num_images`, `seed`, and returns generated image URLs. Source: https://fal.ai/docs/model-api-reference/image-generation-api/flux-schnell
- fal.ai workflow option: workflows can chain multiple models behind one endpoint, but v1 should use a direct model endpoint for speed and fewer moving parts. Source: https://fal.ai/docs/documentation/model-apis/workflows
- Next.js route handlers: API endpoints live in `app/**/route.ts`, support standard HTTP methods, and use Web Request/Response APIs. Source: https://nextjs.org/docs/app/getting-started/route-handlers
- Context7 grounding used: `/vercel/next.js` for route handler/server mutation boundaries and `/fal-ai/fal-js` for subscribe/queue usage.

## Data Model Touched

### `ad_groups`

Read only:

- `id`
- `project_id`
- `name`
- `rationale`
- `conversation_ids`
- `status`

Only ad groups with `status = approved` or `status = creative_generated` are eligible. Draft/rejected ad groups must not generate creatives.

### `creative_variants`

Create/update rows with:

- `id`
- `project_id`
- `ad_group_id`
- `title`
- `description`
- `creative_angle`
- `asset_type`: `image` / `video` / `none`
- `asset_prompt`
- `asset_url`: nullable
- `review_status`: `pending` / `approved` / `edited` / `rejected`
- `asset_generation_status`: `skipped` / `queued` / `running` / `succeeded` / `failed`
- `provider`: nullable, expected `openai` for copy and `fal.ai` for rendered assets
- `provider_request_json`: JSONB, copy generation input and fal input when called
- `provider_response_json`: JSONB, structured OpenAI output and fal response when called
- `error`: nullable text
- `created_at`
- `updated_at`

If Spec 02 standardizes this column as `status` instead of `review_status`, implementers should treat `status` as the review status and avoid adding a duplicate column. The UI label must still say review status.

### `extraction_runs`

Write one run for the text generation phase:

- `phase = creative_generation`
- `input_json`: approved ad groups plus selected conversations/features/gaps
- `output_json`: raw structured output
- `model`
- `prompt_version`
- `status`
- `error`

Optional asset generation may either write another `extraction_runs` row with `phase = creative_asset_generation` if that enum exists, or store fal request/response directly on `creative_variants.provider_*_json`. Do not block on adding a new enum if Spec 02 has already locked the phase list.

### `human_reviews`

For approve/edit/reject actions:

- `entity_type = creative_variant`
- `entity_id = creative_variants.id`
- `action = approve` / `edit` / `reject`
- `before_json`
- `after_json`
- `comment`

## Input Contract

The generation service receives:

- `project_id`
- approved `ad_groups`
- approved or edited `conversations` referenced by each ad group
- approved `brand_features`
- approved or edited `landing_gaps` linked to those conversations
- optional brand/project context from `projects.extra_context`

For each ad group, build a compact context object:

```json
{
  "ad_group": {
    "id": "uuid",
    "name": "Gmail migration - fast setup",
    "rationale": "Targets teams blocked by timeline and setup uncertainty"
  },
  "conversations": [
    {
      "id": "uuid",
      "text": "Can we move from spreadsheets to a CRM by Friday?",
      "stage": "evaluation",
      "intent_type": "migration",
      "buyer_role": "ops_lead",
      "constraints_json": {
        "timeline": "by Friday",
        "integration": "Gmail"
      }
    }
  ],
  "brand_features": [
    {
      "type": "proof_point",
      "title": "Gmail setup in one afternoon",
      "description": "Teams can connect Gmail and import contacts without engineering support"
    }
  ],
  "landing_gaps": [
    {
      "gap_type": "setup_path",
      "description": "Landing page says easy setup but lacks Gmail proof",
      "suggested_fix": "Add a setup path module and migration checklist"
    }
  ]
}
```

## OpenAI Prompt Contract

Use a structured output schema rather than free-form JSON. The schema should require all top-level fields and reject unknown fields.

Prompt intent:

- Generate campaign-ready variants, not generic slogans.
- Tie each title/description to at least one conversation constraint and one brand feature or proof point.
- Include the landing gap when relevant so the prompt can become a monitoring explanation later.
- Avoid unsupported factual claims. If a needed proof point is missing, frame the copy as a testable angle rather than a promise.
- Produce one primary variant per ad group for v1; allow `variant_count` to become configurable later.

Structured output shape:

```ts
type CreativeGenerationOutput = {
  variants: Array<{
    ad_group_id: string;
    title: string;
    description: string;
    creative_angle: string;
    asset_type: "image" | "video" | "none";
    asset_prompt: string;
    grounding: {
      conversation_ids: string[];
      brand_feature_ids: string[];
      landing_gap_ids: string[];
      quality_signals: Array<
        | "specific_constraint"
        | "proof_aligned"
        | "gap_aware"
        | "generic_angle"
        | "pricing_unclear"
        | "migration_setup_aligned"
      >;
    };
    risks: string[];
  }>;
};
```

Text guidance:

- `title`: short ad headline, target 35-70 characters.
- `description`: one concise sentence, target 90-160 characters.
- `creative_angle`: plain-language strategy label, e.g. `Timeline proof`, `Setup anxiety`, `Pricing clarity`.
- `asset_prompt`: visual generation prompt, no UI instructions, no forbidden brand/logo claims unless the source text includes them.
- `asset_type`: default `image`; use `none` if the input lacks enough visual context or provider asset generation is disabled.

## fal.ai Asset Generation

fal.ai is optional and must never block the demo.

Default model:

- `fal-ai/flux/schnell`
- `image_size = landscape_16_9` for dashboard/deploy preview cards, or `landscape_4_3` if implementation prefers the model default.
- `num_images = 1`
- `num_inference_steps = 4`
- `enable_safety_checker = true`
- `output_format = jpeg`
- `acceleration = regular` only if confirmed available and stable in the environment; otherwise use the model default.

Server behavior:

1. If `FAL_KEY` is absent, do not call fal.ai.
2. Persist the OpenAI-generated `asset_prompt`.
3. Set `asset_generation_status = skipped`, `asset_type = image` or `none`, and `asset_url = null`.
4. Show the card as prompt-only with a "generation skipped" provider badge.

If fal.ai is available:

1. Call from server-side route handler or background job only.
2. Use `fal.subscribe("fal-ai/flux/schnell", { input, logs: true, onQueueUpdate })`.
3. Persist request JSON before the call.
4. Persist response JSON and first safe image URL on success.
5. If the response has safety flags, empty images, or no URL, mark `asset_generation_status = failed`, keep the prompt, and do not delete the creative row.

Video:

- `asset_type = video` is allowed in the model/schema for future support.
- V1 should not call a video model during the live demo unless the team explicitly adds a stable provider path.
- If the OpenAI output recommends video, persist the prompt but set `asset_generation_status = skipped` unless a video provider is configured.

## API / Server Boundaries

### `POST /api/projects/[id]/creatives`

Purpose: generate or regenerate variants for approved ad groups.

Request:

```json
{
  "ad_group_ids": ["uuid"],
  "variant_count": 1,
  "generate_assets": true,
  "regenerate": false
}
```

Response:

```json
{
  "project_id": "uuid",
  "created_variant_ids": ["uuid"],
  "asset_generation": {
    "mode": "fal.ai",
    "skipped_count": 0,
    "failed_count": 0
  }
}
```

Rules:

- Validate that the project exists.
- Validate every ad group belongs to the project.
- Reject generation if no selected ad group is approved.
- If `regenerate = false`, do not create duplicate pending variants for an ad group that already has a pending/approved variant.
- If `regenerate = true`, create a new variant row and leave prior rows intact for auditability.
- Do not make browser code call OpenAI or fal.ai directly.

### Review mutations

Review actions can be implemented as Server Actions or route handlers. Use whichever pattern Spec 05 chooses, but keep these boundaries:

- Mutations write `human_reviews` and update `creative_variants.review_status`.
- Edits store both before and after JSON.
- Rejecting a variant does not delete it.
- Approving a variant makes it eligible for fake deploy.

## Background Jobs / Realtime

Preferred:

- Trigger generation through a route handler that enqueues an Inngest job for longer provider calls.
- Insert creative rows as soon as OpenAI copy generation completes.
- Update each creative row when fal.ai asset generation succeeds/fails/skips.

Realtime:

- The Creatives page subscribes to `creative_variants` changes scoped by `project_id`.
- Cards move through statuses: `copy_running` is represented by a page-level progress state; `pending` rows appear after copy generation; asset status updates independently.
- Do not block text review on image generation. A prompt-only creative is still reviewable.

Lean fallback:

- If Inngest is not wired yet, the route handler may perform copy generation synchronously and attempt fal.ai sequentially with a short timeout. It must still persist partial rows before returning failure for any later asset problem.

## UI States and Interactions

Page layout:

- Header with project name and workflow navigation.
- Left/main section: creative cards grouped by ad group.
- Right/detail section or modal: selected creative details, grounding, prompt, review controls.
- Top action: `Generate creatives` for all approved ad groups that need variants.

Card fields:

- Ad group name and status.
- Title.
- Description.
- Creative angle badge.
- Asset preview if `asset_url` exists.
- Prompt preview if no asset URL.
- Provider badge: `OpenAI copy`, `fal.ai asset`, `asset skipped`, or `asset failed`.
- Review status badge.

States:

- Empty: no approved ad groups; direct user to Review/Ad Groups.
- Ready: approved ad groups exist, no creatives yet.
- Generating copy: disable duplicate generation; show per-ad-group pending rows if possible.
- Asset queued/running: card is usable, image slot shows progress.
- Asset skipped: show the prompt in the media area with no error styling.
- Asset failed: show retry button for asset only; keep copy review enabled.
- Approved: lock primary fields unless user chooses edit.
- Rejected: collapse or dim row; keep visible for audit.

Interactions:

- Generate all missing variants.
- Regenerate a single ad group variant.
- Retry asset generation for a single variant.
- Edit title, description, angle, or prompt.
- Approve/reject variant.
- Copy prompt for manual use.

## Failure States

- OpenAI unavailable: create an `extraction_runs` failed row; show "Copy generation failed" and let seeded/demo data path cover the demo.
- Structured output validation fails: persist raw output in `extraction_runs.output_json`, mark run failed, show retry.
- No approved ad groups: return 409 and show guidance to approve ad groups first.
- Missing source grounding: generate no variant for that ad group and return a validation warning; do not invent claims.
- fal.ai key missing: mark asset generation skipped, persist prompt, keep variant reviewable.
- fal.ai timeout/rate limit/validation error: mark asset failed, persist request/error, allow retry.
- Safety checker blocks output: mark asset failed with reason `safety_blocked`; keep prompt for editing.
- Duplicate generation click: idempotently return existing pending/approved variants unless `regenerate = true`.

## Acceptance Criteria

- Given a project with at least one approved ad group, when the user clicks `Generate creatives`, then the system creates at least one `creative_variants` row per approved ad group.
- Each created variant has non-empty `title`, `description`, `creative_angle`, and `asset_prompt`.
- Each created variant persists a review status.
- Each OpenAI generation call is represented in `extraction_runs` with input, output, model, prompt version, status, and any error.
- If `FAL_KEY` is absent, generation still succeeds with `asset_generation_status = skipped`, `asset_url = null`, and the prompt visible in the UI.
- If fal.ai succeeds, the first generated image URL is persisted in `asset_url`.
- If fal.ai fails, the creative remains reviewable and the failure is visible at card level.
- The user can approve, reject, and edit a creative, and each action writes a `human_reviews` row.
- Only approved creative variants are eligible for fake deploy in Spec 08.

## Minimal Demo Script

1. Open a project whose extraction and ad groups are already reviewed.
2. Navigate to `Creatives`.
3. Point out that approved ad groups are ready and draft groups are excluded.
4. Click `Generate creatives`.
5. Show title, description, creative angle, and visual prompt appearing per ad group.
6. If fal.ai is configured, wait for one image to appear; if not, point to the explicit skipped asset badge and the persisted prompt.
7. Edit one title or prompt to show HITL control.
8. Approve one or more variants.
9. Navigate to Monitoring/Fake Deploy and show that only approved variants are deployable.

## Open Questions / Risks

- Should the first version generate one variant per ad group or three alternatives? Recommendation: one for demo speed, with regeneration for breadth.
- Does Spec 02 standardize `creative_variants.status` or `review_status`? Recommendation: use one canonical review status field and avoid duplicate state.
- Will generated fal.ai media URLs be persisted as external URLs only, or copied into Supabase Storage? Recommendation: external URL for v1, storage copy post-demo.
- Should media prompt edits trigger an automatic fal.ai retry? Recommendation: manual retry to avoid surprise provider spend.
- Which OpenAI model is configured for the demo? Requirement: it must support Structured Outputs for the selected API path.

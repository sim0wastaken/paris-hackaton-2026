# Motive OpenAI-first Hackathon Plan

> Status: Accepted direction for the Paris AI Hackathon demo. Date: 2026-05-16.

## One-line Thesis

Motive's hackathon demo should first prove the full customer workflow: ingest a brand link and context, extract campaign intelligence with OpenAI, persist every artifact, let the user validate it, generate ad-group creatives, and show a monitoring dashboard. Pioneer is not in the critical path for v1; it becomes the specialist classifier / learning layer once the OpenAI-first dataset exists.

## Product Split

### Demo-day artifact

The demo-day product is a persisted campaign-workbench flow:

```text
Brand link + context files
  -> streaming OpenAI extraction jobs
  -> HITL page fills phase-by-phase
  -> persisted conversations / intents / landing gaps
  -> live validation as rows appear
  -> ad groups
  -> title + description + image/video creatives
  -> fake deploy
  -> story-driven monitoring dashboard
```

This is what the jury and user should see running. It is independent from Pioneer in the first iteration.

### Pioneer narrative

Pioneer is the obvious second layer, not the first dependency. Once Motive has stored OpenAI extractions, HITL corrections, ad groups, creative variants, and performance rows, that data becomes the training corpus for a Pioneer Conversation/Intent Classifier.

The honest pitch line is:

> Today OpenAI powers the full campaign workflow. Every validated row we store becomes training data for a smaller Pioneer classifier that can later replace repeated GPT labeling calls and improve from campaign outcomes.

## Hackathon Build Order

1. Scaffold the project: backend, frontend, database, CRUD APIs, env wiring, and provider clients.
2. Define the database schema before writing workflows.
3. Build OpenAI extraction for each phase and persist every intermediate artifact.
4. Generate ad groups from validated extraction rows.
5. Generate creative assets for each ad group: title, description, and image/video prompt or asset.
6. Build dashboards and management pages for viewing, editing, approving, and monitoring the generated data.
7. Stream extraction phases into the HITL page with Supabase Realtime and/or Inngest events; never make the judge stare at a spinner.
8. Add fake deploy and story-driven monitoring once the creation path is solid.
9. Add Pioneer hooks only after the OpenAI-first loop works.

## User Flow

1. User drops in a brand/homepage URL.
2. User adds extra context: PDFs, Markdown files, positioning notes, product docs, screenshots, or other source material.
3. Extraction starts as background jobs; the HITL page opens immediately.
4. Results stream in phase-by-phase: source recap appears first, then feature map, conversations, intents/stages, landing gaps, and ad-group ideas.
5. User validates, edits, rejects, or enriches the extracted ideas.
6. User generates ad-group creatives: title, description, and image/video.
7. User reviews the final campaign assets.
8. Fake "deploy" button marks the package as launched; real ad-platform deployment is out of scope.
9. Monitoring dashboard shows GPT-generated performance snapshots correlated with ad-group/creative quality, so it tells an insight story rather than displaying random numbers.

## Required Data Model

The exact table names can change, but the product needs these concepts:

| Concept | Stores |
|---|---|
| `projects` | Workspace/project for one brand analysis. |
| `sources` | URL, uploaded files, extracted text, metadata, processing status. |
| `extraction_runs` | OpenAI job status, prompt/version, model, timestamps, errors. |
| `brand_features` | Features, value props, USPs, use cases, proof points, objections. |
| `conversations` | Buying conversations, stage, intent, buyer role, constraints, source references. |
| `landing_gaps` | Missing proof, comparison, setup path, pricing clarity, trust/compliance gaps. |
| `ad_groups` | Campaign grouping, target conversation set, rationale, status. |
| `creative_variants` | Title, description, angle, image/video prompt, generated asset URL, status. |
| `human_reviews` | Approvals, edits, rejections, comments, reviewer, timestamps. |
| `deployments` | Fake deploy records for demo continuity. |
| `performance_snapshots` | Mocked or imported KPI rows by conversation, ad group, and creative. |

Persist all OpenAI inputs and outputs. The stored data is the product, the audit trail, and the future Pioneer training set.

## Lean Database Schema

Use UUID primary keys, `created_at`, and `updated_at` on every table. Store provider request/response bodies as JSONB so the demo can be audited and replayed.

### `projects`

- `id`
- `name`
- `brand_url`
- `status`: `draft` / `extracting` / `review` / `creative_ready` / `deployed`
- `extra_context`

### `sources`

- `id`
- `project_id`
- `type`: `url` / `pdf` / `markdown` / `text`
- `name`
- `uri`
- `raw_text`
- `extracted_text`
- `status`: `pending` / `processed` / `failed`

### `extraction_runs`

- `id`
- `project_id`
- `phase`: `source_recap` / `feature_map` / `conversation_map` / `landing_gaps` / `ad_groups` / `creative_generation`
- `model`
- `prompt_version`
- `input_json`
- `output_json`
- `status`: `queued` / `running` / `succeeded` / `failed`
- `error`

### `brand_features`

- `id`
- `project_id`
- `type`: `feature` / `value_prop` / `usp` / `use_case` / `proof_point` / `objection`
- `title`
- `description`
- `source_refs`
- `review_status`: `pending` / `approved` / `edited` / `rejected`

### `conversations`

- `id`
- `project_id`
- `text`
- `stage`
- `intent_type`
- `buyer_role`
- `constraints_json`
- `source_refs`
- `review_status`

### `landing_gaps`

- `id`
- `project_id`
- `conversation_id`
- `gap_type`
- `description`
- `suggested_fix`
- `review_status`

### `ad_groups`

- `id`
- `project_id`
- `name`
- `rationale`
- `conversation_ids`
- `status`: `draft` / `approved` / `creative_generated` / `deployed`

### `creative_variants`

- `id`
- `project_id`
- `ad_group_id`
- `title`
- `description`
- `creative_angle`
- `asset_type`: `image` / `video` / `none`
- `asset_prompt`
- `asset_url`
- `status`: `draft` / `approved` / `rejected`

### `human_reviews`

- `id`
- `project_id`
- `entity_type`
- `entity_id`
- `action`: `approve` / `edit` / `reject` / `enrich`
- `before_json`
- `after_json`
- `comment`

### `deployments`

- `id`
- `project_id`
- `status`: `fake_deployed`
- `payload_json`

### `performance_snapshots`

- `id`
- `project_id`
- `ad_group_id`
- `creative_variant_id`
- `impressions`
- `clicks`
- `ctr`
- `conversions`
- `cvr`
- `spend`
- `quality_score`
- `insight`
- `recommended_action`
- `notes`

## Streaming Extraction UX

The extraction experience must be progressive. Eight OpenAI phases can take 30-90 seconds, and a single spinner is a demo killer. Use Supabase Realtime and/or Inngest events so completed phases land directly into the HITL workspace.

The page should behave like this:

1. User submits URL/context and is routed to Review immediately.
2. A workflow rail shows phase status: queued, running, complete, failed.
3. When source recap completes, the summary panel fills in.
4. When feature map completes, features/value props/use cases appear and can be reviewed.
5. When conversations complete, conversation rows appear.
6. When intent/stage classification completes, row metadata fills in.
7. When landing gaps complete, gap badges and suggested fixes appear.
8. When ad-group proposal completes, ad-group cards appear.

This turns latency into theater: the product visibly builds the campaign substrate in front of the judge.

## OpenAI-first Extraction Phases

1. Source recap: summarize brand, offer, ICP, category, competitors, proof points, and constraints.
2. Feature map: extract at least 10 total brand features, value props, USPs, use cases, and objections.
3. Conversation map: generate buying conversations from the feature map.
4. Intent classification: assign stage, intent type, buyer role, constraints, and source references.
5. Landing-gap analysis: identify missing proof, comparison, setup, pricing, trust, and compliance gaps.
6. Ad-group proposal: group validated conversations into campaign-ready ad groups.
7. Creative generation: produce title, description, creative angle, and image/video prompt or asset.
8. Monitoring synthesis: generate KPI snapshots and explanations correlated with perceived ad-group and creative quality.

## Story-driven Monitoring

Mocked KPIs must not be random. They should communicate a plausible lesson about the campaign.

Use GPT to generate `performance_snapshots` from the approved ad groups and creative variants. The generated metrics should correlate with qualitative quality signals:

- specific, time-bound, constraint-aware angles should outperform generic angles
- creatives aligned to a strong landing gap should show higher CTR but lower CVR if the page gap remains unresolved
- proof-seeking conversations should reward proof-heavy copy
- pricing-check conversations should underperform if pricing clarity is missing
- migration/switching conversations should reward setup-path and comparison copy

Example insight:

> "Live in your inbox by Friday" outperforms "Simple CRM for teams" because it matches the timeline constraint and Gmail integration context. CVR still lags because the landing page lacks Gmail setup proof.

This is the bridge to Pioneer: the monitoring chart shows the rows Pioneer would later learn from, not random demo noise.

## Pioneer Role After V1

Pioneer becomes valuable after the OpenAI-first workflow has data:

- Train or evaluate a smaller classifier on stored OpenAI labels plus HITL corrections.
- Use GLiNER2 for constraint extraction: budget, timeline, integration, team-size, compliance.
- Replace repeated GPT classification calls once the classifier is good enough.
- Use `human_reviews` and `performance_snapshots` as the future feedback loop.

Do not block scaffolding, extraction, ad groups, creatives, or dashboards on Pioneer.

## Explicit Non-goals for Hackathon

- No real ad-platform deployment.
- No completed Pioneer retraining cycle.
- No production billing, auth hardening, canary model rollout, rollback, or drift detection.
- KPI rows may be mocked or seeded, but they must be generated as a coherent performance story tied to the approved ad groups, creative angles, and landing gaps. Do not use random numbers.

## Demo Acceptance

The demo is credible when:

- A user can create a project from a brand URL and optional context files.
- OpenAI extraction runs and persists source recap, feature map, conversations, landing gaps, and ad-group ideas.
- The HITL page lets the user validate or edit extracted ideas.
- Creative generation creates persisted title/description/image-or-video outputs.
- Dashboard pages show the created objects and a story-driven monitoring view with coherent insights.
- Pioneer is framed as the next optimization layer fed by the database, not as a blocker for the demo.

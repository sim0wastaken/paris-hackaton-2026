# Spec 08 - Fake Deploy and Story-driven Monitoring

Date: 2026-05-16
Owner: Worker D
Status: Implemented
Phase: Approved creatives -> fake deployment -> coherent simulated performance
Depends on: Spec 02 database contract, Spec 07 creative generation, Spec 06 ad groups

## Problem / User Value

The demo needs a satisfying final loop: approved creatives become a launched campaign package, and the dashboard explains what is working and why. Random KPI mocks would weaken the product story. Motive's monitoring should show plausible campaign performance tied to ad-group quality, creative specificity, and unresolved landing gaps.

The user value is an explainable dashboard that helps a marketer decide what to keep, fix, or regenerate. The strategic value is the Pioneer bridge: every `performance_snapshots` row becomes an outcome-labeled example that a future classifier can learn from.

This spec follows `docs/superpowers/specs/SHARED_CONTRACT.md` for OpenAI-compatible deploy payload shape and KPI scoring.

## Goals

- Let the user fake-deploy approved creative variants with one clear action.
- Persist a `deployments` row containing an OpenAI Ads-shaped campaign/ad-group/ad payload plus selected Motive context.
- Generate `performance_snapshots` with coherent KPIs, `quality_score`, `insight`, and `recommended_action`.
- Make KPI generation deterministic enough to explain live while allowing GPT to synthesize human-readable insights.
- Show a dashboard whose charts and tables support one clear story for the future Pioneer pitch.
- Label all KPIs as simulated/internal so the demo does not imply real ad-platform data.

## Scope

- Add a Monitoring page at `apps/web/src/app/projects/[id]/monitoring/page.tsx`.
- Add a fake deploy endpoint at `apps/web/src/app/api/projects/[id]/deploy/route.ts`.
- Add domain services:
  - `apps/web/src/lib/motive/deployments.ts`
  - `apps/web/src/lib/motive/performance.ts`
- Add a dashboard component at `apps/web/src/components/monitoring-dashboard.tsx`.
- Read approved creative variants and approved ad groups.
- Write `deployments` and `performance_snapshots`.
- Use deterministic quality rules for numeric ranges.
- Use OpenAI structured output for optional narrative synthesis of insight/recommended action, or a deterministic copy fallback if OpenAI is unavailable.
- Use Recharts for a minimal responsive dashboard if charting is installed; otherwise ship a table-first fallback.

## Non-goals

- No real Meta/Google/TikTok/LinkedIn deployment.
- No real spend management or attribution.
- No bid optimization, budget pacing, or campaign editing.
- No production analytics ingestion.
- No Pioneer inference, fine-tuning, or Adaptive Inference in v1.
- No claim that simulated KPIs are real outcomes.

## Research Notes

- OpenAI Structured Outputs: use schema-constrained generation for performance insight synthesis so every snapshot includes `quality_score`, `insight`, and `recommended_action`. Source: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI JSON mode caveat: JSON mode only ensures valid JSON, not schema adherence; prefer Structured Outputs for monitoring rows. Source: https://developers.openai.com/api/docs/guides/structured-outputs
- Next.js route handlers: fake deploy should be a POST route handler under `app/**/route.ts`; handlers use Web Request/Response APIs and support standard HTTP methods. Source: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js Server Actions: review-like UI mutations can use Server Actions, which run on the server and integrate with cache/UI updates; route handlers are still preferred for explicit API endpoints and background job triggers. Source: https://nextjs.org/docs/app/getting-started/updating-data
- Recharts: `ResponsiveContainer` adapts chart dimensions to its parent and provides context for `LineChart` and `BarChart`; this is enough for the KPI trend and ad-group comparison views. Source: https://recharts.github.io/en-US/api/ResponsiveContainer/
- Recharts: `LineChart`, `BarChart`, `Tooltip`, and `Legend` are composable dashboard primitives. Sources: https://recharts.github.io/en-US/api/LineChart/ , https://recharts.github.io/en-US/api/BarChart/ , https://recharts.github.io/en-US/api/Tooltip/ , https://recharts.github.io/en-US/api/Legend/
- Context7 grounding used: `/vercel/next.js` for route handler/server mutation boundaries and `/recharts/recharts` for responsive chart patterns.

## Core Story

The dashboard must communicate this story:

> Specific, constraint-aware creatives earn attention. Conversion depends on whether the landing page resolves the same intent. The rows with human review plus simulated outcomes are the training substrate for a future Pioneer classifier.

Example story for a judge:

- Creative A: "Live in your inbox by Friday" has high CTR because it matches timeline and Gmail migration constraints.
- CVR is only moderate because a setup-path landing gap is still unresolved.
- Creative B: "Simple CRM for teams" has lower CTR because it is generic and weakly grounded.
- Recommended action: keep the timeline/Gmail angle, add setup proof to the landing page, then regenerate a proof-heavy variant.

## Data Model Touched

### `creative_variants`

Read approved rows:

- `id`
- `project_id`
- `ad_group_id`
- `title`
- `description`
- `creative_angle`
- `asset_type`
- `asset_prompt`
- `asset_url`
- `review_status` or `status`

Only approved variants are deployable. Rejected/pending variants remain visible in Creatives but are excluded from deploy payloads.

### `campaigns`

Read:

- `id`
- `project_id`
- `name`
- `objective`
- `lifetime_spend_limit_micros`
- `countries`
- `custom_instruction`
- `status`

### `ad_groups`

Read:

- `id`
- `project_id`
- `campaign_id`
- `name`
- `context_hints`
- `billing_event_type`
- `max_bid_micros`
- `rationale`
- `conversation_ids`
- `product_feed_item_ids`
- `status`

### `landing_gaps`, `conversations`, `brand_features`

Read for quality scoring and explanations:

- Conversation stage, intent type, buyer role, constraints.
- Landing gap type, description, suggested fix, review status.
- Feature/proof-point type and review status.

### `product_feeds`, `product_feed_items`

Read only when present:

- Feed metadata for ecommerce/product-feed payload context.
- Approved product items linked from `ad_groups.product_feed_item_ids`.
- Item title, description, link, image link, price, availability, brand, and product type.

### `deployments`

Write:

- `id`
- `project_id`
- `status`: `fake_deployed`
- `payload_json`: OpenAI Ads-shaped `campaign`, `ad_groups`, and `ads` arrays plus optional `product_feed` / `product_feed_items` context, Motive-owned rationale, creative angles, generated asset URLs/prompts, deploy timestamp, actor, provider label `simulated`
- `created_at`
- `updated_at`

Optional but recommended:

- `name`: demo deploy label, e.g. `Campaign package 1`
- `deployed_at`

### `performance_snapshots`

Write one row per deployed creative/ad-group combination and optionally one aggregate row per ad group.

Required:

- `id`
- `project_id`
- `ad_group_id`
- `creative_variant_id`
- `deployment_id`
- `period_start`
- `period_end`
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
- `created_at`
- `updated_at`

Recommended additions:

- `simulated`: boolean default true
- `metric_basis_json`: JSONB with quality rule inputs and score components
- `confidence`: `low` / `medium` / `high`, because these are simulated estimates

## Quality Correlation Rules

KPI generation must start with deterministic scoring. GPT may summarize the result, but it must not invent unrelated metrics.

Score components:

- `specific_constraint_match` (+15): title/description/angle references a concrete constraint from `conversations.constraints_json`, such as timeline, integration, team size, budget, migration path, or compliance.
- `proof_alignment` (+15): copy uses an approved proof point or feature relevant to the conversation.
- `landing_gap_alignment` (+10 CTR, -10 CVR unless resolved): copy directly addresses a known landing gap. It earns attention but conversion suffers if the gap remains unresolved.
- `generic_angle_penalty` (-20): title/description could fit any B2B product.
- `pricing_unclear_penalty` (-15 CVR): pricing-check intent exists and no approved pricing clarity proof or gap fix exists.
- `migration_setup_bonus` (+12): migration/switching conversations get setup-path or comparison copy.
- `proof_seeking_bonus` (+12): proof-seeking conversations get case-study, integration proof, trust, or compliance copy.
- `asset_bonus` (+5): rendered image exists and is not blocked; prompt-only creatives can still perform, just with a small penalty.
- `review_bonus` (+8): human-edited/approved variants outperform unedited generated rows.

Quality score:

- Start at 50.
- Apply components.
- Clamp to 1-100.
- Store full component breakdown in `metric_basis_json`.

Metric ranges:

- High quality (75-100):
  - CTR: 3.0%-5.5%
  - CVR: 5.0%-9.0%, unless unresolved landing/pricing gap applies
- Medium quality (50-74):
  - CTR: 1.6%-3.2%
  - CVR: 2.8%-5.5%
- Low quality (1-49):
  - CTR: 0.5%-1.8%
  - CVR: 0.8%-3.0%

Additional rules:

- Use stable seeded variation based on `creative_variant_id` so reruns are reproducible.
- Higher CTR with lower CVR is valid only when explained by an unresolved landing gap or pricing clarity issue.
- Do not allow impossible metrics: `clicks <= impressions`, `conversions <= clicks`, `spend > 0`, `ctr = clicks / impressions`, `cvr = conversions / clicks`.
- Generate 3-5 period rows per creative if trend charts are needed; otherwise one snapshot row per creative is acceptable for v1.

## GPT / Deterministic Generation Approach

### Default path

1. Deterministically compute score components and numeric metrics.
2. Pass only the scored facts to OpenAI for narrative synthesis.
3. Require structured output:

```ts
type MonitoringSynthesisOutput = {
  snapshots: Array<{
    ad_group_id: string;
    creative_variant_id: string;
    quality_score: number;
    insight: string;
    recommended_action: string;
    notes: string;
  }>;
  dashboard_summary: {
    headline: string;
    what_worked: string;
    what_blocked_conversion: string;
    pioneer_learning_signal: string;
  };
};
```

Prompt instructions:

- Use only supplied metrics and score components.
- Explain one cause for CTR and one cause for CVR where relevant.
- Recommended action must be one of: `keep_angle`, `fix_landing_gap`, `regenerate_generic_copy`, `add_pricing_proof`, `add_setup_proof`, `test_proof_heavy_variant`, `pause_low_quality_variant`.
- Mention that KPIs are simulated/internal in dashboard summary if surfaced.
- Do not claim real campaign performance.

### Fallback path

If OpenAI is unavailable:

- Use deterministic templates keyed by the top positive and negative score components.
- Persist snapshots with `notes = "Generated by deterministic fallback; simulated KPI row."`
- Keep `quality_score`, `insight`, and `recommended_action` non-empty.

Example deterministic insights:

- `specific_constraint_match + unresolved_setup_gap`: "The creative earns attention because it names the buyer's timeline or integration constraint, but conversion is capped by the unresolved setup-path gap."
- `generic_angle_penalty`: "The creative underperforms because the angle is generic and does not connect to the approved buying conversation."
- `pricing_unclear_penalty`: "Pricing-check traffic is unlikely to convert until the landing page explains pricing or adds a proof point."

## API / Server Boundaries

### `POST /api/projects/[id]/deploy`

Purpose: fake-deploy approved creatives and generate story monitoring rows.

Request:

```json
{
  "creative_variant_ids": ["uuid"],
  "generate_performance": true,
  "export_format": "openai_ads_api"
}
```

Response:

```json
{
  "deployment_id": "uuid",
  "status": "fake_deployed",
  "performance_snapshot_ids": ["uuid"],
  "simulated": true
}
```

Rules:

- Validate project exists.
- Validate campaign exists or create a default approved campaign from Spec 06 defaults.
- Validate all creative variants belong to project.
- Include approved product-feed rows in payload only when selected ad groups link to them; do not require product-feed data for the B2B SaaS demo path.
- Reject if no approved variants are selected.
- Exclude pending/rejected variants even if IDs are provided.
- Validate OpenAI compatibility before writing a successful fake deploy payload: campaign objective/budget/countries, ad group context hints/bid, creative title/body limits, target URL, and image requirements.
- Write deployment row before generating snapshots.
- If monitoring generation fails after deployment is written, keep deployment and show dashboard failure/retry.
- The endpoint is idempotent only if the same deployment should be reused. V1 may create a new deployment per click but should confirm in UI to avoid accidental duplicates.

### `POST /api/projects/[id]/monitoring/regenerate`

Optional v1 endpoint:

- Regenerates simulated performance for the latest deployment.
- Requires explicit user action.
- Does not delete old snapshots; either marks old rows superseded if schema supports it or filters dashboard to latest deployment.

## UI States and Interactions

### Fake deploy panel

States:

- Empty: no approved creatives; show path back to Creatives.
- Ready: list approved creatives and a deploy button.
- Deploying: button disabled, show selected count.
- Deployed: show deployment timestamp and selected variants.
- Partial monitoring failure: deployment succeeded, snapshots missing; show retry monitoring generation.

Required label:

- "Simulated hackathon KPIs - not connected to an ad platform."

### Monitoring dashboard

The dashboard should be compact and legible:

- KPI cards:
  - Total simulated impressions
  - CTR
  - CVR
  - Spend
  - Average quality score
- Primary chart:
  - Bar chart comparing CTR/CVR by creative or ad group.
- Secondary chart:
  - Line chart over 3-5 periods if trend rows exist, otherwise omit.
- Insight panel:
  - One dashboard summary headline.
  - `what_worked`
  - `what_blocked_conversion`
  - `pioneer_learning_signal`
- Table:
  - Ad group
  - Creative title
  - Quality score
  - CTR
  - CVR
  - Insight
  - Recommended action

Recharts implementation notes:

- Place chart components in a client component with `"use client"`.
- Wrap charts in a parent with explicit height and `ResponsiveContainer width="100%" height="100%"`.
- Use `BarChart` for comparison and `LineChart` only if time series rows exist.
- Use `Tooltip` for metric definitions and `Legend` only when there are multiple series.

## Background Jobs / Realtime

Preferred:

- `POST /deploy` writes deployment immediately.
- If performance generation may exceed request budget, enqueue an Inngest job.
- The monitoring page subscribes to `deployments` and `performance_snapshots` by `project_id`.
- KPI cards appear as soon as rows insert.

Lean fallback:

- Generate deterministic metrics synchronously in the deploy route.
- Call OpenAI for narrative synthesis with a short timeout.
- If OpenAI times out, write deterministic narrative and return success.

Realtime events:

- `deployments.insert`: show deployed state.
- `performance_snapshots.insert`: update KPI cards/table.
- `performance_snapshots.update`: refresh insights if narrative synthesis finishes after deterministic numeric rows.

## Failure States

- No approved creatives: return 409 and show "Approve at least one creative before deploy."
- Duplicate deploy click: disable button during request; optionally show existing latest deployment.
- Database insert failure: show deploy failed; do not show dashboard as live.
- OpenAI unavailable for narrative: use deterministic fallback; do not fail deploy.
- Numeric validation failure: do not persist invalid row; log component inputs and show retry.
- Chart library not installed or hydration error: dashboard falls back to KPI cards and table.
- Empty snapshots after deploy: show deployment success plus "Monitoring generation failed" retry action.
- User tries to deploy prompt-only creative: allow it if review status is approved; mark `asset_url = null` in payload.

## Acceptance Criteria

- Given at least one approved creative, when the user clicks fake deploy, then a `deployments` row is created with `status = fake_deployed`.
- The deployment payload includes an OpenAI Ads-shaped campaign, ad groups with `context_hints`, and ads with `chat_card` title/body/target URL/image fields, plus Motive-owned creative IDs, ad group IDs, creative angle, asset prompt, and optional asset URL/file ID.
- Payload validation flags non-exportable video assets and non-square/missing image assets before marking the package OpenAI-compatible.
- Pending/rejected creative variants cannot be deployed.
- Performance snapshots are generated for deployed creatives.
- Every snapshot includes valid `quality_score`, `insight`, and `recommended_action`.
- KPI numbers are derived from documented quality rules and are internally consistent.
- The dashboard visibly labels KPIs as simulated/internal.
- The dashboard exposes at least one coherent insight connecting creative quality, landing gaps, and metric behavior.
- If OpenAI synthesis fails, deterministic fallback still writes non-empty insights and recommendations.
- The user can point to the dashboard and explain how future Pioneer would learn from stored labels, reviews, and KPI rows.

## Implementation Notes

- Domain contract and fake deploy orchestration live in `apps/web/src/lib/motive/deployments.ts`.
- Deterministic story KPI scoring and optional OpenAI synthesis live in `apps/web/src/lib/motive/performance.ts`.
- Supabase persistence for `deployments` and `performance_snapshots` lives in `apps/web/src/lib/motive/supabase-deployments.ts`.
- `POST /api/projects/:id/deploy` creates a fake deployment, validates the OpenAI Ads-shaped payload, generates simulated snapshots, and returns the deployment plus snapshot IDs.
- `GET /api/projects/:id/deploy` returns monitoring workspace data for realtime/polling refresh.
- `apps/web/src/components/monitoring-dashboard.tsx` renders approved creative selection, fake deploy controls, KPI cards, a compact CTR/CVR comparison, dashboard summary, and outcome table.
- Recharts was not installed, so v1 uses a table-first dashboard with CSS metric bars.

## Minimal Demo Script

1. Start from the Creatives page with at least one approved creative.
2. Navigate to Monitoring.
3. Show the approved creative selection and the simulated KPI label.
4. Click `Fake deploy`.
5. Point to the new deployment timestamp.
6. Watch KPI cards/table populate.
7. Explain the primary insight: the specific, constraint-aware angle earns stronger CTR, while unresolved landing gaps or pricing clarity cap CVR.
8. Show the recommended action, such as adding setup proof or regenerating generic copy.
9. Close with the Pioneer pitch: these stored rows pair inputs, human review, and outcome-like signals for a future classifier.

## Open Questions / Risks

- Should `performance_snapshots` store one row per creative or multiple period rows per creative? Recommendation: generate one current row plus optional 3-period trend if implementation time allows.
- Should deploy create a new deployment every click or update the latest fake deployment? Recommendation: new row per click for auditability, dashboard defaults to latest.
- Should OpenAI generate numeric KPIs? Recommendation: no. Deterministic code generates metrics; GPT only explains them.
- How should resolved landing gaps be represented? Recommendation: v1 treats approved `landing_gaps` as known issues unless a later field marks them resolved.
- Does the dashboard need export? Recommendation: out of scope for v1; stored rows are enough for the Pioneer narrative.

# Spec 09 - Seeded Demo Path and Resilience

**Owner:** Worker E  
**Phase:** Demo safety path  
**Status:** Kicked off
**Required for demo:** Yes, as a safety net after specs 01-08 define the core workflow

## Problem / User Value

The hackathon demo cannot depend on a perfect network, fresh API credits, or long provider latency. Judges need to see the same product promise every time: a brand project opens, extraction appears progressively, reviewable rows become ad groups and creatives, fake deploy closes the loop, and monitoring tells a coherent story.

This spec defines the no-surprises path. It gives the team a deterministic seed project, a replayable extraction sequence, provider fallbacks, and a fast reset so a failed live call never turns into a stalled presentation.

Seed data must obey `docs/superpowers/specs/SHARED_CONTRACT.md`, including canonical labels, OpenAI-compatible campaign/ad-group/ad shapes, and 1-100 story KPI scores.

## Goals

- Provide one seeded project that exercises the same tables, UI states, and realtime paths as live provider output.
- Replay extraction phases progressively so the review workspace still feels live without OpenAI, Tavily, fal.ai, or Pioneer calls.
- Seed enough approved and pending rows to demonstrate HITL review, ad groups, creatives, fake deploy, and story KPIs.
- Let a presenter reset demo data between judging attempts in under 30 seconds.
- Make the fallback path explicit in the runbook and smoke checklist so the team can switch modes without improvising.

## Scope

### P0

- A deterministic demo seed project with source text, extraction phase fixtures, ad groups, creatives, deployment, and performance snapshots.
- A replay job that writes the same `extraction_runs` and materialized rows phase by phase, with small sleeps between phases.
- Provider fallback mode selected by env and by runtime failure:
  - Tavily unavailable -> use seeded extracted text.
  - OpenAI extraction unavailable -> use phase fixture outputs.
  - fal.ai unavailable -> persist visual prompts and use seeded static asset URLs or prompt-only cards.
  - Pioneer unavailable -> no effect because Pioneer is not in v1.
- A one-click reset endpoint guarded to local/demo environments.
- A manual smoke checklist covering live mode, fallback mode, and reset.

### P1

- Optional "simulate provider failure" toggles for the demo operator.
- A compact seeded-data health panel showing current seed version, last reset time, and last replay run.
- A script alias such as `pnpm demo:reset` that calls the same server-side reset path.

### P2

- Remote preview-branch reseeding automation.
- Multiple demo brands or verticals.
- Full e2e automation against the UI. A manual checklist is enough for the hackathon.

## Non-goals

- Do not replace the live provider path. The seeded path must exercise the same persistence and UI contract, but it is a fallback and rehearsal path.
- Do not use `supabase db reset --linked` or any destructive remote database reset from the app.
- Do not mock random KPIs. Seeded performance data must preserve the story rules from spec 08.
- Do not call Pioneer in the v1 demo safety path.
- Do not create separate demo-only UI pages that hide the real workflow. The same intake, review, creatives, and monitoring pages should render seeded rows.

## Dependencies

- Spec 01: app shell, Supabase client/server setup, Inngest setup, env parsing.
- Spec 02: tables, UUID primary keys, indexes, JSONB provider payloads, review statuses, extraction phases.
- Spec 04: extraction phase names and materialization contract.
- Spec 05: HITL realtime review workspace.
- Spec 06: ad-group status model.
- Spec 07: creative variants and asset fallback behavior.
- Spec 08: fake deploy and story-driven monitoring rules.

## Research Notes

- Supabase local seed files run after migrations on `supabase start` and `supabase db reset`; default seed location is `supabase/seed.sql`, and multiple seed files can be configured with `[db.seed].sql_paths` in `supabase/config.toml`. Source: [Supabase seeding docs](https://supabase.com/docs/guides/local-development/seeding-your-database).
- Supabase CLI `db reset` recreates the local database, applies migrations, and runs seed data. The same CLI page documents `--no-seed` and warns that `--linked` or `--db-url` reset remote user-created entities, so the app-level one-click reset must be scoped to demo rows only. Source: [Supabase CLI reference](https://supabase.com/docs/reference/cli/start).
- Supabase `db push --include-seed` can include seed data from config when applying migrations to a linked or specified database, but it should remain an operator command, not a UI reset action. Source: [Supabase CLI reference](https://supabase.com/docs/reference/cli/start).
- Supabase preview branches are seeded on branch creation and can be reseeded by recreating the preview branch; this is useful for hosted rehearsals but too heavy for live reset. Source: [Supabase branch seeding behavior](https://supabase.com/docs/guides/deployment/branching/working-with-branches).
- Inngest local development uses the Dev Server (`npx inngest-cli@latest dev`), and the Next.js App Router exposes `GET`, `POST`, and `PUT` from `serve({ client, functions })` at `/api/inngest`. Source: [Inngest Next.js quick start](https://www.inngest.com/docs/getting-started/nextjs-quick-start) and [Inngest serve reference](https://www.inngest.com/docs/reference/serve).
- Inngest events can be sent in batches, local development does not require an event key, and event IDs can be used for deduplication. Source: [Inngest events docs](https://www.inngest.com/docs/events).
- Inngest supports dashboard reruns and replay of failed function runs. The seeded demo should not depend on production replay; it should send deterministic local events, while keeping the real replay feature available for debugging. Sources: [Inngest function replay](https://www.inngest.com/docs/platform/replay) and [Inngest inspecting function runs](https://www.inngest.com/docs/platform/monitor/inspecting-function-runs).
- The hackathon manual requires a live walkthrough and repository documentation. This seeded path exists to make that walkthrough repeatable. Source: [Paris AI Hackathon manual](../../Hackathon-Briefs/%7BTech%20Europe%7D%20Paris%20AI%20Hackathon%20Manual%207222b372b789830a8ed50165ed151372.md).

## Seed Strategy

### Seed Files

Use standard Supabase seed mechanics for local development:

- `supabase/seed.sql` may include the demo seed directly for the fastest path.
- If the seed grows, configure ordered seed files in `supabase/config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = [
  "./seeds/001_demo_project.sql",
  "./seeds/002_demo_extraction_fixtures.sql",
  "./seeds/003_demo_campaign_outputs.sql"
]
```

Seed files should contain data inserts/upserts only. Schema changes belong in migrations.

### Seed Identity

Use deterministic UUIDs and a single stable project root:

- `demo_project_id`: fixed UUID used by every seeded child row.
- `demo_seed_version`: string stored in `projects.extra_context` or equivalent JSON field once available.
- `demo_run_id`: generated on each replay and stored in `extraction_runs.input_json.demo_run_id`.
- `provider_mode`: stored in provider JSON fields as `seeded_fixture`, not `openai`, `tavily`, or `fal`.

The reset path should delete by `project_id = demo_project_id`, then reinsert the baseline rows. Do not rely on broad `truncate` statements from the app.

## Data Model Touched

The seeded path touches every demo-facing table because its purpose is to exercise the full workflow without providers:

- `projects`: fixed seeded project with status transitions from `review` to `creative_ready` to `deployed` as the demo proceeds.
- `sources`: processed source rows with seeded `raw_text`, `extracted_text`, and source refs.
- `extraction_runs`: one row per phase, with fixture input/output JSON, status transitions, model/prompt placeholders, and any live-provider failure that triggered fallback.
- `brand_features`: seeded feature, value prop, proof point, use case, USP, and objection rows.
- `conversations`: seeded buying conversations with stage, intent, buyer role, constraints, source refs, and review status.
- `landing_gaps`: seeded gaps tied to conversations and campaign implications.
- `ad_groups`: seeded draft/approved campaign groups with rationales and linked conversations.
- `campaigns`: one seeded OpenAI-compatible campaign with budget, country targeting, objective, and custom instruction.
- `creative_variants`: seeded title, description, angle, visual prompt, optional asset URL, and status.
- `human_reviews`: seeded and live review actions so audit/history UI is exercised.
- `deployments`: fake deploy row for demo continuity.
- `performance_snapshots`: seeded story KPI rows with quality score, insight, and recommended action.
- `product_feeds` / `product_feed_items`: optional ecommerce fixture rows to prove product-feed support without blocking the B2B SaaS demo.

No new table is required for v1. If spec 02 adds generic JSON metadata fields, use them for `demo_seed_version`, `demo_run_id`, and `provider_mode`; otherwise use deterministic IDs plus existing provider JSON columns.

## Seeded Demo Brand

Use a fictional B2B SaaS brand so the demo has realistic campaign semantics without legal or factual risk.

### Project

- Name: `AtlasDesk`
- URL: `https://demo.motive.local/atlasdesk`
- Category: shared inbox CRM for founder-led B2B teams
- ICP: founders, revenue leads, and customer-success managers at 10-75 person software companies
- Positioning: "Turn messy founder inboxes into CRM-ready follow-up without leaving Gmail"

### Sources

Seed at least three source rows:

1. Homepage copy with product promise, Gmail integration, setup speed, and pricing ambiguity.
2. Founder note with ICP, objections, and proof points.
3. Customer quote snippets covering migration friction, timeline pressure, and proof seeking.

Each source should have `status = 'processed'`, non-empty `raw_text`, non-empty `extracted_text`, and `metadata` or JSON payload that marks it as seeded.

## Progressive Extraction Replay

### Event Contract

Add an Inngest function triggered by:

```text
demo/extraction.replay.requested
```

Event payload:

```json
{
  "project_id": "fixed-demo-project-id",
  "demo_run_id": "uuid",
  "seed_version": "2026-05-16.worker-e.v1",
  "requested_by": "demo_operator",
  "mode": "seeded_fixture"
}
```

The replay function should:

1. Insert or update an `extraction_runs` row for the phase with `status = 'running'`.
2. Wait a short deterministic delay with `step.sleep`.
3. Write `output_json`, mark the phase `succeeded`, and materialize rows into the domain tables.
4. Continue to the next phase.

Suggested delays:

| Phase | Delay | Visible effect |
| --- | ---: | --- |
| `source_recap` | 600 ms | Recap panel fills first. |
| `feature_map` | 900 ms | Feature/value prop cards appear. |
| `conversation_map` | 900 ms | Conversation rows appear. |
| `intent_classification` | 700 ms | Stage, intent, buyer role, and constraints fill in. |
| `landing_gaps` | 800 ms | Gap badges and suggested fixes appear. |
| `ad_groups` | 900 ms | Draft ad-group cards appear. |
| `creative_text` | 700 ms | Draft titles, descriptions, and visual prompts appear. |
| `monitoring_synthesis` | 700 ms | KPI rows and insight copy appear after fake deploy or seeded deploy. |

These delays are long enough to show progress but short enough that a full fallback replay completes in roughly 6-8 seconds.

### Realtime Behavior

The seeded path should not invent a separate realtime channel. It should rely on the same Supabase Realtime subscriptions as live extraction:

- Phase rail listens to `extraction_runs`.
- Review panels listen to `brand_features`, `conversations`, `landing_gaps`, and `ad_groups`.
- Creative page listens to `creative_variants`.
- Monitoring page listens to `deployments` and `performance_snapshots`.

If Realtime is unavailable, the UI should poll project tables every 2 seconds while the replay is active and show a small "syncing" indicator, not a blocking spinner.

## Seeded Extraction Content

Minimum rows after replay:

| Table | Minimum seeded rows | Notes |
| --- | ---: | --- |
| `extraction_runs` | 8 | One per canonical phase. Store fixture input/output and prompt version. |
| `brand_features` | 10 | Mix features, value props, proof points, objections, and use cases. |
| `conversations` | 8 | Include stage, intent type, buyer role, constraints, and source refs. |
| `landing_gaps` | 5 | Tie gaps to specific conversations where possible. |
| `ad_groups` | 4 | Status starts as `draft` or `approved` depending on reset mode. |
| `creative_variants` | 6 | At least one approved creative per approved ad group. |
| `human_reviews` | 4 | Seed a few review actions so audit/history UI is not empty. |
| `deployments` | 1 | Optional baseline fake deployment for monitoring rehearsal. |
| `performance_snapshots` | 6 | Story KPIs tied to approved creatives and ad groups. |

### Required Seeded Conversations

Include conversations that exercise future Pioneer labels:

- Stage: `problem_aware`; intent: `workflow_pain`; buyer role: `founder`; constraint: "Gmail only".
- Stage: `solution_compare`; intent: `migration_risk`; buyer role: `revenue_lead`; constraint: "import existing inbox labels".
- Stage: `vendor_evaluation`; intent: `proof_request`; buyer role: `customer_success`; constraint: "prove setup works before Friday".
- Stage: `pricing_check`; intent: `budget_validation`; buyer role: `operations`; constraint: "under 500 USD/month".
- Stage: `security_review`; intent: `trust_check`; buyer role: `operations`; constraint: "SOC 2 proof missing".

### Required Seeded Ad Groups

- `Inbox chaos to CRM follow-up`: based on founder workflow pain.
- `Friday setup promise`: based on timeline-constrained proof request.
- `Migration without losing labels`: based on switching and setup-path concerns.
- `Trust and pricing clarity`: based on compliance and budget validation gaps.

### Required Seeded Creatives

Each approved ad group needs at least:

- Title
- Description
- Creative angle
- `asset_type`
- `asset_prompt`
- `status`
- `target_url`

Seeded OpenAI-exportable creatives must obey title <= 50 characters, description/body <= 100 characters, and square image requirements if an asset URL is present.

At least two seeded creatives should intentionally be generic or gap-misaligned so monitoring can show why they underperform.

## Story KPI Fixtures

Seeded KPIs must encode the product thesis:

- Specific, time-bound angles outperform generic angles on CTR.
- A strong promise tied to an unresolved landing gap may get good CTR but weak CVR.
- Proof-heavy copy performs better for proof-seeking conversations.
- Pricing-check campaigns underperform if the landing page lacks pricing clarity.
- Migration-focused campaigns improve when copy includes setup path and comparison language.

Example seeded story:

| Ad group | Creative | KPI lesson |
| --- | --- | --- |
| `Friday setup promise` | "Live in Gmail by Friday" | High CTR because it matches the timeline constraint; CVR lags until setup proof is added. |
| `Inbox chaos to CRM follow-up` | "Stop losing founder follow-ups" | Balanced CTR/CVR because the pain and product promise are aligned. |
| `Trust and pricing clarity` | "Simple CRM for modern teams" | Lower CTR because the copy is generic and does not answer security or pricing objections. |
| `Migration without losing labels` | "Keep every Gmail label on import" | Better CVR because it resolves the migration constraint directly. |

Every `performance_snapshots` row should include `quality_score`, `insight`, and `recommended_action`.

## API / Server Boundaries

### Reset Endpoint

Endpoint:

```text
POST /api/demo/reset
```

Server-only behavior:

- Requires `ENABLE_DEMO_RESET=true`.
- Requires local/demo environment or an operator token.
- Uses service-role credentials only on the server.
- Deletes child rows for `demo_project_id` in FK-safe order.
- Reinserts baseline seed rows.
- Sends `demo/extraction.replay.requested` unless request body sets `replay = false`.
- Returns `{ project_id, demo_run_id, seed_version, replay_started }`.

The endpoint must never accept an arbitrary `project_id` from the browser unless it matches the configured demo project ID.

### Replay Endpoint

Endpoint:

```text
POST /api/demo/replay
```

Use this when data exists but the presenter wants to replay the phase rail:

- Clears `extraction_runs` and materialized extraction output for the demo project.
- Keeps base `projects` and `sources`.
- Sends `demo/extraction.replay.requested`.

### Fallback Selection

Env flags:

```text
DEMO_MODE=live|seeded|auto
ENABLE_DEMO_RESET=true|false
DEMO_PROJECT_ID=<uuid>
DEMO_SEED_VERSION=2026-05-16.worker-e.v1
```

Runtime rules:

- `live`: use providers; show provider errors and allow manual switch to seeded mode.
- `seeded`: skip providers and use fixtures.
- `auto`: try providers, then fall back to fixture phase if a provider call fails, times out, or returns invalid structured output.

## Provider Calls, Prompts, and Persistence

The seeded path must preserve the same audit shape as the live path:

- Live provider attempt rows still persist request metadata, selected model/provider, prompt version, status, and errors in `extraction_runs`.
- Fixture fallback rows persist `input_json` and `output_json` using the same Zod-compatible schema expected from live OpenAI output.
- Fixture `input_json` should include the prompt version that the live phase would have used, plus `provider_mode = seeded_fixture`.
- Fixture `output_json` should include enough source refs and rationale text that HITL review feels grounded, not like empty placeholder data.
- Prompt text itself may be stored as `prompt_version` plus a compact prompt snapshot; do not duplicate long prompts in every seeded row if spec 04 centralizes prompt templates.
- The fallback path must never silently overwrite a failed live run. It should preserve the failed run and create or update a separate fixture completion record for the same phase.

## UI States and Interactions

### Intake

- Show "Use demo project" action near the URL form.
- When clicked, route directly to `/projects/{demo_project_id}/review` and start replay.
- If the demo project already has fresh rows, offer "Open current demo" and "Reset and replay".

### Review

- Phase rail animates through queued/running/succeeded states.
- Rows appear progressively in the normal review panels.
- Fixture rows have subtle internal labels only where necessary, such as a debug tooltip or operator-only badge.
- The judge-facing UI should not say "mocked extraction" in the main content area. It can say "demo data" in operator-only areas.

### Creatives

- If fal.ai is unavailable, cards show the generated visual prompt and a seeded placeholder asset if available.
- Prompt-only fallback must be treated as a valid demo state, not an error.

### Monitoring

- The dashboard should show whether KPI rows are simulated for the hackathon demo, matching spec 08.
- A "Reset demo" control may be present only behind the operator/demo guard.

## Jobs / Realtime

- `demo/extraction.replay.requested`: deterministic replay of all extraction phases.
- `motive/extraction.phase.completed`: optional internal event emitted after each phase if spec 04 uses event chaining.
- `demo/reset.completed`: optional event for logs/analytics only.

The replay function should use deterministic event IDs or `demo_run_id` dedupe keys so a double-click does not create duplicate phase runs.

## Failure States

| Failure | Expected behavior |
| --- | --- |
| Supabase unavailable | Show blocking local setup error with `supabase start` and runbook pointer. Do not pretend reset worked. |
| Realtime unavailable | Fall back to polling and show "syncing" status. |
| Inngest Dev Server unavailable | Reset endpoint inserts baseline complete rows and returns `replay_started = false` with instructions to start Inngest. |
| OpenAI failure in `auto` mode | Persist failed live `extraction_runs` row, then write seeded fixture phase with `provider_mode = seeded_fixture`. |
| Tavily failure | Use seeded source text and record failure in `sources.metadata` or `extraction_runs.error`. |
| fal.ai failure | Persist prompt-only creative, set `asset_generation_status = "skipped"` or `"failed"` depending on the failure, and keep creative review usable. |
| Reset double-click | Second request returns current `demo_run_id` or cancels/restarts safely; no duplicate child rows. |
| Hosted remote reset requested without guard | Return 403. |

## Acceptance Criteria

- Given no provider keys, when a user opens the demo project, then extraction phases still appear progressively and materialize reviewable rows.
- Given `DEMO_MODE=seeded`, when the replay starts, then no Tavily, OpenAI, fal.ai, or Pioneer requests are made.
- Given `DEMO_MODE=auto` and an OpenAI phase fails, then the failed run is persisted and the fixture output completes the visible phase.
- Given the reset button is clicked, then the demo project returns to the baseline seed and replay starts in under 30 seconds.
- Given the monitoring page opens after seeded deploy, then KPI rows include coherent `quality_score`, `insight`, and `recommended_action` values tied to ad-group and creative quality.
- Given the reviewer edits or approves a seeded row, then the normal `human_reviews` write path records the action.
- Given a second reset request arrives while a replay is running, then the app does not duplicate domain rows.

## Smoke Checklist

### Local setup

1. `supabase start`
2. `supabase db reset`
3. `pnpm dev` for the Next.js app
4. `npx inngest-cli@latest dev`
5. Set `DEMO_MODE=seeded`, `ENABLE_DEMO_RESET=true`, and `DEMO_PROJECT_ID`

### Seeded demo path

1. Open the app.
2. Click "Use demo project".
3. Confirm the review page opens immediately.
4. Confirm the review phase rail advances through the six extraction/HITL phases.
5. Confirm recap, features, conversations, intents/stages, landing gaps, and ad groups appear without refreshing.
6. Edit one conversation and approve it.
7. Approve one ad group.
8. Open Creatives and confirm at least one title, description, angle, and visual prompt exists.
9. Fake deploy.
10. Open Monitoring and explain one KPI insight tied to a specific creative.
11. Click "Reset demo".
12. Confirm the same project returns to baseline and replay starts again.

### Auto fallback path

1. Set `DEMO_MODE=auto`.
2. Disable or blank one provider key locally.
3. Run extraction.
4. Confirm failed provider state is persisted.
5. Confirm seeded fixture output fills the visible demo path.

## Demo Script

1. "I can start with a live brand URL, but for the judging room I also have a seeded brand so the workflow is repeatable."
2. Click "Use demo project."
3. "The review workspace opens immediately. The phase rail is not a spinner; rows land as each extraction phase completes."
4. Wait as recap, features, conversations, intent labels, and landing gaps appear.
5. Edit one conversation constraint and approve it.
6. "The same persisted rows feed ad groups and creatives."
7. Open Creatives, show one prompt-only fallback or seeded asset.
8. Fake deploy.
9. Open Monitoring.
10. "These KPIs are simulated for the hackathon, but they are not random. The high CTR here comes from matching a timeline constraint; the weaker conversion points to a landing-page proof gap."
11. If needed, click "Reset demo" and show the replay can restart.

## Implementation Notes

- Branch: `codex/spec-9-seeded-demo-resilience`.
- Core deterministic fixture/orchestration module: `apps/web/src/lib/motive/demo.ts`.
- Supabase adapter: `apps/web/src/lib/motive/supabase-demo.ts`.
- Guarded endpoints:
  - `POST /api/demo/reset`
  - `POST /api/demo/replay`
- Replay job: Inngest function `seeded-demo-extraction-replay` triggered by `demo/extraction.replay.requested`.
- Operator controls:
  - Intake `Use demo project` calls reset + replay and routes to the seeded review page.
  - Monitoring `Reset demo` calls reset + replay and routes back to review.
  - `pnpm demo:reset` calls the same server reset endpoint.
- Env:
  - `DEMO_MODE=live|seeded|auto`
  - `ENABLE_DEMO_RESET=true|false`
  - `DEMO_PROJECT_ID=00000000-0000-0000-0000-000000000001`
  - `DEMO_SEED_VERSION=2026-05-16.worker-e.v1`
  - `DEMO_OPERATOR_TOKEN` optional hosted guard.
- Deterministic fallback selection is wired for extraction, ad-group generation, creative generation, and deploy/monitoring synthesis. `seeded` skips providers; `auto` falls back when OpenAI is not configured.

## Open Questions / Risks

- Concrete seed fixture and reset endpoint implementation are now owned by Worker E / spec 09 in the branch above.
- Should the hosted demo use Supabase preview branches or a long-lived hosted project with app-level reset? Recommendation: use a long-lived hosted project with scoped soft reset for judging.
- Should the seeded visual asset be a local static image, a Supabase Storage object, or just an asset prompt? Recommendation: include prompt-only as P0 and one stored placeholder asset as P1.
- If other workers choose different enum names, update fixture phase/status values before implementation.

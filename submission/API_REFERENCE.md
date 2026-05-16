# API Reference

All routes are implemented by the Next.js app in `apps/web/src/app/api`.

## Project Intake

### `POST /api/projects`

Creates a project from a brand URL plus optional text/product context and starts the demo workflow.

Typical input fields:

```json
{
  "brand_url": "https://example.com",
  "extra_context": "Positioning notes, ICP notes, or product context",
  "demo_mode": true
}
```

Persists:

- `projects`
- `sources`
- optional `product_feeds` / `product_feed_items`
- extraction request metadata

Primary consumer: intake workbench.

### `GET /api/projects/[projectId]`

Returns project-level state for workspace panels and source status.

## Demo Utilities

### `POST /api/demo/reset`

Resets the deterministic demo project. Guarded by demo configuration:

- `ENABLE_DEMO_RESET=true`
- local/demo mode or `DEMO_OPERATOR_TOKEN`
- fixed `DEMO_PROJECT_ID`

### `POST /api/demo/replay`

Requests replay of seeded extraction events for the demo project.

## Inngest

### `/api/inngest`

Registers and serves Inngest functions for background workflow execution.

Local dev server command:

```sh
npx pnpm@11.1.2 inngest:dev
```

## Review And Extraction

### `GET /api/projects/[projectId]/review-data`

Returns the review workspace data:

- extraction runs
- sources
- human reviews
- brand features
- conversations
- landing gaps
- ad groups
- creative variants
- campaigns

Primary consumers: review workspace and creative grid.

### `POST /api/projects/[projectId]/extract`

Requests extraction for a project. The live path uses OpenAI through background orchestration. Demo modes may return or enqueue deterministic fixture output.

### `POST /api/projects/[projectId]/reviews`

Applies a human review action to a supported entity.

Typical body:

```json
{
  "entity_type": "conversation",
  "entity_id": "00000000-0000-0000-0000-000000000000",
  "action": "edit",
  "patch": {
    "stage": "consideration",
    "intent_type": "integration_check"
  },
  "comment": "Tighter label for the buyer's actual question."
}
```

Supported actions:

- `approve`
- `edit`
- `reject`
- `enrich`

Supported entities:

- `extraction_run`
- `brand_feature`
- `conversation`
- `landing_gap`
- `ad_group`
- `creative_variant`

Returns the updated entity and the inserted `human_review` row.

## Ad Groups

### `POST /api/projects/[projectId]/ad-groups/generate`

Generates campaign and ad-group proposals from approved review data.

Inputs:

- approved conversations
- approved brand features
- approved landing gaps
- optional product-feed context

Persists:

- `campaigns`
- `ad_groups`
- extraction/audit metadata

## Creatives

### `POST /api/projects/[projectId]/creatives`

Generates creative variants for approved ad groups.

Live provider path:

- OpenAI creates title, description, creative angle, target URL, and asset prompt.
- fal.ai may create media assets when `FAL_KEY` is configured.

Fallback path:

- prompt-only creative variants are persisted when media generation is skipped.

Persists:

- `creative_variants`
- provider request/response JSON
- generation status and errors

## Deployment And Monitoring

### `POST /api/projects/[projectId]/deploy`

Fake deploys approved creatives into a campaign package. This deliberately avoids real ad-platform publishing during the hackathon while preserving the launch and monitoring flow.

Persists:

- `deployments`
- `performance_snapshots`
- monitoring synthesis output

### `GET /api/projects/[projectId]/deploy`

Returns deployment and monitoring data for the Monitoring page.

Primary consumer: monitoring dashboard.

## Error Handling Notes

- Missing required environment values produce structured env-validation errors.
- Missing OpenAI configuration in non-live demo paths can fall back to deterministic outputs.
- Extraction failures are phase-scoped and persisted.
- Review patch validation rejects unsupported fields before writing.
- Demo reset never accepts arbitrary project IDs.

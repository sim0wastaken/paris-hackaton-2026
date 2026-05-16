# Spec 05 - Live HITL Review Workspace

Date: 2026-05-16
Status: Draft
Owner: Worker C

## Problem / User Value

The review workspace is where Motive stops looking like a batch AI report and starts looking like a live campaign operating room. Eight extraction phases can take long enough to hurt a hackathon demo, so the workspace must turn latency into visible progress: the phase rail advances, rows arrive progressively, and the user can approve, edit, reject, or enrich useful material as soon as it appears.

The user value is confidence and control. A marketer or founder can see exactly what OpenAI extracted from the brand/source context, correct it before it becomes campaign structure, and leave an audit trail that later becomes Pioneer training data.

This spec follows `docs/superpowers/specs/SHARED_CONTRACT.md` for canonical labels, phase ownership, and OpenAI Ads-compatible downstream fields.

## Scope

Build the project review route and client workspace for:

- A sticky phase rail driven by `extraction_runs`.
- Live panels for `source_recap`, `brand_features`, `conversations`, intent/stage metadata, `landing_gaps`, and draft `ad_groups`.
- Progressive row arrival through Supabase Realtime.
- Inline loading per phase. No whole-page spinner after the initial route shell is rendered.
- Review actions: approve, edit, reject, enrich.
- A durable `human_reviews` write for every human action.
- Entity `review_status` updates on `brand_features`, `conversations`, `landing_gaps`, and generated `ad_groups`.
- Demo-friendly tables/cards that make a judge see the workflow building itself.

## Non-goals

- Real ad-platform deployment.
- Pioneer inference, fine-tuning, or Adaptive Inference.
- A full spreadsheet clone with complex keyboard navigation.
- Multi-reviewer assignment, comments threads, or enterprise workflow approvals.
- Deep analytics or monitoring visuals. Those belong to Spec 08.
- Creative generation. This workspace can show draft ad-group ideas, but creative variants are generated later.

## Research Notes

- Supabase Realtime Postgres Changes supports subscribing to `INSERT`, `UPDATE`, and `DELETE` events with `schema`, `table`, and optional `filter` arguments through `supabase.channel(...).on("postgres_changes", ...)`. The HITL client should subscribe to project-filtered rows and merge payloads into local state. Source: [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- Supabase notes that Realtime checks database access per subscribed user and that Postgres Changes can become a bottleneck at scale. For the hackathon, project-scoped filters are fine; avoid broad `event: "*"` subscriptions on every table unless needed. Source: [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- Supabase recommends removing unused channels to preserve Realtime/database performance. Client components should call `supabase.removeChannel(channel)` or unsubscribe on unmount. Source: [Supabase JavaScript removeChannel](https://supabase.com/docs/reference/javascript/removechannel).
- Next.js App Router pages/layouts are Server Components by default; Client Components are for state, effects, event handlers, browser APIs, and realtime subscriptions. Source: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- The `"use client"` directive marks the client-server boundary, and props passed into Client Components must be serializable. Source: [Next.js use client directive](https://nextjs.org/docs/app/api-reference/directives/use-client).
- Next.js Server Actions/Server Functions are server-side async functions for mutations; Client Components can invoke imported server actions or use route handlers. Use these for review writes so service credentials and provider keys never enter the browser. Source: [Next.js Updating Data](https://nextjs.org/docs/app/getting-started/updating-data).
- TanStack Table v8 has an official editable-data example using `table.options.meta.updateData(rowIndex, columnId, value)` on blur. It is useful for the conversation grid where rows have stage, intent, buyer role, and constraints. Source: [TanStack Table editable data example](https://tanstack.com/table/v8/docs/framework/react/examples/editable-data).
- WAI-ARIA APG warns that an interactive `grid` requires managed focus and every data cell must be focusable or contain focusable content. For hackathon speed, use semantic tables with clear controls or cards unless a full grid interaction model is intentionally implemented. Source: [W3C WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

## Product Shape

The review page should open immediately after intake or extraction start:

```text
/projects/:projectId/review
  sticky phase rail
  source recap panel
  feature/value prop/use case cards
  conversation table
  intent/stage chips inside conversation rows
  landing gap cards/table
  draft ad-group idea cards
  right-side or inline review detail drawer
```

The page should feel alive:

- New rows get a short "new" highlight and are announced in an `aria-live="polite"` region.
- Completed phases show row counts and success state.
- Running phases show compact inline skeleton rows inside their panel.
- Failed phases show a retry affordance and leave other panels usable.
- Empty phases show an inline waiting state, not a modal or page-blocking overlay.

## Data Model Touched

Read:

- `projects`: workspace identity, brand URL/name, project status.
- `sources`: source status and names for source references.
- `extraction_runs`: phase status, model, timestamps, output summary, errors.
- `brand_features`: extracted features, value props, USPs, use cases, proof points, objections.
- `conversations`: buying conversation text, stage, intent type, buyer role, constraints, source refs.
- `landing_gaps`: gap type, description, suggested fix, linked conversation.
- `ad_groups`: draft ad-group ideas if extraction phase produced proposals.
- `human_reviews`: existing review actions, useful for reload state and future audit display.

Write:

- `human_reviews`: one row per approve/edit/reject/enrich action.
- Source recap review actions use the recap `extraction_runs` row as their entity when no first-class recap table exists.
- `brand_features.review_status`.
- `conversations.review_status`.
- `landing_gaps.review_status`.
- `ad_groups.status` for draft ad groups reviewed in this workspace.

Expected review status values:

- `pending`: model output has not been reviewed.
- `approved`: user accepted row for downstream use.
- `edited`: user changed row but has not explicitly approved, unless using "Save and approve".
- `rejected`: row must not feed ad groups, creatives, fake deploy, monitoring, or future Pioneer export except as a negative review example.

Expected `human_reviews` write contract:

```ts
type HumanReviewAction = "approve" | "edit" | "reject" | "enrich";

type HumanReviewRow = {
  id: string;
  project_id: string;
  entity_type:
    | "extraction_run"
    | "brand_feature"
    | "conversation"
    | "landing_gap"
    | "ad_group";
  entity_id: string;
  action: HumanReviewAction;
  before_json: Record<string, unknown>;
  after_json: Record<string, unknown>;
  comment: string | null;
  reviewer: string; // "demo_user" until auth is real
  created_at: string;
};
```

`before_json` must be the persisted row before the mutation. `after_json` must be the persisted row after the mutation, not just the submitted patch. This makes the future Pioneer dataset reconstructable.

## API / Server Boundaries

Use a Server Component page for the initial snapshot:

- `apps/web/src/app/projects/[id]/review/page.tsx` loads the project, phase statuses, and current entity rows.
- It passes serializable initial data into a Client Component such as `LiveReviewWorkspace`.
- It does not pass Supabase clients, functions, class instances, or non-serializable values as props.

Use a Client Component for live behavior:

- `LiveReviewWorkspace` is marked `"use client"`.
- It owns realtime subscriptions, optimistic UI state, row highlight timers, inline edit state, and action pending states.
- It receives a publishable Supabase browser client only through the established client helper from Spec 01.

Use server actions or route handlers for mutations:

- `reviewEntityAction(input)` writes `human_reviews` and updates the target entity in one server-side transaction.
- `enrichEntityAction(input)` is optional. If enabled, it runs on the server and may call OpenAI. Provider inputs/outputs must be persisted in the review audit trail.
- The browser never receives `service_role`, OpenAI, Tavily, fal.ai, or other secret keys.

Recommended route/action boundaries:

```text
GET /projects/:id/review
  Server Component fetches initial project snapshot.

reviewEntityAction
  Input: projectId, entityType, entityId, action, patch?, comment?, expectedUpdatedAt?
  Output: updated entity row, human_review row.

enrichEntityAction
  Input: projectId, entityType, entityId, instruction, expectedUpdatedAt?
  Output: proposed or applied updated entity row, human_review row.
```

If the implementation uses API routes instead of Server Actions, keep the same input/output contract and validate entity ownership on the server.

## Realtime Model

Subscribe after the initial snapshot is rendered.

Primary channel:

```ts
const channel = supabase
  .channel(`project:${projectId}:hitl`)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "extraction_runs", filter: `project_id=eq.${projectId}` },
    handleExtractionRunChange,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "brand_features", filter: `project_id=eq.${projectId}` },
    handleBrandFeatureChange,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "conversations", filter: `project_id=eq.${projectId}` },
    handleConversationChange,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "landing_gaps", filter: `project_id=eq.${projectId}` },
    handleLandingGapChange,
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "ad_groups", filter: `project_id=eq.${projectId}` },
    handleAdGroupChange,
  )
  .subscribe();
```

Cleanup on unmount:

```ts
return () => {
  supabase.removeChannel(channel);
};
```

Client merge rules:

- Dedupe by row `id`.
- Sort by phase order, then `created_at`.
- Treat `UPDATE` payloads as authoritative.
- Ignore `DELETE` for V1 unless a row is explicitly removed; rejected rows should remain visible but dimmed.
- If Realtime disconnects, show a small stale indicator and offer manual refresh.

The extraction worker owns inserts into domain tables. The review client only owns review mutations.

## UI States and Interactions

### Phase Rail

Display these phases, in this order:

1. `source_recap`
2. `feature_map`
3. `conversation_map`
4. `intent_classification`
5. `landing_gaps`
6. `ad_groups`
7. `creative_text` as a downstream disabled/next step
8. `monitoring_synthesis` as a downstream disabled/next step

Per phase show:

- Status: `queued`, `running`, `succeeded`, `failed`, `skipped`.
- Row count materialized into the panel.
- Last updated time.
- Error badge and retry affordance if failed.

The rail should remain visible while scrolling on desktop. On mobile, use a horizontal rail above the panels.

### Source Recap Panel

Purpose: gives the judge immediate context before rows appear.

Contents:

- Brand summary.
- ICP / buyer.
- Category and offer.
- Proof points and constraints.
- Source references.

Interactions:

- Edit summary fields.
- Approve recap as useful context.
- Enrich with user note if a key positioning fact is missing.

Persistence:

- If recap is stored only in `extraction_runs.output_json`, the review action writes `human_reviews` with `entity_type = "extraction_run"` and `entity_id` set to the recap run ID.
- There is no separate recap `review_status` requirement for V1 unless Spec 02 adds a first-class recap table.
- Do not block ad-group generation on source recap approval.

### Brand Feature Cards

Use compact cards grouped by `type`:

- `feature`
- `value_prop`
- `usp`
- `use_case`
- `proof_point`
- `objection`

Interactions per card:

- Approve.
- Edit title/description/type/source refs.
- Reject.
- Enrich with a one-line instruction, for example "make this proof point more concrete".

Approved and edited features can feed ad-group generation if `review_status = "approved"`. Edited-but-not-approved features must not feed Spec 06.

### Conversation Table

Use TanStack Table only if the implementation needs sorting/filtering and inline editable cells quickly. Otherwise a semantic table is enough. Recommended for V1:

- Semantic table on desktop with visible action buttons.
- Stacked row cards on mobile.
- Inline edit drawer for multi-field edits to avoid building a full ARIA spreadsheet.

Columns:

- Conversation text.
- Stage.
- Intent type.
- Buyer role.
- Constraints summary.
- Linked features / source refs.
- Review status.
- Actions.

Interactions:

- Approve a row.
- Edit conversation text, stage, intent type, buyer role, constraints.
- Reject noisy/generic rows.
- Enrich row with a user instruction, producing a more specific conversation or constraints.

Accessibility:

- Use real `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, and action buttons with row-specific labels.
- If using ARIA `grid`, implement focus movement and Enter/F2 editing behavior from APG. If that cannot be implemented within hackathon time, do not use ARIA `grid`.
- Do not hide edit/approve/reject actions behind hover-only controls.

### Intent / Stage Metadata

Intent/stage is visually part of the conversation row, even if `intent_classification` completes after the initial conversation row appears.

State behavior:

- A new conversation can appear with stage/intent skeleton chips.
- When `intent_classification` updates the row, fill chips in place.
- If classification fails, leave conversation text reviewable and show "intent pending" inline.

### Landing Gap Panel

Display gap cards or a compact table with:

- Gap type.
- Description.
- Suggested fix.
- Linked conversation.
- Severity/confidence if present in extraction output.
- Review status.

Interactions:

- Approve gap for use in ad-group rationale and later creative/monitoring story.
- Edit suggested fix.
- Reject weak or irrelevant gaps.
- Enrich a gap with user note.

Approved landing gaps should be available to Spec 06 as grouping context and to Spec 08 as performance story signals.

### Draft Ad-Group Ideas

Extraction may produce early ad-group ideas, but Spec 06 is the authoritative generation step.

Display draft cards:

- Name.
- Rationale.
- Linked conversation count.
- Status.
- Review status/action controls.

Behavior:

- If ad-group ideas arrive during extraction, mark them as `draft`.
- Let the user approve/edit/reject them.
- Spec 06 may regenerate canonical ad groups from approved extraction rows; existing approved draft ideas can be passed as hints, not as mandatory output.

## Review Actions

### Approve

User clicks Approve on a row.

Server behavior:

1. Fetch row by `project_id`, `entity_type`, `entity_id`.
2. Capture `before_json`.
3. Update `review_status` to `approved` or `ad_groups.status` to `approved`.
4. Capture `after_json`.
5. Insert `human_reviews` with `action = "approve"`.
6. Return updated row and review row.

UI behavior:

- Optimistically show approved state.
- Disable only the clicked row action while pending.
- Roll back if the server returns an error.

### Edit

User edits fields and chooses either Save or Save and approve.

Server behavior:

- Validate allowed fields per entity type.
- Require non-empty title/text/description after edit.
- Write the entity update and `human_reviews` row atomically.
- Set `review_status = "edited"` for Save.
- Set `review_status = "approved"` for Save and approve.

UI behavior:

- Preserve unsaved draft if mutation fails.
- Show field-level validation errors inline.
- Do not block other panels while one row is saving.

### Reject

User rejects a row.

Server behavior:

- Set row status to `rejected`.
- Insert `human_reviews` with before/after snapshots and optional comment.

UI behavior:

- Keep the row visible but dimmed.
- Provide Undo only if it maps to an approve/edit action and writes a new `human_reviews` row. Do not delete the original review event.

### Enrich

User adds a short instruction to improve or expand a row.

V1 default:

- Manual enrich: user edits the row with a comment. No provider call.

Optional AI enrich:

- Server sends the current row, source recap, approved nearby rows, and user instruction to OpenAI.
- The model returns the same entity schema, not free text.
- The server persists provider input/output in `human_reviews.after_json.provider_trace` until a dedicated provider log table exists.
- The server updates the target row only after schema validation.

UI behavior:

- Enrich opens a small inline form or drawer.
- Show row-level pending state.
- On success, highlight changed fields.
- On failure, keep the instruction text so the user can retry manually.

## Provider Calls and Persistence

The core HITL workspace requires no provider calls. It consumes rows produced by Spec 04.

Only `enrich` may call OpenAI. If enabled:

- Use the same Zod schema as the edited entity.
- Persist request input, response output, model, prompt version, and error if any.
- Persist the human instruction in `human_reviews.comment`.
- Never apply an AI-enriched row without writing a `human_reviews` action.

Suggested enrich prompt shape:

```text
System: You improve a single reviewed Motive campaign-intelligence row. Return only the requested schema. Preserve factual grounding and source references. Do not invent product claims.

User input:
- Project summary
- Current entity type and JSON
- Approved related conversations/features/gaps
- Human instruction
- Required schema
```

## Failure States

- Extraction phase failed: show the phase as failed, display the error summary, keep completed rows interactive, and expose retry for that phase if Spec 04 supports it.
- Realtime unavailable: show "Live updates paused", keep initial data usable, and allow manual refresh.
- Mutation conflict: if `expectedUpdatedAt` is stale, refetch row and ask the user to reapply edit.
- Review write failed: rollback optimistic state and keep the edit draft.
- Entity update succeeded but audit insert failed: server must roll back the entire transaction. Never mutate an entity without audit.
- AI enrich failed: keep the user instruction, show retry/manual edit options, and persist provider error only if a provider request was actually sent.
- Empty extraction result: panel says no rows were found and links back to sources; seeded demo path should still be able to populate rows.
- RLS/auth issue: show permission error at row or page level; do not expose raw SQL errors.

## Acceptance Criteria

- The review page renders a usable shell before all extraction phases finish.
- The page never uses a whole-page spinner after route shell render; waiting is shown inline per phase/panel.
- `extraction_runs` changes update the phase rail without refresh.
- Inserted `brand_features`, `conversations`, `landing_gaps`, and `ad_groups` visibly appear while extraction is running.
- Intent/stage metadata can fill into existing conversation rows after those rows first appear.
- User can approve, edit, reject, and enrich at least one feature, one conversation, one landing gap, and one ad-group idea.
- Every review action inserts exactly one `human_reviews` row with before/after snapshots.
- Entity statuses update consistently with review actions.
- Approved rows are clearly distinguished from pending/rejected rows.
- Rejected rows are not included in downstream ad-group generation.
- The UI remains usable when one phase fails.
- Realtime subscription is cleaned up on unmount.
- The golden demo path can approve enough rows to feed Spec 06 and Spec 07 without leaving the review workspace.

## Demo Script

1. Submit a brand URL/context from intake and route immediately to `/projects/:id/review`.
2. Point to the phase rail: source recap is running, later phases are queued.
3. Source recap appears. Approve the recap/context.
4. Feature cards stream in. Edit one value prop to be sharper, then Save and approve.
5. Conversation rows appear. Approve two strong rows and reject one generic row.
6. Intent/stage chips fill into the already visible conversation rows.
7. Landing gaps appear. Approve one gap tied to a proof/pricing/setup concern.
8. Use Enrich on a conversation or gap with a short instruction; show the audit action persisted.
9. Draft ad-group ideas appear. Approve or leave them as hints.
10. Move to ad-group generation with a visible set of approved rows.

## Open Questions / Risks

- Should source recap be a first-class reviewable entity, or is `extraction_runs.output_json` enough for V1?
- Does Spec 02 include `reviewer` on `human_reviews`, or should V1 use `actor_id` / auth user if available?
- Is `ad_groups.status = "approved"` enough for review, or does `ad_groups` also need `review_status` for symmetry?
- If AI enrich is enabled, where should provider trace live long term: `human_reviews.after_json.provider_trace`, `extraction_runs`, or a future provider call log?
- TanStack Table is useful for fast editable grids, but full ARIA grid behavior is expensive. Default to semantic table/cards unless row count or sorting needs justify it.

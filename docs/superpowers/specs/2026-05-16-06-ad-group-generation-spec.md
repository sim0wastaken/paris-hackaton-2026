# Spec 06 - Ad Group Generation

Date: 2026-05-16
Status: Draft
Owner: Worker C

## Problem / User Value

Motive needs to turn validated extraction rows into a campaign structure a user can immediately understand, approve, and use for creative generation. Raw features, conversations, intents, and landing gaps are useful, but the demo becomes actionable when they become ad groups with names, rationales, linked conversations, and reviewable status.

The user value is fast campaign architecture without losing control. The model proposes tight groups from approved evidence only; the user can regenerate, edit, enrich, approve, or reject before creatives are generated.

This spec follows `docs/superpowers/specs/SHARED_CONTRACT.md`. It owns canonical `campaigns` and OpenAI-compatible `ad_groups`.

## Scope

Build the generation contract and review flow for `campaigns` and `ad_groups`:

- Inputs are approved extraction rows only:
  - `conversations.review_status = "approved"`
  - `brand_features.review_status = "approved"`
  - `landing_gaps.review_status = "approved"`
- Generate one default campaign per project unless the user explicitly asks for multiple:
  - `name`
  - `objective`: `Clicks` by default
  - `lifetime_spend_limit_micros`: default `5000000`
  - `countries`: default `["US"]`
  - `custom_instruction`
- Generate OpenAI-compatible ad groups with:
  - `name`
  - `context_hints`
  - `billing_event_type`
  - `max_bid_micros`
  - `rationale`
  - `conversation_ids`
  - `status`
  - optional feature/gap links in JSONB metadata if Spec 02 supports it.
- Use OpenAI structured output as primary path.
- Provide deterministic grouping fallback when OpenAI is unavailable.
- Persist all model input/output and materialized ad groups.
- Let users approve/edit/reject/regenerate/enrich groups before creative generation.
- Expose a strong demo path from approved HITL rows to approved ad groups.

## Non-goals

- Real Google Ads, Meta, TikTok, or LinkedIn campaign creation.
- Live OpenAI Ads API mutation. This spec must still produce OpenAI-compatible campaign/ad-group payloads for fake deploy and bulk/API export.
- Keyword match types. OpenAI ad groups use context hints, not keyword clusters.
- Creative copy/image generation. Future video concepts may be stored for non-OpenAI channels, but v1 OpenAI Ads export is image/chat-card only and belongs to Spec 07.
- Monitoring and KPI generation. That belongs to Spec 08.
- Pioneer classification or training. Pioneer uses this data after V1.
- Multi-channel planning. V1 creates one OpenAI-compatible campaign workspace with ad groups.

## Research Notes

- OpenAI Structured Outputs should be preferred over JSON mode when available because they provide schema adherence, not just valid JSON. Source: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- OpenAI Responses API examples show `openai.responses.parse` with `zodTextFormat(...)` and `response.output_parsed`; Chat Completions examples show `zodResponseFormat(...)`. V1 can use either, but should standardize with the provider wrapper from Spec 04. Source: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- OpenAI docs show JSON Schema output with `strict: true`, required fields, and `additionalProperties: false`. Ad-group generation should use that strict contract or Zod helper equivalents. Source: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- Next.js Server Components should keep data fetching and secrets on the server; Client Components are for interactivity. OpenAI calls and Supabase privileged writes must stay in server actions, route handlers, or Inngest jobs. Source: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- Next.js Server Actions are server-side async functions for mutations and can be invoked from Client Components through event handlers or forms. This fits approve/edit/regenerate actions. Source: [Next.js Updating Data](https://nextjs.org/docs/app/getting-started/updating-data).
- Supabase Realtime can subscribe to `ad_groups` inserts/updates with a project filter, so generated groups can appear in the existing HITL workspace or a dedicated ad-group panel. Source: [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- OpenAI Ads Manager structures campaigns around campaigns, ad groups, and ads. Ad groups represent themes, intents, and context hint clusters; bulk upload expects context hints as a JSON array. Sources: [OpenAI Launch Campaigns](https://help.openai.com/es-419/articles/20001209-launch-campaigns) and [OpenAI Bulk Upload Campaign Schema Checklist](https://help.openai.com/en/articles/20001218).

## Product Principle

Ad groups are not another model brainstorm. They are the first campaign structure created from reviewed evidence.

Every generated group must answer:

- What common conversation theme does this target?
- Which approved conversations prove the theme exists?
- Which approved features/proof points support the message?
- Which approved landing gaps should creatives or monitoring account for?
- Why is this group distinct from the other groups?

If a group cannot answer those questions, it should not be materialized.

## Inputs

The generation service receives a project-scoped snapshot:

```ts
type AdGroupGenerationInput = {
  project: {
    id: string;
    name: string;
    brand_url: string;
    extra_context?: string | null;
  };
  source_recap?: {
    summary: string;
    category?: string;
    icp?: string;
    offer?: string;
    constraints?: string[];
  };
  campaign_defaults: {
    objective: "Clicks" | "Views";
    lifetime_spend_limit_micros: number;
    countries: string[];
    custom_instruction?: string;
  };
  approved_conversations: Array<{
    id: string;
    text: string;
    stage: string;
    intent_type: string;
    buyer_role: string;
    constraints_json: Record<string, unknown>;
    source_refs: unknown;
  }>;
  approved_brand_features: Array<{
    id: string;
    type: "feature" | "value_prop" | "usp" | "use_case" | "proof_point" | "objection";
    title: string;
    description: string;
    source_refs: unknown;
  }>;
  approved_landing_gaps: Array<{
    id: string;
    conversation_id: string | null;
    gap_type: string;
    description: string;
    suggested_fix: string;
  }>;
  approved_product_feed_items?: Array<{
    id: string;
    title: string;
    description?: string;
    price?: string;
    availability?: string;
    product_type?: string;
  }>;
  existing_ad_groups: Array<{
    id: string;
    name: string;
    rationale: string;
    conversation_ids: string[];
    status: string;
  }>;
};
```

Hard gates:

- If fewer than 2 approved conversations exist, do not call OpenAI by default. Show a targeted empty state asking the user to approve at least two conversation rows, with an override only for seeded demos.
- Rejected and pending rows must not appear in the prompt input.
- Edited rows must feed generation only after approval.
- Draft ad-group ideas from extraction may be passed as hints only if approved or if explicitly marked as "model hint, not reviewed evidence".

## Output Schema

OpenAI must return a strict object:

```ts
type AdGroupGenerationOutput = {
  campaign: {
    name: string;
    objective: "Clicks" | "Views";
    lifetime_spend_limit_micros: number;
    countries: string[];
    custom_instruction: string;
    rationale: string;
  };
  ad_groups: Array<{
    name: string;
    rationale: string;
    context_hints: string[];
    billing_event_type: "click" | "view";
    max_bid_micros: number;
    conversation_ids: string[];
    linked_feature_ids: string[];
    linked_landing_gap_ids: string[];
    linked_product_feed_item_ids: string[];
    status: "draft";
    confidence: number; // 0..1
  }>;
  rejected_conversation_ids: Array<{
    conversation_id: string;
    reason: string;
  }>;
};
```

Validation rules before persistence:

- Campaign `name` is at least 3 characters and unique inside the project.
- Campaign `objective` is `Clicks` or `Views`.
- Campaign `lifetime_spend_limit_micros` is at least `1000000`.
- Campaign `countries` is a non-empty country-code array and defaults to `["US"]`.
- Ad group `name` is at least 3 characters, human-readable, and not generic.
- `context_hints` is a non-empty JSON array of distinct phrases. Each phrase should be broad enough for semantic targeting but specific enough to reflect approved conversations.
- `billing_event_type` defaults to `click` for `Clicks` campaigns and `view` for `Views` campaigns.
- `max_bid_micros` is positive and defaults to `3000000` unless user changes it.
- `rationale` is 1-3 sentences and references the shared intent/conversation theme.
- `conversation_ids` contains only approved conversation IDs from input.
- Each group has at least one linked conversation.
- Prefer 2-5 groups for the demo; never create more groups than approved conversations.
- One conversation can appear in more than one group only if the rationale explains the overlap. Default is one primary group per conversation.
- `linked_feature_ids` and `linked_landing_gap_ids` must reference approved rows only.
- `linked_product_feed_item_ids` must reference approved product rows only; keep it empty for the B2B SaaS demo path.
- `status` is always `draft` on generation. Human approval changes it to `approved`.

## Prompt Contract

System prompt:

```text
You are Motive's campaign structure planner. Create concise ad groups from approved, human-reviewed campaign intelligence only. Group conversations by shared buying context, intent, constraint, or landing-page need. Do not invent unprovided product claims. Do not use pending or rejected evidence. Return only the requested schema.
```

User prompt sections:

```text
Project:
- Name
- Brand URL
- Source recap

Approved conversations:
- id
- text
- stage
- intent_type
- buyer_role
- constraints_json

Approved brand features:
- id
- type
- title
- description

Approved landing gaps:
- id
- linked conversation id
- gap_type
- description
- suggested_fix

Approved product feed items, if present:
- id
- title
- description
- price
- availability
- product_type

Existing ad groups:
- id
- name
- rationale
- linked conversation ids
- status

Instructions:
- Produce 2-5 ad groups unless the approved evidence supports fewer.
- Each ad group must target one clear conversation theme.
- Include only approved conversation ids.
- Include product feed item ids only when the ad group is explicitly product/shopping oriented.
- Generate context_hints as JSON-array-ready strings, not comma-separated text.
- Use campaign custom_instruction to bias ad-group generation toward the approved strategic focus.
- Prefer specificity over broad channel or persona labels.
- Avoid duplicates and near-duplicates.
- Use names that can become creative briefs.
- Explain why each group exists and why its conversations belong together.
```

Prompt examples for name style:

- Good: `Proof-seeking CRM switchers`
- Good: `Friday setup urgency`
- Good: `Pricing clarity evaluators`
- Bad: `General awareness`
- Bad: `Business owners`
- Bad: `Features`

## Deterministic Fallback

Use fallback when:

- `OPENAI_API_KEY` is missing.
- OpenAI returns invalid schema after one repair attempt.
- The provider times out during demo.
- The user selects seeded/demo mode.

Fallback algorithm:

1. Load approved conversations.
2. Normalize each row into grouping keys:
   - `intent_type`
   - `stage`
   - `buyer_role`
   - strongest constraint type from `constraints_json`
   - linked landing gap type if present
3. Prefer grouping by `intent_type + strongest constraint` when at least two rows match.
4. Otherwise group by `stage + buyer_role`.
5. For singleton leftovers, create a group only if the conversation has an approved landing gap or strong constraint; otherwise attach it to the nearest group by stage.
6. Name groups using templates:
   - `{constraint} {intent_type}` -> `Friday setup urgency`
   - `{gap_type} {stage}` -> `Pricing clarity evaluators`
   - `{buyer_role} {intent_type}` -> `Ops switcher proof`
7. Build rationale from actual row fields:
   - "Groups {n} approved conversations about {intent_type} where {buyer_role} buyers need {constraint/gap} before moving forward."

Fallback output must use the same validation and persistence path as OpenAI output.

## Persistence

Every generation attempt creates an `extraction_runs` row:

```ts
{
  project_id,
  phase: "ad_groups",
  model: "openai:<model>" | "deterministic:fallback",
  prompt_version: "ad_groups_v1",
  input_json,
  output_json,
  status: "queued" | "running" | "succeeded" | "failed",
  error
}
```

Materialize each valid output into `ad_groups`:

```ts
{
  id,
  project_id,
  campaign_id,
  name,
  rationale,
  context_hints,
  billing_event_type,
  max_bid_micros,
  conversation_ids,
  status: "draft",
  created_at,
  updated_at
}
```

Materialize the campaign first:

```ts
{
  project_id,
  name,
  objective: "Clicks",
  lifetime_spend_limit_micros: 5000000,
  countries: ["US"],
  custom_instruction,
  status: "draft"
}
```

If Spec 02 permits additional JSONB fields, add:

```ts
{
  linked_feature_ids,
  linked_landing_gap_ids,
  generation_run_id,
  generation_metadata: {
    confidence,
    source: "openai" | "deterministic_fallback",
    prompt_version: "ad_groups_v1"
  }
}
```

If those fields do not exist, keep them in `extraction_runs.output_json` and include only `conversation_ids` on `ad_groups` for V1.

Human review of generated groups writes to `human_reviews`:

- Approve: `ad_groups.status = "approved"`.
- Edit: updates `name`, `rationale`, and/or `conversation_ids`, then writes `human_reviews`.
- Reject: `ad_groups.status = "rejected"` if Spec 02 allows it; otherwise keep `draft` plus a review action and hide from creative generation.
- Enrich: produces a refined group via manual edit or optional OpenAI call, then writes `human_reviews`.

If `ad_groups.status` enum does not include `rejected`, Spec 02 should add it or Spec 06 should represent rejection through `human_reviews` and exclude rejected IDs at query time.

## API / Server Boundaries

Recommended server entry points:

```text
POST /api/projects/:projectId/ad-groups/generate
  Starts generation from approved rows.
  Returns generation run id and any synchronously materialized groups.

POST /api/projects/:projectId/ad-groups/:adGroupId/review
  Approve/edit/reject/enrich one ad group.

GET /projects/:projectId/ad-groups or review panel
  Server Component fetches groups and passes serializable data to a Client Component.
```

Generation can run synchronously if it completes fast enough, but should fit the background-job pattern from Spec 04:

- Route handler validates project and creates `extraction_runs` with `status = "queued"`.
- Inngest/background job loads approved rows, sets run `status = "running"`, calls OpenAI/fallback, validates output, writes `ad_groups`, and marks run `succeeded`.
- Supabase Realtime causes draft ad groups to appear in the review workspace.

Review actions use the same transaction pattern as Spec 05:

1. Fetch current ad group.
2. Capture `before_json`.
3. Apply mutation.
4. Capture `after_json`.
5. Insert `human_reviews`.
6. Return updated row.

OpenAI calls must stay server-side. Client components can trigger generation/review but must not contain prompts, provider keys, or privileged persistence logic.

## UI States and Interactions

The ad-group UI may appear as:

- A panel at the bottom of `/projects/:id/review`, or
- A dedicated `/projects/:id/ad-groups` step between Review and Creatives.

For hackathon speed, use editable cards rather than a complex table.

Card content:

- Ad-group name.
- Status chip: `draft`, `approved`, `creative_generated`, `deployed`.
- Rationale.
- Linked conversations list with short excerpts.
- Linked feature/proof/gap badges if available.
- Actions: Approve, Edit, Reject, Regenerate, Enrich.

Primary states:

- No approved conversations: show inline gate explaining how many approved conversations are required.
- Ready to generate: show "Generate ad groups" with count of approved conversations/features/gaps.
- Generating: show button-level pending state and placeholder draft cards, not a page spinner.
- Draft generated: show editable cards.
- Approved: card moves to approved state and becomes eligible for creatives.
- Rejected: card dims/hides from creative generation; audit stays visible.
- Regenerated: show newly generated cards and preserve old groups unless user chooses replace.

## Regeneration and Enrichment

### Generate

Initial generation creates draft groups from approved extraction rows.

Rules:

- If draft ad groups already exist, ask whether to append new groups or replace unapproved drafts.
- Never overwrite approved groups without explicit confirmation.
- Always create a new `extraction_runs` row for each generation attempt.

### Regenerate all drafts

Use when the user changes multiple approved rows or the first grouping is weak.

Behavior:

- Load approved rows plus current draft groups.
- Mark old unapproved draft groups as superseded if the schema has metadata; otherwise keep them but exclude from default view.
- Create new draft groups.
- Persist a `human_reviews` action with `action = "enrich"` or a generation metadata event noting regeneration reason if initiated by a human.

### Regenerate one group

Use when a single group is weak.

Input:

- Current group.
- Linked approved conversations.
- Unassigned approved conversations.
- User instruction.

Rules:

- The replacement must link at least one approved conversation.
- If the replacement drops a conversation, the rationale must explain why or place it in `rejected_conversation_ids`.
- Preserve approved groups around it.

### Enrich

Use when the user likes the group but wants sharper naming/rationale.

V1 options:

- Manual edit is default and fastest.
- Optional AI enrich updates name/rationale and optionally linked feature/gap metadata, but cannot add unapproved conversations.

Every regeneration/enrichment writes:

- `extraction_runs` if a provider or deterministic generator produced output.
- `human_reviews` if the user requested or accepted the change.

## Failure States

- Not enough approved inputs: block generation and show exact required action, for example approve two conversations.
- Provider timeout: mark `extraction_runs.status = "failed"`, store error, and offer deterministic fallback.
- Invalid structured output: retry once with a repair prompt that includes validation errors; if still invalid, fail and offer fallback.
- Output references non-approved IDs: reject those groups before persistence and include validation errors in `extraction_runs.error`.
- Duplicate groups: merge or reject the weaker duplicate before persistence; never show duplicate cards as if they are separate strategy.
- Persistence partially fails: wrap run update and group inserts in a transaction where possible. If not possible, mark the run failed and surface recovery.
- User edits a stale group: use `expectedUpdatedAt`, refetch on conflict, and preserve the draft edit.
- Realtime disconnected: generated groups should still appear after manual refresh.

## Acceptance Criteria

- Generation uses only approved `conversations`, `brand_features`, and `landing_gaps`.
- Pending, rejected, and edited-but-not-approved extraction rows are excluded from generation input.
- Each generation attempt writes an `extraction_runs` row with `phase = "ad_groups"` and stores input/output/model/status/error.
- OpenAI output is validated against a strict schema before persistence.
- Deterministic fallback can create understandable groups from approved rows when OpenAI is unavailable.
- Each persisted `ad_groups` row has a clear `name`, `rationale`, `conversation_ids`, and `status`.
- Each linked conversation ID exists, belongs to the same project, and is approved.
- The UI shows draft cards without a whole-page spinner.
- User can approve, edit, reject, regenerate, and enrich ad groups.
- Every human action writes a `human_reviews` row with before/after snapshots.
- Only `status = "approved"` ad groups feed creative generation in Spec 07.
- Approved groups are not overwritten by regeneration unless the user explicitly chooses that behavior.
- Seeded/demo mode can produce ad groups without live OpenAI.

## Demo Script

1. From the live HITL review workspace, approve at least three conversation rows, two brand feature/proof rows, and one landing gap.
2. Open the ad-group panel and show the input counts.
3. Click Generate ad groups.
4. Draft cards appear progressively or after the generation run completes.
5. Open one card and point to the linked conversation excerpts.
6. Edit the name or rationale to show human control.
7. Reject a weak group or regenerate one group with an instruction.
8. Approve two strong groups.
9. Move to creative generation, where only approved ad groups are eligible.

## Open Questions / Risks

- Does Spec 02 allow `ad_groups.status = "rejected"` and `superseded`, or should rejection/supersession live only in `human_reviews` and metadata?
- Should `conversation_ids` be `uuid[]` or JSONB? The brief suggests `conversation_ids`; implementation should choose one schema and make filtering easy.
- Should linked features/gaps be columns on `ad_groups` or retained in `extraction_runs.output_json` for V1?
- How many groups is ideal for demo pacing? Recommendation: 2-4 approved groups from 4-8 approved conversations.
- If the extraction pipeline already materializes draft ad groups in Spec 04, this spec must decide whether to refine existing drafts or generate canonical groups from scratch. Recommendation: treat extraction drafts as hints and regenerate canonical groups from approved rows.

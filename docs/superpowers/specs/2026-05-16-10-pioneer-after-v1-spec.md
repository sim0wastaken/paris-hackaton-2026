# Spec 10 - Pioneer After-v1 Classifier Path

**Owner:** Worker E  
**Phase:** Post-v1 learning layer  
**Status:** Draft  
**Required for demo:** No. This is pitch and follow-on implementation material.

## Problem / User Value

OpenAI should power the first complete Motive workflow, but repeated GPT labeling calls can become expensive, slower than necessary, and hard to specialize once Motive has real campaign traces. After v1 stores OpenAI labels, HITL corrections, ad groups, creatives, and performance snapshots, that data can become a supervised dataset for a smaller Pioneer classifier.

The user value is a faster and cheaper campaign-intelligence loop that improves from Motive-specific corrections and outcomes. The demo-day value is an honest narrative: Motive creates the dataset today; Pioneer can specialize on it tomorrow.

## Positioning

Use this language:

> OpenAI powers the complete workflow today. Every source, label, correction, creative, and KPI row is stored, which gives us the dataset for a smaller Pioneer classifier after v1. Pioneer can then replace repeated classification calls where it matches quality, and Adaptive Inference can learn from human corrections and outcome traces once we have enough real traffic.

Do not say:

- "Pioneer is already training live in the demo" unless it actually is.
- "The model self-improves from GPT output alone."
- "Adaptive Inference is production-ready for us today."
- "We beat GPT" without a holdout eval and latency/cost measurement.

## Scope

### P0 for post-v1 spec completeness

- Define export rows from stored v1 tables.
- Define candidate label heads for classification and extraction.
- Define GLiNER2 constraint extraction dataset shape.
- Define Pioneer training, inference, feedback, and evaluation boundaries.
- Define an agreement/latency/cost comparison chart.
- Define pitch language and non-claims.

### P1 after v1 demo works

- Build an export endpoint or script that writes JSONL files from Supabase/Postgres.
- Upload a first labeled dataset to Pioneer.
- Run a baseline evaluation against OpenAI labels and a human-reviewed holdout.
- Add an internal eval page with metrics and example disagreements.

### P2

- Run live Pioneer inference for non-critical classification surfaces.
- Submit inference feedback from `human_reviews`.
- Evaluate Adaptive Inference after enough real corrections and outcome traces exist.
- Promote Pioneer for repeated labeling only when agreement, latency, and cost meet thresholds.

## Non-goals

- Do not block specs 01-09 or the demo-day product on Pioneer.
- Do not fine-tune during the first live demo path.
- Do not replace OpenAI generation for source recap, ad-group rationale, creative copy, or monitoring insight text in v1.
- Do not send unlabeled or low-quality rows to training without review status and provenance.
- Do not claim campaign performance improvement until real outcome data exists.

## Dependencies

- Spec 02 must persist all v1 artifacts and provider input/output JSON.
- Spec 04 must store extraction labels and prompt versions.
- Spec 05 must store HITL corrections in `human_reviews`.
- Spec 06 must persist final ad-group decisions.
- Spec 07 must persist creative angles and variants.
- Spec 08 must persist story KPI rows with `quality_score`, `insight`, and `recommended_action`.
- Spec 09 must create seeded rows that can also exercise the export path, clearly marked as demo data.

## Research Notes

- Pioneer exposes a REST API at `https://api.pioneer.ai`, uses `X-API-Key`, and recommends the workflow: create/upload dataset, start training job, poll status, run evaluation, then run inference. Source: [Pioneer REST API overview](https://docs.pioneer.ai/api-reference/overview).
- Pioneer datasets are named/versioned resources and must be ready before training. Dataset statuses include initialization, upload/conversion/validation, ready, and failed states. Source: [Pioneer datasets API](https://docs.pioneer.ai/api-reference/datasets).
- Pioneer training jobs use `POST /felix/training-jobs` with `base_model`, `datasets`, `model_name`, and optional `training_type`; LoRA is the default fine-tuning style, and completed jobs expose F1, precision, and recall. Source: [Pioneer training jobs API](https://docs.pioneer.ai/api-reference/training-jobs) and [Pioneer training concepts](https://docs.pioneer.ai/concepts/training).
- Pioneer inference accepts base model IDs such as `fastino/gliner2-base-v1` or completed training job IDs, supports a native schema format, and also provides OpenAI-compatible and Anthropic-compatible endpoints. Source: [Pioneer inference concepts](https://docs.pioneer.ai/concepts/inference).
- Pioneer records inference history and accepts feedback on inference results, including correct/incorrect verdicts and corrected output. Source: [Pioneer inference concepts](https://docs.pioneer.ai/concepts/inference).
- Pioneer evaluations run against labeled datasets and report F1, precision, recall, sample count, and status; base models can be evaluated as baselines. Source: [Pioneer evaluations API](https://docs.pioneer.ai/api-reference/evaluations).
- Adaptive Inference monitors inference traffic, uses high-signal traces and explicit feedback to build more training data, retrains a checkpoint, evaluates against held-out data, and requires promotion decisions. It is not included on the Free plan according to current docs. Source: [Pioneer Adaptive Inference guide](https://docs.pioneer.ai/guides/adaptive-inference).
- Pioneer synthetic data can generate or label NER/classification examples, but Motive's first dataset should primarily come from stored v1 rows plus HITL corrections. Source: [Pioneer synthetic data API](https://docs.pioneer.ai/api-reference/synthetic-data).
- GLiNER2 is a schema-based model for entity extraction, text classification, structured extraction, and relations. Its documented JSONL training examples use `input` and `output` fields, with `entities`, `classifications`, `json_structures`, or `relations` under output. Source: [GLiNER2 GitHub README](https://github.com/fastino-ai/GLiNER2).
- The hackathon side challenge rewards fine-tuning that replaces or outperforms a general LLM API call, thoughtful synthetic data/evaluation/adaptive inference, and creative GLiNER2 use. Source: [Paris AI Hackathon manual](../../Hackathon-Briefs/%7BTech%20Europe%7D%20Paris%20AI%20Hackathon%20Manual%207222b372b789830a8ed50165ed151372.md).

## Data Model Touched

No v1 critical-path schema is required beyond the tables already defined by spec 02. Post-v1 can add these optional tables or generate equivalent artifacts from scripts:

### `pioneer_exports`

- `id`
- `created_at`
- `project_id`
- `export_kind`: `conversation_classification` / `constraint_ner` / `creative_angle_classification` / `eval_holdout`
- `source_row_counts`
- `dataset_name`
- `dataset_version`
- `jsonl_path`
- `status`: `draft` / `validated` / `uploaded` / `failed`
- `created_by`
- `notes`

### `pioneer_jobs`

- `id`
- `created_at`
- `project_id`
- `pioneer_training_job_id`
- `dataset_name`
- `base_model`
- `model_name`
- `training_type`
- `status`
- `metrics_json`
- `error`

### `pioneer_eval_runs`

- `id`
- `created_at`
- `project_id`
- `pioneer_evaluation_id`
- `model_id`
- `dataset_name`
- `sample_count`
- `f1_score`
- `precision_score`
- `recall_score`
- `agreement_json`
- `latency_json`
- `cost_json`
- `status`

### `pioneer_inference_logs`

- `id`
- `created_at`
- `project_id`
- `entity_type`
- `entity_id`
- `pioneer_inference_id`
- `model_id`
- `input_json`
- `output_json`
- `latency_ms`
- `estimated_cost_usd`
- `feedback_status`: `not_sent` / `correct` / `incorrect_corrected`

## Export Inputs From v1 Data

Only export rows with enough provenance:

| Source table | Required source fields | Export use |
| --- | --- | --- |
| `conversations` | `text`, `stage`, `intent_type`, `buyer_role`, `constraints_json`, `source_refs`, `review_status` | Primary classification and constraint extraction rows. |
| `ad_groups` | `name`, `rationale`, `conversation_ids`, `status` | Ad-group label head and campaign grouping supervision. |
| `creative_variants` | `title`, `description`, `creative_angle`, `ad_group_id`, `status` | Creative-angle classification and outcome features. |
| `human_reviews` | `entity_type`, `entity_id`, `action`, `before_json`, `after_json`, `comment` | Label correction authority and feedback signal. |
| `performance_snapshots` | `quality_score`, `insight`, `recommended_action`, KPI fields | Outcome proxy and later campaign-performance labels. |
| `extraction_runs` | `model`, `prompt_version`, `input_json`, `output_json` | Provenance and OpenAI baseline labels. |

Rows should include `project_id`, source row IDs, review status, and `is_seeded_demo` or equivalent provenance flag. Seeded demo rows can validate the exporter but should not be mixed with real training data unless the dataset name marks them as demo.

## Candidate Label Heads

### Conversation Classification

Use Pioneer/GLiNER2 classification for repeated labels:

- `stage`: `problem_aware`, `solution_compare`, `vendor_evaluation`, `pricing_check`, `security_review`, `ready_to_buy`, `post_purchase`.
- `intent_type`: `workflow_pain`, `migration_risk`, `proof_request`, `budget_validation`, `trust_check`, `integration_check`, `urgency_timeline`, `competitive_switch`.
- `buyer_role`: `founder`, `revenue_lead`, `marketing_lead`, `customer_success`, `operations`, `security`, `finance`, `unknown`.
- `landing_gap_type`: `proof`, `comparison`, `setup_path`, `pricing_clarity`, `trust_compliance`, `integration_depth`.
- `ad_group`: one of the approved ad group IDs or stable slugs generated from `ad_groups.name`.
- `creative_angle`: `specific_timeline`, `proof_heavy`, `migration_setup`, `pricing_clarity`, `trust_compliance`, `generic_value_prop`, `integration_specific`.

### Constraint Extraction With GLiNER2

Use GLiNER2-style NER labels for spans, not broad categories:

- `budget`
- `timeline`
- `integration`
- `team_size`
- `compliance`
- `migration_object`
- `approval_process`
- `geography`
- `existing_tool`

Examples:

- Text: "We need it live before Friday and under 500 USD/month."
  - `timeline`: "before Friday"
  - `budget`: "under 500 USD/month"
- Text: "Can it import Gmail labels without breaking HubSpot sync?"
  - `migration_object`: "Gmail labels"
  - `integration`: "HubSpot"

## Export Row Shapes

### Conversation Classification JSONL

Use one line per conversation. Include reviewed labels as ground truth. If a human edit exists, prefer the latest approved `human_reviews.after_json` over raw OpenAI output.

```jsonl
{"input":"Founder says the team needs inbox follow-up live before Friday without leaving Gmail.","output":{"classifications":[{"task":"stage","labels":["problem_aware","solution_compare","vendor_evaluation","pricing_check","security_review","ready_to_buy","post_purchase"],"true_label":["vendor_evaluation"]},{"task":"intent_type","labels":["workflow_pain","migration_risk","proof_request","budget_validation","trust_check","integration_check","urgency_timeline","competitive_switch"],"true_label":["urgency_timeline"]},{"task":"buyer_role","labels":["founder","revenue_lead","marketing_lead","customer_success","operations","security","finance","unknown"],"true_label":["founder"]}]},"metadata":{"project_id":"...","conversation_id":"...","label_source":"human_reviewed"}}
```

### Constraint NER JSONL

Use GLiNER2-compatible `input` and `output.entities` form. Include entity descriptions when useful.

```jsonl
{"input":"We need it live before Friday, under 500 USD/month, and connected to Gmail.","output":{"entities":{"timeline":["before Friday"],"budget":["under 500 USD/month"],"integration":["Gmail"]},"entity_descriptions":{"timeline":"Deadline or time constraint for adopting the product","budget":"Budget, spend ceiling, or pricing constraint","integration":"External product, platform, or system that must connect"}},"metadata":{"project_id":"...","conversation_id":"...","label_source":"human_reviewed"}}
```

### Creative Outcome JSONL

Use this for later analysis, not first fine-tuning:

```jsonl
{"input":"Title: Live in Gmail by Friday\nDescription: Turn founder inbox chaos into CRM-ready follow-up before the week ends.","output":{"classifications":[{"task":"creative_angle","labels":["specific_timeline","proof_heavy","migration_setup","pricing_clarity","trust_compliance","generic_value_prop","integration_specific"],"true_label":["specific_timeline"]}],"json_structures":[{"outcome_proxy":{"quality_bucket":"high","ctr_bucket":"high","cvr_bucket":"medium","reason":"Timeline-specific copy matched the buyer constraint, but setup proof gap limited conversion."}}]},"metadata":{"creative_variant_id":"...","ad_group_id":"...","snapshot_id":"..."}}
```

## Export Rules

- Split by project first, then by row, so a brand does not leak into both train and holdout through near-duplicate conversations.
- Default split: 70 percent train, 15 percent validation, 15 percent holdout once there are enough real projects.
- Minimum first real dataset target: 100 reviewed conversations, 300 labeled constraint spans, 50 creative/outcome examples.
- Exclude rows with `review_status = 'rejected'` unless they are used as negative examples with explicit labels.
- Include OpenAI raw labels as `label_source = openai` only for bootstrapping. Prefer `human_reviewed` for evaluation.
- Keep seeded demo rows in a separate dataset such as `motive-demo-constraint-ner-v1`.

## API / Server Boundaries

### Export Script

Command:

```text
pnpm pioneer:export --project all --kind constraint_ner --out exports/pioneer/
```

Responsibilities:

- Query Supabase/Postgres with server credentials.
- Resolve latest human-reviewed label per entity.
- Validate JSONL shape.
- Write counts and provenance to `pioneer_exports` if that table exists.
- Refuse to include rejected or unreviewed rows unless `--include-unreviewed` is explicit.

### Upload and Training Worker

Post-v1 background job:

```text
pioneer/dataset.train.requested
```

Responsibilities:

- Upload or generate dataset through Pioneer.
- Poll dataset status until ready.
- Call `POST /felix/training-jobs`.
- Poll training status until `complete` or `failed`.
- Persist job ID, status, metrics, logs URL if available, and errors.

### Inference Adapter

Server-only adapter:

```text
classifyConversationWithPioneer(input)
extractConstraintsWithPioneer(input)
```

Responsibilities:

- Call `POST /inference` with either a base model ID or training job ID.
- Store request/response in `pioneer_inference_logs`.
- Return labels with confidence and model provenance.
- Never run automatically in v1 critical path.

### Feedback Adapter

Server-only adapter:

```text
sendPioneerFeedback(inferenceId, verdict, correctedOutput)
```

Responsibilities:

- Send `correct` or `incorrect` feedback from reviewed `human_reviews`.
- Store feedback status locally.
- Batch feedback after review actions, not during the judge-facing demo.

## Provider Calls, Prompts, and Persistence

Pioneer is an after-v1 provider boundary, not a v1 dependency:

- Dataset upload/generation calls must persist dataset name, version, source row counts, and validation status in `pioneer_exports` or the exported manifest.
- Training calls must persist `base_model`, dataset refs, training type, job ID, status, metrics, and errors in `pioneer_jobs`.
- Inference calls must persist input text, schema/label head, model ID, output labels/entities, confidence if returned, latency, and estimated cost in `pioneer_inference_logs`.
- Feedback calls must persist the original Pioneer inference ID, verdict, corrected output, local `human_reviews.id`, and retry status.
- Prompted OpenAI labels remain the v1 baseline. Export manifests must keep OpenAI `model`, `prompt_version`, and source `extraction_runs.id` so evals can explain whether Pioneer is matching raw GPT labels or human-reviewed labels.
- Do not add prompt copy to the user-facing demo pitch. The internal Model Lab can show prompts, schema definitions, and label-head configuration for debugging.

## UI States and Interactions

This is post-v1 and should live in an internal "Learning" or "Model Lab" page, not the primary demo navigation.

### Empty State

- "No Pioneer dataset exported yet."
- Show available reviewed row counts by label head.
- Disable training until minimum data thresholds are met.

### Export Review

- Counts by dataset kind.
- Train/validation/holdout split preview.
- Top labels and class imbalance warning.
- Sample rows with provenance and source links.

### Evaluation Dashboard

Required chart columns:

- Label head
- OpenAI baseline agreement
- Pioneer agreement with human-reviewed holdout
- F1
- Precision
- Recall
- p50 latency
- p95 latency
- Estimated cost per 1,000 classifications
- Promotion recommendation: `do_not_use`, `shadow_only`, `limited_rollout`, `replace_repeated_gpt_call`

### Disagreement Review

- Show input text.
- Show OpenAI label, Pioneer label, human label, confidence, and source refs.
- Action: "mark OpenAI right", "mark Pioneer right", "enter corrected label".
- Writes to `human_reviews`; post-v1 job may send Pioneer feedback if an inference ID exists.

## Jobs / Realtime

- `pioneer/export.requested`: builds JSONL and validates row counts.
- `pioneer/training.requested`: uploads/starts training/polls status.
- `pioneer/evaluation.requested`: starts eval and polls status.
- `pioneer/inference.shadow_requested`: runs Pioneer alongside OpenAI on a sample without affecting user-visible labels.
- `pioneer/feedback.flush_requested`: sends reviewed corrections to Pioneer feedback endpoints.

Realtime is optional. If built, it can update the internal Model Lab status cards from `pioneer_exports`, `pioneer_jobs`, and `pioneer_eval_runs`.

## Evaluation Plan

### Phase 1: Offline Export Validation

- Validate JSONL parseability.
- Validate all labels belong to allowed label sets.
- Validate no row has empty `input`.
- Validate every row has provenance: source IDs, project ID, label source, review status.
- Validate seeded rows are isolated.

### Phase 2: Baseline Measurement

- Use current OpenAI v1 labels as baseline.
- Compare OpenAI labels to human-reviewed holdout.
- Record agreement and confusion matrix by label head.

### Phase 3: Pioneer Training and Evaluation

- Train a GLiNER2-based classifier/extractor for the highest-value narrow task first: constraints NER.
- Evaluate against human-reviewed holdout.
- Record Pioneer F1, precision, recall, latency, and estimated cost.
- Run the same evaluation for an untuned base model when practical.

### Phase 4: Shadow Mode

- For new projects, run Pioneer in the background on conversation classification.
- Do not show Pioneer labels to users.
- Compare against OpenAI and human edits.
- Send feedback only after human review confirms a correction.

### Phase 5: Limited Replacement

Promote only label heads that meet all gates:

- Human-reviewed holdout F1 >= 0.85 for the label head.
- Agreement within 5 percentage points of OpenAI on reviewed rows, or better than OpenAI for the target head.
- p95 latency at least 30 percent lower than the OpenAI classification call it replaces.
- Estimated cost at least 50 percent lower per 1,000 classifications.
- No severe failure class in the last 50 reviewed examples.

## Agreement / Latency / Cost Chart

The chart should be a table plus a compact bar chart:

| Label head | OpenAI vs human | Pioneer vs human | F1 | p95 latency | Cost / 1k | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `constraints` | 0.88 | 0.86 | 0.84 | 180 ms | $X | Shadow only |
| `intent_type` | 0.91 | 0.89 | 0.87 | 210 ms | $Y | Limited rollout |
| `creative_angle` | 0.83 | 0.72 | 0.70 | 190 ms | $Y | Do not use |

The actual implementation must compute values from stored eval runs. The spec examples above are placeholders.

## Failure States

| Failure | Expected behavior |
| --- | --- |
| Too few reviewed rows | Export allowed for inspection, training disabled with clear threshold message. |
| Dataset validation failed | Mark export `failed`, show invalid lines and reason. |
| Pioneer 401/402/429 | Store error, pause job, and show auth/credits/rate-limit status. |
| Training failed | Keep dataset and job metadata, surface logs endpoint if available, do not retry blindly. |
| Evaluation below threshold | Keep Pioneer in shadow/off mode; do not replace OpenAI labels. |
| High disagreement on one class | Show class-level warning and route examples to human review. |
| Feedback send failed | Keep local feedback pending and retry later. |
| Seeded demo data accidentally selected for real training | Block upload unless dataset name contains `demo` and operator confirms. |

## Acceptance Criteria

- The spec keeps Pioneer out of the v1 critical path and labels it post-v1 in implementation priority.
- Export rows are defined for conversations, constraints, creative angles, ad groups, human reviews, and performance snapshots.
- Candidate label heads are explicit and finite enough for evaluation.
- GLiNER2 constraint extraction uses span/entity style data rather than vague campaign summaries.
- The eval plan compares against OpenAI labels and a human-reviewed holdout.
- The agreement/latency/cost chart has clear promotion thresholds.
- Pitch language is honest about what exists now versus what Pioneer can do after data exists.

## Demo Script

Use this only after the core workflow demo is complete:

1. "Pioneer is not required for this v1 flow. We made that choice deliberately so the product works end to end today."
2. Open monitoring or the future learning diagram.
3. "The important part is that every OpenAI label, every human correction, every ad group, every creative, and every KPI row is persisted."
4. Show the row types that would be exported.
5. "Those rows become a Pioneer dataset for repeated classification: stage, intent, buyer role, constraints, ad group fit, landing gap, and creative angle."
6. "The first narrow use case would be GLiNER2 constraint extraction, because budget, timeline, integration, team size, and compliance spans are clear supervised targets."
7. "We would only replace a GPT classification call after a holdout eval shows comparable agreement, lower latency, and lower cost."
8. "Adaptive Inference becomes credible after real production traces and human corrections exist. The demo today creates that feedback substrate."

## Open Questions / Risks

- Pioneer upload file format for custom datasets should be verified during implementation against the live dataset upload docs or CLI. The GLiNER2 JSONL shape is clear, but the upload flow may impose additional packaging constraints.
- Cost measurement depends on final provider pricing and actual token/request usage. Do not hardcode example cost values.
- Class imbalance is likely early. The first real task should be narrow constraints NER, not every label head at once.
- Human-reviewed holdout quality matters more than volume. Do not evaluate against only GPT-labeled GPT outputs and call it improvement.

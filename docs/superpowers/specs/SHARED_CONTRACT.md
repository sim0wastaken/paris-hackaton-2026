# Shared Contract — Motive Specs

Status: Canonical for specs 01-10  
Date: 2026-05-16

This file is the single source of truth for cross-spec names, ownership, OpenAI Ads compatibility, label vocabularies, and demo metrics. If an individual spec conflicts with this file, this file wins.

## Phase Ownership

| Phase | Owner spec | Writes |
|---|---|---|
| `source_recap` | Spec 04 | `extraction_runs`, optional `projects` metadata |
| `feature_map` | Spec 04 | `brand_features` |
| `conversation_map` | Spec 04 | `conversations` base rows |
| `intent_classification` | Spec 04 | `conversations.stage`, `intent_type`, `buyer_role`, `constraints_json` |
| `landing_gaps` | Spec 04 | `landing_gaps` |
| `ad_groups` | Spec 06 | `campaigns`, `ad_groups` |
| `creative_text` | Spec 07 | `creative_variants` |
| `monitoring_synthesis` | Spec 08 | `performance_snapshots` |

Spec 04 must stop at reviewed extraction material and draft ad-group ideas. It must not write `creative_variants` or `performance_snapshots`.

## Persistence Conventions

- `extraction_runs` rows are unique by `(project_id, phase, attempt)`. Retries, reruns, and generation attempts must increment `attempt`; `prompt_version` records prompt compatibility and is not the uniqueness key.
- Canonical Supabase Storage bucket for uploaded or copied source material is `motive-sources`. Older references to `source-files` are non-canonical.

## Canonical Labels

Use these labels everywhere unless the user explicitly changes the product ontology.

`stage`:

- `problem_aware`
- `solution_compare`
- `vendor_evaluation`
- `pricing_check`
- `security_review`
- `ready_to_buy`
- `post_purchase`

`intent_type`:

- `workflow_pain`
- `migration_risk`
- `proof_request`
- `budget_validation`
- `trust_check`
- `integration_check`
- `urgency_timeline`
- `competitive_switch`

`buyer_role`:

- `founder`
- `revenue_lead`
- `marketing_lead`
- `customer_success`
- `operations`
- `security`
- `finance`
- `unknown`

`landing_gap_type`:

- `proof`
- `comparison`
- `setup_path`
- `pricing_clarity`
- `trust_compliance`
- `integration_depth`
- `security`
- `performance`
- `other`

`landing_gaps.severity`:

- OpenAI label `low` stores as `2`.
- OpenAI label `medium` stores as `3`.
- OpenAI label `high` stores as `5`.
- Preserve the original label in `landing_gaps.metadata.severity_label` when available.

`constraint.type`:

- `budget`
- `timeline`
- `integration`
- `team_size`
- `compliance`
- `migration_object`
- `approval_process`
- `geography`
- `existing_tool`
- `technical`
- `other`

## OpenAI Ads Compatibility Contract

Motive owns a broader strategy layer, but the campaign package must be OpenAI Ads compatible first.

Canonical hierarchy:

```text
Project
  -> Campaign
  -> Ad Group
  -> Creative Variant / Ad
```

OpenAI-compatible export shape:

```json
{
  "campaign": {
    "name": "AtlasDesk - Gmail setup sprint",
    "objective": "Clicks",
    "start_date": "2026-05-16",
    "end_date": "2026-06-15",
    "budget": {
      "lifetime_spend_limit_micros": 5000000
    },
    "targeting": {
      "locations": {
        "countries": ["US"]
      }
    },
    "custom_instruction": "Bias generation toward Gmail setup speed and proof-seeking buyers."
  },
  "ad_groups": [
    {
      "name": "Friday setup urgency",
      "context_hints": ["Gmail CRM setup by Friday", "small team switching from spreadsheets"],
      "bidding_config": {
        "billing_event_type": "click",
        "max_bid_micros": 3000000
      }
    }
  ],
  "ads": [
    {
      "ad_group_name": "Friday setup urgency",
      "type": "chat_card",
      "title": "Live in Gmail by Friday",
      "body": "Turn inbox chaos into CRM follow-up before the week ends.",
      "target_url": "https://example.com/gmail-crm",
      "file_id": "optional_uploaded_file_id",
      "image_url_for_bulk_upload": "https://cdn.example.com/ad-image.jpg",
      "status": "paused"
    }
  ]
}
```

OpenAI Ads rules to preserve:

- Campaigns own objective, budget, dates, and country targeting.
- Campaign objective is `Views` or `Clicks` for bulk upload.
- Ad groups own `context_hints` as a JSON array of phrases.
- Ad groups need bid defaults for API-shaped export: `billing_event_type` and `max_bid_micros`.
- Ads use the `chat_card` unit today.
- Ad title: recommended 16-24 characters, maximum 50.
- Ad copy/body: recommended 32-48 characters, maximum 100.
- Landing URL must be valid and reachable.
- Image is required for OpenAI-compatible ad assets: PNG/JPG, square, maximum 1200x1200, publicly accessible.
- The API upload path may require an uploaded file ID; bulk upload uses image URLs. Store both when available.
- Video creatives can exist as Motive-owned future-channel assets, but OpenAI Ads export is image-only today.
- Landing gaps are Motive-owned analysis, computed from Motive's GPT-5 + Tavily extraction; they are not OpenAI Ads Manager metrics.
- Prompt Share of Voice is deferred for v1: not computed, not stored, and not surfaced in any product surface. Treat any older references as out of scope.

## Product Feed / Shopping Ads Contract

Motive must support ecommerce/product-feed ads as a first-class path, even if the first demo brand is B2B SaaS.

Required concepts:

- `product_feeds`: project-level feed import/export metadata.
- `product_feed_items`: SKU/product rows compatible with Google Shopping-style feeds.
- `ad_groups.product_feed_item_ids`: optional links from campaign structure to approved product rows.
- Feed source formats may include CSV, JSONL, TSV, or Parquet later; v1 can store uploaded CSV/JSONL or pasted sample rows.
- Product feed output is additive to campaign/ad-group/creative workflows, not a replacement.
- Product feed specs must not block the B2B SaaS demo path.

## KPI Contract

`performance_snapshots.quality_score` is a 1-100 integer-like score. Do not use 0-10.

Use:

- `period_start`
- `period_end`
- `quality_score`
- `insight`
- `recommended_action`
- `metric_basis_json`

Do not use `snapshot_date` or `period_label` as canonical fields. They may be derived for UI display.

KPIs are simulated for the hackathon but must be story-driven:

- Specific, constraint-aware copy earns stronger CTR.
- Unresolved landing gaps can create high CTR with weaker CVR.
- Proof-seeking conversations reward proof-heavy copy.
- Pricing-check conversations underperform if pricing clarity is missing.
- Migration/switching conversations reward setup-path and comparison copy.

## Internal vs. Exported Fields

Motive-internal fields may include:

- `rationale`
- `creative_angle`
- `landing_gap_type`
- `quality_score`
- `insight`
- `recommended_action`

OpenAI-exported fields must be explicitly generated and validated:

- campaigns
- ad groups with `context_hints`
- ads with compliant title/body/image/landing URL
- budgets, bids, countries, dates, objective

Never imply that Motive-owned fields are OpenAI-native platform signals.

Let me first check what's actually been drafted (specs may still be in progress), then dispatch parallel research.

All 10 specs are landed (217 KB total). I'll run two read-only research agents in parallel: one inhales every concrete deliverable from the specs, one crawls the actual OpenAI Ads / ads.openai.com surface. Then I synthesize the audit. No file changes.

# Audit: Motive landing + specs vs. real OpenAI Ads Manager

**TL;DR.** OpenAI Ads Manager is real, self-serve, public-beta as of May 5, 2026, with a fully-documented REST API at `api.ads.openai.com/v1`. The good news: most of Motive's *strategic* vocabulary (context hints, ad groups, conversational targeting) maps to real OpenAI surface. The bad news: **the specs design Motive-internal shapes that don't bind to the real API**, the **creative character limits in Spec 07 are wrong by 2-3x**, and three landing-copy claims aren't OpenAI vocabulary at all. None of this kills the demo, but if you want the deliverable to be *actually compatible* with `ads.openai.com`, the gap is bigger than the docs currently acknowledge.

Below: what's correct, what's wrong, what's missing, and a field-by-field map.

---

## 1. What checks out — defensible against real platform

| Claim (landing copy / specs) | Reality | Verdict |
|---|---|---|
| "OpenAI Ads Manager goes self-serve May 5, 2026" (app.jsx:319, :715) | Confirmed by OpenAI press + Axios + Digiday + AdExchanger + PPC Land | ✅ HIGH confidence |
| "context hints for OpenAI's ad group format" (app.jsx:342) | Real field: `context_hints: string[]` on the AdGroup resource, exact OpenAI vocabulary | ✅ HIGH — but no spec actually emits this field name (see §3) |
| "Most teams will port keywords… platform doesn't reward keywords" (app.jsx:18, :715) | True — targeting is `context_hints` arrays + semantic matching, no keyword field | ✅ HIGH |
| "Named, scoped ad groups built around buying briefs" (app.jsx:348) | Matches OpenAI's recommended structuring (themes, not keyword clusters) | ✅ HIGH |
| Spec 06's "adapt Google Ads ad-group concept to 'conversation theme'" (Spec 06 line 50) | Aligns with OpenAI's Help Center guidance to structure groups around "questions, needs, or situations" | ✅ HIGH |

So the strategic positioning isn't bullshit — it's the *implementation contract* that's loose.

---

## 2. What's wrong or misleading — fix-level issues

### 2.1 Creative character limits in Spec 07 are wrong by 2-3×

> Spec 07, lines 209-214: `title`: "short ad headline, target 35-70 characters"; `description`: "one concise sentence, target 90-160 characters"

**Real OpenAI `chat_card` limits** (from `developers.openai.com/ads/api-reference/ads`, HIGH confidence):

| Field | Spec 07 target | Real platform limit |
|---|---|---|
| `creative.title` | 35-70 chars | **3-50 chars** |
| `creative.body` (Spec calls it `description`) | 90-160 chars | **max 100 chars** |

If Motive generates 60-char titles and 140-char descriptions and the user clicks "deploy to ads.openai.com," **every creative variant fails validation.** The landing copy says "character-limit-aware titles and copy" (app.jsx:457). Right now the specs are character-limit-aware for the *wrong limits.*
Ensure validation also happens in code and not only in LLM prompts.

### 2.2 Image specs in Spec 07 don't match platform requirements

> Spec 07 line 225: `image_size = landscape_16_9`, fal-ai/flux/schnell

**Real platform requirement** (from OpenAI Help Center, HIGH confidence): images must be **PNG or JPG, square, ≤1200×1200 px**, publicly accessible URL. Landscape 16:9 will be rejected. The chat_card unit is square — fal.ai prompt + dimensions need to switch to `square_hd` or equivalent.

### 2.3 "Prompt share of voice" is NOT OpenAI vocabulary

> Landing app.jsx:120-124, :486-492, :740-747 — entire "Prompt SoV" section and dashboard widget

This term is a third-party AI-SEO coinage (HubSpot, Yotpo, etc.) describing brand mention frequency across LLM outputs generally. **It does not exist in OpenAI Ads Manager.** OpenAI's `Insights` endpoint returns `impressions`, `clicks`, `spend`, derived CTR/CPC/CPM, and conversions (via CAPI). No "share of voice" metric. If a judge from the OpenAI track asks "how do you compute Prompt SoV against the platform's API?", the honest answer is "we don't — it's our own scan, separate from Ads Manager reporting." That's fine *if framed that way*; currently the copy implies platform integration. -> Defer Prompt SoV completely in favor of OpenAI's Insights endpoints data. We are not built for openai, but we can start by implementing everything openai gives su because it will allow us to build on top of features that actually already exist and when google and anthropic roll out their own ads we will be ready and grounded.

### 2.4 "Landing page gap" is also not a platform signal

> MODULES[5] (app.jsx:358), STEPS[5] (app.jsx:459), `landing_gaps` table (Spec 02:404-418)

OpenAI publishes **no Quality Score / landing-page-experience signal** to advertisers (researched HIGH confidence; absent from API reference and Help Center indexed content). This is a fine Motive POV — landing-page gaps are a real conversion concern — but the platform won't validate the diagnosis the way Google Ads' Landing Page Experience does. Don't let the demo imply OpenAI scores you on this. This one is fine as long as it is clear that we use our own extracted data , we use GPT-5.5 models and Tavily for data extraction.

### 2.5 "Bulk-upload-ready structure: campaigns, ad groups, JSON context hints" (app.jsx:457)

The bulk-upload CSV **exists** in the Ads Manager UI, but the column schema is **NOT publicly documented** (MED confidence on existence, NOT FOUND on schema). OpenAI's own Help Center routes CSV template errors to a support email. A "bulk-upload-ready" output claim is brittle. Safer truth: **API-ready**. The JSON API IS fully documented and stable. We must ship API-ready today but let's also ship bulk-upload feature. It might fail validation on openai's side, but we will have the workflow and we will only have to change shapes once openai rolls out docs.
<openai-bulk-docs>
All Collections
ChatGPT Ads
Support & resources
Bulk Upload Campaign Schema Checklist
Cet article n’est pas encore disponible dans la langue que vous avez sélectionnée. Nous vous affichons la version en anglais à la place.
Bulk Upload Campaign Schema Checklist
Use this checklist to review your bulk upload file before uploading it in Ads Manager Beta.

Dernière mise à jour : 2 days ago
Overview
Use this checklist when reviewing your bulk upload schema file before uploading into Ads Manager Beta. It helps catch avoidable file formatting and validation issues before upload.

Campaigns tab
All required campaign fields are filled in

Campaign names are unique

Campaign objective field is either: ‘Views’ or ‘Clicks’

Campaign dates are valid and correctly formatted (YYYY-MM-DD)

Budget fields are completed

Country field is completed and in JSON format

No duplicate campaign names

No more than 5,000 campaigns

Ad groups tab
All required ad group fields are filled in

Ad group names are unique

Every ad group is linked to the correct campaign

Campaign names match exactly across tabs (campaign/ ad groups)

Context hints are in JSON format [“hint1”, “hint2”]

No duplicate ad group names

No more than 5,000 ad groups

Ads tab
All required ad fields are filled in

Ad group names match exactly across tabs (ad groups / ads)

Ad titles are within character limits (16-24 characters recommended; 50 characters maximum)

Ad copy is within character limits (32–48 characters recommended; 100 characters maximum)

Landing page URLs are valid and reachable

Image URLs are publicly accessible and open directly to the image in the browser

Images are hosted in one of the following methods: Google Drive links, AWS-hosted image links such as S3 or CloudFront, and self-hosted image links on the advertiser’s domain or CDN

Image assets meet size and format requirements (square, 1200 x 1200 max)

No more than 5,000 ads

Formatting checks
Do not remove header rows (1-4) in the campaign schema template

Tabs are still named campaigns, adgroups, and ads

Column headers have not been renamed

All rows in each tab is a unique campaign, ad group, or ad (no duplicates)

There are no merged cells

Campaign and ad group names are consistent everywhere they appear
</openai-bulk-docs>

### 2.6 The OpenAI Ads launch is **US-buy-side only**, US/CA/AU/NZ delivery

The landing's audience copy targets "EU-based by design" + B2B SaaS globally. Anyone outside the US can't currently *buy* OpenAI Ads. Worth knowing the constraint, not a copy fix. -- Yes, the constraint is real but we are owning the translation layer. For the sake of both the Hackathon and Motive in general, our focus will be owning this instead of being the "openai ads manager deployers" - everybody will need this layer.

### 2.7 Sora ads don't exist (Spec 07 line 247 allows `asset_type: video`)

Sora 2 was shut down March 2026 (confirmed). The `chat_card` unit is **image-only** today. Video-asset support in Spec 07 is fine as schema headroom — but 
if the demo pitch implies "video creatives ship to OpenAI Ads," that's currently false. Image-only is the live truth.
We can support video creation for creatives, but we flag that for openai only image. We can ship image-only now for the hackathon.

---

## 3. What's missing — specs don't bind to the real API shape

This is the largest finding and the one with the most leverage. **No spec defines an export format that matches the OpenAI Ads API.** `deployments.payload_json` is free-form JSONB (Spec 02:545). Spec 08 says it contains "selected ad groups, creative variants, generated asset URLs/prompts" with no schema. Spec 10 (Pioneer) is the one place that names a real API endpoint (Pioneer's, not OpenAI Ads').
We have to be openai ads compatile 100% - everything else must be additive that we own and manage properly.

For the deliverable to be "actually OpenAI Ads compatible," the `deployments.payload_json` shape should mirror the real API:

### 3.1 Field-by-field map: Motive schema → real OpenAI Ads API

| Motive (current spec) | Real OpenAI Ads API field | Gap |
|---|---|---|
| `ad_groups.name` | `ad_group.name` (3 char min) | ✅ direct |
| `ad_groups.target_intent` (text) | `ad_group.context_hints: string[]` | ❌ wrong shape — Motive stores a single text field; real platform takes an array of phrases |
| `ad_groups.target_stage` (text) | (no equivalent) | ⚠️ Motive-internal only; doesn't ship |
| `ad_groups.rationale` (text) | (no equivalent) | ⚠️ Motive-internal only |
| (nothing) | `ad_group.bidding_config.{billing_event_type, max_bid_micros}` | ❌ **missing** — no spec generates bid defaults |
| (nothing) | `campaign.budget.lifetime_spend_limit_micros` (min 1,000,000) | ❌ **missing** — no `campaigns` table; ad_groups jump straight to deploy |
| (nothing) | `campaign.targeting.locations.countries: string[]` | ❌ **missing** — no geo |
| `creative_variants.title` | `creative.title` (3-50 chars) | ⚠️ chars wrong (see §2.1) |
| `creative_variants.description` | `creative.body` (max 100) | ⚠️ chars wrong + field name diverges |
| `creative_variants.creative_angle` | (no equivalent) | ⚠️ Motive-internal only |
| `creative_variants.asset_url` | `creative.file_id` (must be uploaded via `POST /upload` first) | ❌ shape mismatch — platform wants a file_id from prior upload, not a hosted URL passed in-place |
| `creative_variants.asset_prompt` | (no equivalent) | ⚠️ Motive-internal |
| (nothing) | `creative.target_url` (destination URL) | ❌ **missing** — no spec captures the landing URL per creative |
| (nothing) | `creative.type: "chat_card"` (constant) | ⚠️ trivial but missing |
| `performance_snapshots.{impressions, clicks, ctr, spend}` | `Insights.{impressions, clicks, spend}` (CTR derived) | ✅ direct |
| `performance_snapshots.conversions, cvr` | Available only if CAPI/pixel set up | ⚠️ realistic — spec is fine |
| `performance_snapshots.quality_score` | (no equivalent in OpenAI) | ⚠️ Motive-internal POV; that's fine, but flag |
| (nothing) | `Ad.status: active|paused|archived` | ❌ no lifecycle in `creative_variants` |

### 3.2 Resource hierarchy mismatch

Real OpenAI Ads: **Ad Account → Campaign → AdGroup → Ad → (creative)**.

Motive's schema: **Project → AdGroup → CreativeVariant**.

Missing layer: **Campaign**. In OpenAI's model, the campaign owns budget + geo targeting + (later) CPA goals; the ad group owns context_hints + bidding_config; the ad owns creative. Today Motive collapses campaign-level concepts into the project, which means a Motive project ≈ 1 campaign. That's a defensible v1 simplification, but the export will need to wrap ad groups in a campaign object. Add the missing layer properly and use proper names. Each Campaign can have a "custom instruction" field in which to insert some targeted biases that influence all adgroups generations for both copy and videos.

### 3.3 The "Bidding/budget" gap is the biggest one for direct importability

If a user clicks "deploy" today, the payload Motive constructs has **zero spend controls**: no budget, no bid, no geo. Even as fake deploy, capturing these as default fields (e.g. `lifetime_spend_limit_micros: 5_000_000`, `max_bid_micros: 3_000_000`, `countries: ["US"]`) on the deployment payload gets you to "API-shaped" with minimal effort.

### 3.4 Shopping / Product Feed Ads — an unaddressed opportunity

OpenAI shipped product-feed-driven shopping ads on May 12, 2026 (4 days before today). It accepts Google Shopping feed format (JSONL/CSV/TSV/Parquet), up to 1M SKUs. The landing copy's AUDIENCES list (app.jsx:613-617) includes Ecommerce → "Catalog → conversational shopping moments." This is a real, live, distinct OpenAI surface that no spec touches. If demo time allows, even a stub "for ecommerce brands, here's where your product feed would land" would be a strong differentiation moment. Out of scope today, but flag for the pitch.
We must support this end-to-end 100%

---

## 4. Cross-spec inconsistencies the extractor already caught (re-surfaced)

These are independent of OpenAI Ads but compound the binding problem because they mean the internal data model itself isn't consistent:

1. **`quality_score` range**: Spec 02 says 0-10 (`numeric(4,2) check >=0 and <=10`); Spec 08 says clamp 1-100. They're literally contradicting each other.
2. **Phase name**: Spec 02 enum has `creative_text`; Spec 07 writes `creative_generation`. Migration would fail.
3. **`asset_generation_status`**: Spec 07 writes this column on `creative_variants`; Spec 02 has no such column.
4. **`review_entity_type`**: Spec 05 includes `extraction_run`; Spec 02's enum doesn't.
5. **Performance period fields**: Spec 02 uses `period_start`/`period_end`; Spec 08 uses `snapshot_date`/`period_label`.
6. **Stage/intent label sets**: Spec 04 (`awareness`/`consideration`/`decision`/`retention`), Spec 09 seed (`problem_aware`/`solution_compare`/`vendor_evaluation`/...), and Spec 10 Pioneer export labels all use **different label vocabularies**. The HITL UI would have to translate between three vocabularies; Pioneer training data wouldn't match what Spec 04 produces.
7. **Variant count claims**: MODULES + STEPS say "50-150"; Offer deliverables say "50-100"; Hero meta says "20-50 conversations." Trivial copy fix.

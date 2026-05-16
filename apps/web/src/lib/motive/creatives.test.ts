import { describe, expect, it } from "vitest";

import {
  buildCreativeGenerationInput,
  buildDeterministicCreativeGenerationOutput,
  runCreativeGeneration,
  validateCreativeGenerationOutput,
  type CreativeGenerationRepository,
  type CreativeAssetProvider,
  type StructuredCreativeProvider
} from "./creatives";
import type { ExtractionReviewData, ExtractionRunRecord } from "./extraction";
import type { CreativeVariant } from "./types";

const projectId = "00000000-0000-4000-8000-0000000000aa";
const adGroupId = "10000000-0000-4000-8000-000000000001";
const secondAdGroupId = "10000000-0000-4000-8000-000000000002";
const conversationId = "20000000-0000-4000-8000-000000000001";
const featureId = "30000000-0000-4000-8000-000000000001";
const gapId = "40000000-0000-4000-8000-000000000001";
const productId = "50000000-0000-4000-8000-000000000001";

describe("Spec 07 creative generation", () => {
  it("builds generation input from approved ad groups and approved grounding only", () => {
    const input = buildCreativeGenerationInput(reviewDataFixture());

    expect(input.ad_group_contexts).toHaveLength(1);
    expect(input.ad_group_contexts[0]?.ad_group.id).toBe(adGroupId);
    expect(input.ad_group_contexts[0]?.conversations.map((row) => row.id)).toEqual([conversationId]);
    expect(input.ad_group_contexts[0]?.brand_features.map((row) => row.id)).toEqual([featureId]);
    expect(input.ad_group_contexts[0]?.landing_gaps.map((row) => row.id)).toEqual([gapId]);
    expect(input.ad_group_contexts[0]?.product_feed_items.map((row) => row.id)).toEqual([productId]);
  });

  it("does not duplicate active variants unless regeneration is requested", () => {
    const data = reviewDataFixture({ includeExistingVariant: true });

    expect(buildCreativeGenerationInput(data).ad_group_contexts).toHaveLength(0);
    expect(buildCreativeGenerationInput(data, { regenerate: true }).ad_group_contexts).toHaveLength(1);
  });

  it("creates compliant deterministic variants for provider-free demo mode", () => {
    const input = buildCreativeGenerationInput(reviewDataFixture());
    const output = buildDeterministicCreativeGenerationOutput(input);
    const validated = validateCreativeGenerationOutput(output, input);

    expect(validated.variants).toHaveLength(1);
    expect(validated.variants[0]?.title.length).toBeLessThanOrEqual(50);
    expect(validated.variants[0]?.description.length).toBeLessThanOrEqual(100);
    expect(validated.variants[0]?.target_url).toBe("https://atlasdesk.example/pricing");
    expect(validated.variants[0]?.grounding.conversation_ids).toEqual([conversationId]);
  });

  it("persists prompt-only creatives when fal.ai is not configured", async () => {
    const repository = createMemoryCreativeRepository(reviewDataFixture());
    const provider: StructuredCreativeProvider = {
      isConfigured: () => false,
      async generate() {
        throw new Error("OpenAI should not be called in demo mode");
      }
    };
    const assetProvider: CreativeAssetProvider = {
      isConfigured: () => false,
      async generateImage() {
        throw new Error("fal.ai should not be called without a key");
      }
    };

    const result = await runCreativeGeneration(
      {
        projectId,
        requestId: "req_creative",
        demoMode: true,
        generateAssets: true
      },
      { repository, provider, assetProvider }
    );

    expect(result.source).toBe("deterministic_fallback");
    expect(result.creative_variants).toHaveLength(1);
    expect(result.creative_variants[0]?.asset_generation_status).toBe("skipped");
    expect(result.generation_run?.phase).toBe("creative_text");
    expect(repository.variants[0]?.title.length).toBeLessThanOrEqual(50);
  });
});

function reviewDataFixture(options: { includeExistingVariant?: boolean } = {}): ExtractionReviewData {
  const base = {
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };

  return {
    project: {
      id: projectId,
      name: "AtlasDesk",
      brand_url: "https://atlasdesk.example",
      status: "review",
      extra_context: "Revenue teams need Gmail-native follow-up and fast setup.",
      metadata: {},
      ...base
    },
    sources: [],
    extraction_runs: [],
    brand_features: [
      {
        id: featureId,
        project_id: projectId,
        extraction_run_id: null,
        type: "proof_point",
        title: "Live before Friday",
        description: "Fast setup helps urgent teams launch this week.",
        evidence: "Launch your team before Friday.",
        source_refs: [],
        confidence: 0.9,
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    conversations: [
      {
        id: conversationId,
        project_id: projectId,
        extraction_run_id: null,
        text: "Can we get the Gmail workflow live before Friday for five reps?",
        stage: "vendor_evaluation",
        intent_type: "urgency_timeline",
        buyer_role: "founder",
        constraints_json: {
          constraints: [{ type: "timeline", value: "before Friday" }]
        },
        source_refs: [],
        confidence: 0.9,
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    landing_gaps: [
      {
        id: gapId,
        project_id: projectId,
        extraction_run_id: null,
        conversation_id: conversationId,
        gap_type: "setup_path",
        description: "The page promises fast setup but lacks a setup path.",
        suggested_fix: "Add a Friday launch checklist.",
        severity: 5,
        source_refs: [],
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    campaigns: [],
    ad_groups: [
      {
        id: adGroupId,
        project_id: projectId,
        campaign_id: null,
        extraction_run_id: null,
        name: "Friday setup urgency",
        rationale: "Targets urgent Gmail setup conversations.",
        context_hints: ["Gmail setup by Friday"],
        billing_event_type: "click",
        max_bid_micros: 3_000_000,
        target_stage: "vendor_evaluation",
        target_intent: "urgency_timeline",
        conversation_ids: [conversationId],
        feature_ids: [featureId],
        landing_gap_ids: [gapId],
        product_feed_item_ids: [productId],
        status: "approved",
        review_status: "approved",
        metadata: {},
        ...base
      },
      {
        id: secondAdGroupId,
        project_id: projectId,
        campaign_id: null,
        extraction_run_id: null,
        name: "Draft group",
        rationale: "Draft should not generate.",
        context_hints: ["draft"],
        billing_event_type: "click",
        max_bid_micros: 3_000_000,
        target_stage: null,
        target_intent: null,
        conversation_ids: [conversationId],
        feature_ids: [featureId],
        landing_gap_ids: [gapId],
        product_feed_item_ids: [],
        status: "draft",
        review_status: "pending",
        metadata: {},
        ...base
      }
    ],
    creative_variants: options.includeExistingVariant ? [creativeVariantFixture()] : [],
    product_feed_items: [
      {
        id: productId,
        project_id: projectId,
        product_feed_id: "50000000-0000-4000-8000-000000000099",
        item_id: "atlasdesk-starter",
        title: "AtlasDesk Starter",
        description: "Gmail-native follow-up for small teams.",
        link: "https://atlasdesk.example/pricing",
        image_link: null,
        availability: "in_stock",
        price: "49 USD",
        brand: "AtlasDesk",
        google_product_category: "Software > Business Software",
        product_type: "CRM software",
        condition: "new",
        raw_json: {},
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    human_reviews: []
  };
}

function creativeVariantFixture(): CreativeVariant {
  return {
    id: "60000000-0000-4000-8000-000000000001",
    project_id: projectId,
    ad_group_id: adGroupId,
    extraction_run_id: null,
    title: "Live by Friday",
    description: "Launch Gmail follow-up before urgent buyer threads go cold.",
    creative_angle: "Timeline proof",
    asset_type: "image",
    asset_prompt: "Square ad image.",
    asset_url: null,
    asset_storage_path: null,
    asset_generation_status: "skipped",
    asset_width: null,
    asset_height: null,
    asset_mime_type: null,
    openai_file_id: null,
    target_url: "https://atlasdesk.example/pricing",
    openai_ad_type: "chat_card",
    openai_ad_status: "paused",
    provider: "deterministic",
    provider_request_json: {},
    provider_response_json: {},
    openai_validation_json: {},
    error: null,
    status: "draft",
    review_status: "pending",
    metadata: {},
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };
}

function createMemoryCreativeRepository(data: ExtractionReviewData) {
  const runs: ExtractionRunRecord[] = [];
  const variants: CreativeVariant[] = [];
  const repository: CreativeGenerationRepository & { runs: ExtractionRunRecord[]; variants: CreativeVariant[] } = {
    runs,
    variants,
    async getReviewData(id) {
      return id === projectId ? { ...data, creative_variants: variants } : null;
    },
    async createGenerationRun(input) {
      const run: ExtractionRunRecord = {
        id: "70000000-0000-4000-8000-000000000001",
        project_id: input.projectId,
        phase: "creative_text",
        status: "running",
        model: input.model,
        provider: input.model.startsWith("openai:") ? "openai" : "deterministic",
        prompt_version: "creative_text_v1",
        input_json: input.input_json,
        output_json: {},
        error: null,
        started_at: "2026-05-16T08:00:00Z",
        completed_at: null,
        duration_ms: null,
        attempt: 1,
        inngest_run_id: null,
        metadata: { request_id: input.requestId },
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      };
      runs.push(run);
      return run;
    },
    async updateGenerationRunSucceeded(runId, patch) {
      const run = getRun(runId);
      Object.assign(run, {
        status: "succeeded" as const,
        model: patch.model,
        output_json: patch.output_json,
        metadata: { ...run.metadata, ...patch.metadata },
        completed_at: "2026-05-16T08:00:01Z",
        duration_ms: 1000
      });
      return run;
    },
    async updateGenerationRunFailed(runId, error) {
      const run = getRun(runId);
      Object.assign(run, {
        status: "failed" as const,
        error: JSON.stringify(error),
        completed_at: "2026-05-16T08:00:01Z"
      });
      return run;
    },
    async materializeCreativeVariants(run, output, context) {
      const created = output.variants.map((variant, index): CreativeVariant => ({
        id: `80000000-0000-4000-8000-00000000000${index + 1}`,
        project_id: run.project_id,
        ad_group_id: variant.ad_group_id,
        extraction_run_id: run.id,
        title: variant.title,
        description: variant.description,
        creative_angle: variant.creative_angle,
        asset_type: variant.asset_type,
        asset_prompt: variant.asset_prompt,
        asset_url: null,
        asset_storage_path: null,
        asset_generation_status: context.assetMode === "fal.ai" ? "pending" : "skipped",
        asset_width: null,
        asset_height: null,
        asset_mime_type: null,
        openai_file_id: null,
        target_url: variant.target_url,
        openai_ad_type: "chat_card",
        openai_ad_status: "paused",
        provider: context.source,
        provider_request_json: {},
        provider_response_json: {},
        openai_validation_json: {},
        error: null,
        status: "draft",
        review_status: "pending",
        metadata: { grounding: variant.grounding },
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }));
      variants.push(...created);
      return created;
    },
    async updateCreativeAssetResult(variant) {
      return variant;
    }
  };

  function getRun(runId: string) {
    const run = runs.find((item) => item.id === runId);
    if (!run) throw new Error(`Missing run ${runId}`);
    return run;
  }

  return repository;
}

import { describe, expect, it } from "vitest";

import {
  buildDeployPackageInput,
  buildOpenAiDeployPayload,
  runFakeDeploy,
  type FakeDeployRepository
} from "./deployments";
import { buildDeterministicPerformanceOutput } from "./performance";
import type { ExtractionReviewData } from "./extraction";
import type { Deployment, PerformanceSnapshot } from "./types";

const projectId = "00000000-0000-4000-8000-0000000000aa";
const campaignId = "10000000-0000-4000-8000-000000000001";
const adGroupId = "20000000-0000-4000-8000-000000000001";
const genericAdGroupId = "20000000-0000-4000-8000-000000000002";
const approvedCreativeId = "30000000-0000-4000-8000-000000000001";
const editedCreativeId = "30000000-0000-4000-8000-000000000002";
const pendingCreativeId = "30000000-0000-4000-8000-000000000003";
const conversationId = "40000000-0000-4000-8000-000000000001";
const pricingConversationId = "40000000-0000-4000-8000-000000000002";
const featureId = "50000000-0000-4000-8000-000000000001";
const gapId = "60000000-0000-4000-8000-000000000001";

describe("Spec 08 fake deploy and monitoring", () => {
  it("builds a deploy package from approved creatives and excludes pending selections", () => {
    const input = buildDeployPackageInput(reviewDataFixture(), {
      creativeVariantIds: [approvedCreativeId, pendingCreativeId]
    });

    expect(input.creatives.map((row) => row.id)).toEqual([approvedCreativeId]);
    expect(input.ad_groups.map((row) => row.id)).toEqual([adGroupId]);
    expect(input.campaign?.id).toBe(campaignId);
  });

  it("rejects a deploy package when selected creatives are not approved", () => {
    expect(() =>
      buildDeployPackageInput(reviewDataFixture(), {
        creativeVariantIds: [pendingCreativeId]
      })
    ).toThrow(/approve at least one creative/i);
  });

  it("creates an OpenAI Ads-shaped payload and flags prompt-only creatives as non-compatible", () => {
    const input = buildDeployPackageInput(reviewDataFixture(), {
      creativeVariantIds: [approvedCreativeId, editedCreativeId]
    });
    const payload = buildOpenAiDeployPayload(input, new Date("2026-05-16T08:00:00Z"));

    expect(payload.campaign).toMatchObject({
      name: "AtlasDesk - Gmail follow-up",
      objective: "Clicks"
    });
    expect(payload.ad_groups).toHaveLength(2);
    expect(payload.ads.map((ad) => ad.title)).toEqual(["Live by Friday", "Simple CRM"]);
    expect(payload.ads[0]).toMatchObject({
      type: "chat_card",
      image_url_for_bulk_upload: "https://atlasdesk.example/demo/live-by-friday.jpg",
      status: "paused"
    });
    expect(payload.openai_compatibility.compatible).toBe(false);
    expect(payload.openai_compatibility.issues).toContainEqual(
      expect.objectContaining({
        creative_variant_id: editedCreativeId,
        code: "missing_image_asset"
      })
    );
  });

  it("generates deterministic, internally consistent KPI rows tied to quality rules", () => {
    const input = buildDeployPackageInput(reviewDataFixture(), {
      creativeVariantIds: [approvedCreativeId, editedCreativeId]
    });
    const output = buildDeterministicPerformanceOutput(input, {
      deploymentId: "90000000-0000-4000-8000-000000000001",
      now: new Date("2026-05-16T08:00:00Z")
    });

    expect(output.snapshots).toHaveLength(2);
    const specific = output.snapshots.find((row) => row.creative_variant_id === approvedCreativeId);
    const generic = output.snapshots.find((row) => row.creative_variant_id === editedCreativeId);
    expect(specific?.quality_score).toBeGreaterThan(generic?.quality_score ?? 100);
    expect(specific?.metric_basis_json).toMatchObject({
      components: expect.arrayContaining([
        expect.objectContaining({ key: "specific_constraint_match" }),
        expect.objectContaining({ key: "asset_bonus" })
      ])
    });
    for (const row of output.snapshots) {
      expect(row.clicks).toBeLessThanOrEqual(row.impressions);
      expect(row.conversions).toBeLessThanOrEqual(row.clicks);
      expect(row.ctr).toBeCloseTo(row.clicks / row.impressions, 4);
      expect(row.cvr).toBeCloseTo(row.conversions / row.clicks, 4);
      expect(row.insight).not.toHaveLength(0);
      expect(row.recommended_action).not.toHaveLength(0);
    }
  });

  it("writes a deployment before materializing performance snapshots", async () => {
    const operations: string[] = [];
    const repository = createMemoryDeployRepository(reviewDataFixture(), operations);

    const result = await runFakeDeploy(
      {
        projectId,
        requestId: "req_spec_08",
        creativeVariantIds: [approvedCreativeId],
        generatePerformance: true
      },
      {
        repository,
        synthesisProvider: {
          isConfigured: () => false,
          async generate() {
            throw new Error("OpenAI should not be called when unconfigured");
          }
        }
      }
    );

    expect(result.status).toBe("fake_deployed");
    expect(result.performance_snapshot_ids).toHaveLength(1);
    expect(operations).toEqual([
      "getReviewData",
      "createDeployment",
      "materializePerformanceSnapshots",
      "updateDeploymentAfterPerformance",
      "markPackageDeployed"
    ]);
  });
});

function reviewDataFixture(): ExtractionReviewData {
  const base = {
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };

  return {
    project: {
      id: projectId,
      name: "AtlasDesk",
      brand_url: "https://atlasdesk.example",
      status: "creative_ready",
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
        description: "Fast setup proof for urgent teams.",
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
      },
      {
        id: pricingConversationId,
        project_id: projectId,
        extraction_run_id: null,
        text: "How much does this cost for a small team?",
        stage: "pricing_check",
        intent_type: "budget_validation",
        buyer_role: "finance",
        constraints_json: { constraints: [{ type: "budget", value: "small team price" }] },
        source_refs: [],
        confidence: 0.8,
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
    campaigns: [
      {
        id: campaignId,
        project_id: projectId,
        extraction_run_id: null,
        name: "AtlasDesk - Gmail follow-up",
        objective: "Clicks",
        status: "approved",
        start_date: "2026-05-16",
        end_date: "2026-06-15",
        lifetime_spend_limit_micros: 5_000_000,
        countries: ["US"],
        custom_instruction: "Bias toward Gmail setup speed.",
        rationale: "Approved demo campaign.",
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    ad_groups: [
      {
        id: adGroupId,
        project_id: projectId,
        campaign_id: campaignId,
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
        product_feed_item_ids: [],
        status: "creative_generated",
        review_status: "approved",
        metadata: {},
        ...base
      },
      {
        id: genericAdGroupId,
        project_id: projectId,
        campaign_id: campaignId,
        extraction_run_id: null,
        name: "Generic CRM angle",
        rationale: "Targets pricing-check buyers without enough specificity.",
        context_hints: ["small team CRM"],
        billing_event_type: "click",
        max_bid_micros: 3_000_000,
        target_stage: "pricing_check",
        target_intent: "budget_validation",
        conversation_ids: [pricingConversationId],
        feature_ids: [],
        landing_gap_ids: [],
        product_feed_item_ids: [],
        status: "creative_generated",
        review_status: "approved",
        metadata: {},
        ...base
      }
    ],
    creative_variants: [
      {
        id: approvedCreativeId,
        project_id: projectId,
        ad_group_id: adGroupId,
        extraction_run_id: null,
        title: "Live by Friday",
        description: "Launch Gmail follow-up for five reps before the week ends.",
        creative_angle: "specific timeline and setup proof",
        asset_type: "image",
        asset_prompt: "Square image of Gmail follow-up tasks.",
        asset_url: "https://atlasdesk.example/demo/live-by-friday.jpg",
        asset_storage_path: null,
        asset_generation_status: "ready",
        asset_width: 1024,
        asset_height: 1024,
        asset_mime_type: "image/jpeg",
        openai_file_id: null,
        target_url: "https://atlasdesk.example/gmail-setup",
        openai_ad_type: "chat_card",
        openai_ad_status: "paused",
        provider: "openai",
        provider_request_json: {},
        provider_response_json: {},
        openai_validation_json: {},
        error: null,
        status: "approved",
        review_status: "approved",
        metadata: {},
        ...base
      },
      {
        id: editedCreativeId,
        project_id: projectId,
        ad_group_id: genericAdGroupId,
        extraction_run_id: null,
        title: "Simple CRM",
        description: "A simple CRM for teams that want better follow-up.",
        creative_angle: "generic value prop",
        asset_type: "none",
        asset_prompt: null,
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
        provider: "openai",
        provider_request_json: {},
        provider_response_json: {},
        openai_validation_json: {},
        error: null,
        status: "approved",
        review_status: "edited",
        metadata: {},
        ...base
      },
      {
        id: pendingCreativeId,
        project_id: projectId,
        ad_group_id: adGroupId,
        extraction_run_id: null,
        title: "Pending CRM",
        description: "Pending creative should not deploy.",
        creative_angle: "pending",
        asset_type: "none",
        asset_prompt: null,
        asset_url: null,
        asset_storage_path: null,
        asset_generation_status: "skipped",
        asset_width: null,
        asset_height: null,
        asset_mime_type: null,
        openai_file_id: null,
        target_url: "https://atlasdesk.example/pending",
        openai_ad_type: "chat_card",
        openai_ad_status: "paused",
        provider: "openai",
        provider_request_json: {},
        provider_response_json: {},
        openai_validation_json: {},
        error: null,
        status: "draft",
        review_status: "pending",
        metadata: {},
        ...base
      }
    ],
    product_feed_items: [],
    human_reviews: []
  };
}

function createMemoryDeployRepository(
  data: ExtractionReviewData,
  operations: string[]
): FakeDeployRepository {
  const deployment: Deployment = {
    id: "90000000-0000-4000-8000-000000000001",
    project_id: projectId,
    status: "fake_deployed",
    deployed_at: "2026-05-16T08:00:00Z",
    payload_json: {},
    metadata: {},
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };

  return {
    async getReviewData(id) {
      operations.push("getReviewData");
      return id === projectId ? data : null;
    },
    async createDeployment(input) {
      operations.push("createDeployment");
      deployment.payload_json = input.payload_json;
      deployment.metadata = input.metadata;
      return deployment;
    },
    async materializePerformanceSnapshots(rows) {
      operations.push("materializePerformanceSnapshots");
      return rows.map((row, index): PerformanceSnapshot => ({
        ...row,
        id: `91000000-0000-4000-8000-00000000000${index + 1}`,
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }));
    },
    async updateDeploymentAfterPerformance(id, patch) {
      operations.push("updateDeploymentAfterPerformance");
      if (id !== deployment.id) throw new Error("wrong deployment");
      deployment.payload_json = { ...deployment.payload_json, ...patch.payload_json };
      deployment.metadata = { ...deployment.metadata, ...patch.metadata };
      return deployment;
    },
    async markPackageDeployed() {
      operations.push("markPackageDeployed");
    }
  };
}

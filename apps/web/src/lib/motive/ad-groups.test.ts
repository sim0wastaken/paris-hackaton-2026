import { describe, expect, it } from "vitest";

import {
  type AdGroupGenerationRepository,
  buildAdGroupGenerationInput,
  buildDeterministicAdGroupGenerationOutput,
  runAdGroupGeneration,
  type StructuredAdGroupProvider,
  validateAdGroupGenerationOutput
} from "./ad-groups";
import type { ExtractionReviewData, ExtractionRunRecord } from "./extraction";

const projectId = "00000000-0000-4000-8000-0000000000aa";
const conversationOneId = "10000000-0000-4000-8000-000000000001";
const conversationTwoId = "10000000-0000-4000-8000-000000000002";
const conversationRejectedId = "10000000-0000-4000-8000-000000000003";
const featureId = "20000000-0000-4000-8000-000000000001";
const pendingFeatureId = "20000000-0000-4000-8000-000000000002";
const gapId = "30000000-0000-4000-8000-000000000001";

describe("Spec 06 ad-group generation", () => {
  it("builds generation input from accepted extraction rows only", () => {
    const data = reviewDataFixture();
    data.conversations[0]!.review_status = "edited";
    data.conversations[1]!.review_status = "enriched";
    data.brand_features[0]!.review_status = "edited";
    data.landing_gaps[0]!.review_status = "enriched";
    const input = buildAdGroupGenerationInput(data);

    expect(input.approved_conversations.map((row) => row.id)).toEqual([
      conversationOneId,
      conversationTwoId
    ]);
    expect(input.approved_brand_features.map((row) => row.id)).toEqual([featureId]);
    expect(input.approved_landing_gaps.map((row) => row.id)).toEqual([gapId]);
    expect(input.campaign_defaults).toMatchObject({
      objective: "Clicks",
      lifetime_spend_limit_micros: 5_000_000,
      countries: ["US"]
    });
  });

  it("creates OpenAI Ads-compatible fallback groups from approved rows", () => {
    const input = buildAdGroupGenerationInput(reviewDataFixture());
    const output = buildDeterministicAdGroupGenerationOutput(input);
    const validated = validateAdGroupGenerationOutput(output, input);

    expect(validated.campaign).toMatchObject({
      objective: "Clicks",
      lifetime_spend_limit_micros: 5_000_000,
      countries: ["US"]
    });
    expect(validated.ad_groups).toHaveLength(2);
    expect(validated.ad_groups.every((group) => group.billing_event_type === "click")).toBe(true);
    expect(validated.ad_groups.every((group) => group.max_bid_micros === 3_000_000)).toBe(true);
    expect(validated.ad_groups.flatMap((group) => group.conversation_ids).sort()).toEqual([
      conversationOneId,
      conversationTwoId
    ]);
    expect(validated.ad_groups.flatMap((group) => group.conversation_ids)).not.toContain(conversationRejectedId);
    expect(validated.ad_groups.every((group) => group.context_hints.length > 0)).toBe(true);
  });

  it("rejects generated groups that reference non-approved conversations", () => {
    const input = buildAdGroupGenerationInput(reviewDataFixture());

    expect(() =>
      validateAdGroupGenerationOutput(
        {
          campaign: {
            name: "AtlasDesk - invalid",
            objective: "Clicks",
            lifetime_spend_limit_micros: 5_000_000,
            countries: ["US"],
            custom_instruction: "Use approved evidence only.",
            rationale: "Invalid because it links rejected evidence."
          },
          ad_groups: [
            {
              name: "Rejected evidence",
              rationale: "This should not persist.",
              context_hints: ["security approval"],
              billing_event_type: "click",
              max_bid_micros: 3_000_000,
              conversation_ids: [conversationRejectedId],
              linked_feature_ids: [featureId],
              linked_landing_gap_ids: [],
              linked_product_feed_item_ids: [],
              status: "draft",
              confidence: 0.4
            }
          ],
          rejected_conversation_ids: []
        },
        input
      )
    ).toThrow(/non-approved conversation/i);
  });

  it("falls back deterministically when a configured provider fails", async () => {
    const repository = createMemoryAdGroupGenerationRepository(reviewDataFixture());
    const provider: StructuredAdGroupProvider = {
      isConfigured: () => true,
      async generate() {
        throw new Error("provider timeout");
      }
    };

    const result = await runAdGroupGeneration(
      {
        projectId,
        requestId: "req_fallback"
      },
      { repository, provider }
    );

    expect(result.source).toBe("deterministic_fallback");
    expect(result.generation_run.status).toBe("succeeded");
    expect(result.generation_run.model).toBe("deterministic:fallback");
    expect(result.ad_groups).toHaveLength(2);
    expect(repository.runs[0]?.metadata.fallback_reason).toContain("provider timeout");
  });
});

function reviewDataFixture(): ExtractionReviewData {
  return {
    project: {
      id: projectId,
      name: "AtlasDesk",
      brand_url: "https://atlasdesk.example",
      status: "review",
      extra_context: "Founder-led revenue teams need Gmail-native setup by Friday.",
      metadata: {},
      created_at: "2026-05-16T08:00:00Z",
      updated_at: "2026-05-16T08:00:00Z"
    },
    sources: [],
    extraction_runs: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        project_id: projectId,
        phase: "source_recap",
        status: "succeeded",
        model: "seeded-demo",
        provider: "openai",
        prompt_version: "source_recap.2026-05-16",
        input_json: {},
        output_json: {
          positioning_summary: "AtlasDesk turns Gmail conversations into CRM-ready follow-up.",
          category: "B2B SaaS",
          one_sentence_offer: "Gmail-native CRM follow-up for small revenue teams.",
          constraints: [{ type: "timeline", value: "before Friday" }]
        },
        error: null,
        started_at: "2026-05-16T08:00:00Z",
        completed_at: "2026-05-16T08:00:01Z",
        duration_ms: 1000,
        attempt: 0,
        inngest_run_id: null,
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:01Z"
      }
    ],
    brand_features: [
      {
        id: featureId,
        project_id: projectId,
        extraction_run_id: null,
        type: "proof_point",
        title: "Live before Friday",
        description: "Fast setup helps urgent teams launch this week.",
        evidence: "Launch before Friday.",
        source_refs: [],
        confidence: 0.9,
        review_status: "approved",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      },
      {
        id: pendingFeatureId,
        project_id: projectId,
        extraction_run_id: null,
        type: "objection",
        title: "Security proof",
        description: "Pending feature should not be used.",
        evidence: null,
        source_refs: [],
        confidence: 0.6,
        review_status: "pending",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }
    ],
    conversations: [
      {
        id: conversationOneId,
        project_id: projectId,
        extraction_run_id: null,
        text: "Can we get the Gmail workflow live before Friday for five reps?",
        stage: "vendor_evaluation",
        intent_type: "urgency_timeline",
        buyer_role: "founder",
        constraints_json: {
          constraints: [{ type: "timeline", value: "before Friday", evidence: "Buyer asks about Friday." }]
        },
        source_refs: [],
        confidence: 0.9,
        review_status: "approved",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      },
      {
        id: conversationTwoId,
        project_id: projectId,
        extraction_run_id: null,
        text: "Can AtlasDesk import our spreadsheet notes without breaking HubSpot sync?",
        stage: "solution_compare",
        intent_type: "migration_risk",
        buyer_role: "revenue_lead",
        constraints_json: {
          constraints: [{ type: "integration", value: "HubSpot sync", evidence: "Buyer names HubSpot." }]
        },
        source_refs: [],
        confidence: 0.9,
        review_status: "approved",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      },
      {
        id: conversationRejectedId,
        project_id: projectId,
        extraction_run_id: null,
        text: "Rejected security row.",
        stage: "security_review",
        intent_type: "trust_check",
        buyer_role: "security",
        constraints_json: { constraints: [] },
        source_refs: [],
        confidence: 0.5,
        review_status: "rejected",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }
    ],
    landing_gaps: [
      {
        id: gapId,
        project_id: projectId,
        extraction_run_id: null,
        conversation_id: conversationOneId,
        gap_type: "setup_path",
        description: "The page promises fast setup but does not show the setup path.",
        suggested_fix: "Add a Friday launch checklist.",
        severity: 5,
        source_refs: [],
        review_status: "approved",
        metadata: {},
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }
    ],
    campaigns: [],
    ad_groups: [],
    creative_variants: [],
    product_feed_items: [],
    human_reviews: []
  };
}

function createMemoryAdGroupGenerationRepository(data: ExtractionReviewData) {
  const runs: ExtractionRunRecord[] = [];
  const repository: AdGroupGenerationRepository & { runs: ExtractionRunRecord[] } = {
    runs,
    async getReviewData(id) {
      return id === projectId ? data : null;
    },
    async createGenerationRun(input) {
      const run: ExtractionRunRecord = {
        id: "40000000-0000-4000-8000-000000000099",
        project_id: input.projectId,
        phase: "ad_groups",
        status: "running",
        model: input.model,
        provider: input.model.startsWith("openai:") ? "openai" : "deterministic",
        prompt_version: "ad_groups_v1",
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
    async materializeCampaignAndAdGroups(run, output, source) {
      const campaign = {
        id: "50000000-0000-4000-8000-000000000001",
        project_id: run.project_id,
        extraction_run_id: run.id,
        name: output.campaign.name,
        objective: output.campaign.objective,
        status: "draft" as const,
        start_date: "2026-05-16",
        end_date: "2026-06-15",
        lifetime_spend_limit_micros: output.campaign.lifetime_spend_limit_micros,
        countries: output.campaign.countries,
        custom_instruction: output.campaign.custom_instruction,
        rationale: output.campaign.rationale,
        review_status: "pending" as const,
        metadata: { source },
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      };
      const ad_groups = output.ad_groups.map((group, index) => ({
        id: `60000000-0000-4000-8000-00000000000${index + 1}`,
        project_id: run.project_id,
        campaign_id: campaign.id,
        extraction_run_id: run.id,
        name: group.name,
        rationale: group.rationale,
        context_hints: group.context_hints,
        billing_event_type: group.billing_event_type,
        max_bid_micros: group.max_bid_micros,
        target_stage: null,
        target_intent: null,
        conversation_ids: group.conversation_ids,
        feature_ids: group.linked_feature_ids,
        landing_gap_ids: group.linked_landing_gap_ids,
        product_feed_item_ids: group.linked_product_feed_item_ids,
        status: "draft" as const,
        review_status: "pending" as const,
        metadata: { source },
        created_at: "2026-05-16T08:00:00Z",
        updated_at: "2026-05-16T08:00:00Z"
      }));
      return { campaign, ad_groups };
    }
  };

  function getRun(runId: string) {
    const run = runs.find((item) => item.id === runId);
    if (!run) throw new Error(`Missing run ${runId}`);
    return run;
  }

  return repository;
}

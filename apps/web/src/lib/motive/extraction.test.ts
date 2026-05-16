import { describe, expect, it } from "vitest";

import { runExtractionPipeline } from "./extraction";
import type {
  ExtractionRepository,
  ExtractionRunRecord,
  ExtractionReviewData,
  StructuredExtractionProvider
} from "./extraction";
import type { ProjectRecord, SourceRecord } from "./projects";

const projectId = "00000000-0000-0000-0000-0000000000aa";
const sourceId = "10000000-0000-0000-0000-0000000000aa";

describe("Spec 04 extraction pipeline", () => {
  it("replays seeded demo phases into reviewable persisted rows", async () => {
    const repository = createMemoryExtractionRepository();
    const provider = createUnavailableProvider();

    const result = await runExtractionPipeline(
      {
        projectId,
        sourceIds: [sourceId],
        requestId: "req_demo",
        demoMode: true
      },
      { repository, provider }
    );

    expect(result.status).toBe("succeeded");
    expect(repository.reviewData.extraction_runs.map((run) => [run.phase, run.status])).toEqual([
      ["source_recap", "succeeded"],
      ["feature_map", "succeeded"],
      ["conversation_map", "succeeded"],
      ["intent_classification", "succeeded"],
      ["landing_gaps", "succeeded"],
      ["ad_groups", "succeeded"]
    ]);
    expect(repository.reviewData.brand_features.length).toBeGreaterThanOrEqual(6);
    expect(repository.reviewData.conversations.length).toBeGreaterThanOrEqual(4);
    expect(repository.reviewData.conversations.every((row) => row.stage && row.intent_type)).toBe(true);
    expect(repository.reviewData.landing_gaps.length).toBeGreaterThanOrEqual(2);
    expect(repository.reviewData.ad_groups.length).toBeGreaterThanOrEqual(2);
    expect(repository.project.status).toBe("review");
  });

  it("persists an OpenAI configuration failure without deleting queued downstream phases", async () => {
    const repository = createMemoryExtractionRepository();
    const provider = createUnavailableProvider();

    const result = await runExtractionPipeline(
      {
        projectId,
        sourceIds: [sourceId],
        requestId: "req_no_openai",
        demoMode: false
      },
      { repository, provider }
    );

    expect(result.status).toBe("failed");
    const [sourceRecap, featureMap] = repository.reviewData.extraction_runs;
    expect(sourceRecap?.phase).toBe("source_recap");
    expect(sourceRecap?.status).toBe("failed");
    expect(sourceRecap?.error).toContain("openai_not_configured");
    expect(featureMap?.phase).toBe("feature_map");
    expect(featureMap?.status).toBe("failed");
    expect(featureMap?.error).toContain("skipped_dependency_failed");
    expect(repository.reviewData.brand_features).toEqual([]);
    expect(repository.project.status).toBe("failed");
  });
});

function createUnavailableProvider(): StructuredExtractionProvider {
  return {
    isConfigured: () => false,
    async generate() {
      throw new Error("Provider should not be called without configuration");
    }
  };
}

function createMemoryExtractionRepository() {
  const project: ProjectRecord = {
    id: projectId,
    name: "AtlasDesk",
    brand_url: "https://atlasdesk.example",
    status: "extracting",
    extra_context: "Founder-led revenue teams need Gmail-native CRM follow-up by Friday.",
    metadata: {},
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };
  const source: SourceRecord = {
    id: sourceId,
    project_id: projectId,
    type: "text",
    name: "Seeded demo source",
    uri: null,
    raw_text:
      "AtlasDesk helps small revenue teams turn Gmail into a lightweight CRM. Buyers ask about spreadsheet migration, pricing clarity, HubSpot sync, and security proof.",
    extracted_text:
      "AtlasDesk helps small revenue teams turn Gmail into a lightweight CRM. Buyers ask about spreadsheet migration, pricing clarity, HubSpot sync, and security proof.",
    status: "processed",
    provider: null,
    provider_request_json: {},
    provider_response_json: {},
    metadata: { demo: true },
    error: null,
    created_at: "2026-05-16T08:00:00Z",
    updated_at: "2026-05-16T08:00:00Z"
  };
  const reviewData: ExtractionReviewData = {
    project,
    sources: [source],
    extraction_runs: [],
    brand_features: [],
    conversations: [],
    landing_gaps: [],
    ad_groups: [],
    human_reviews: []
  };

  const repository: ExtractionRepository & {
    project: ProjectRecord;
    reviewData: ExtractionReviewData;
  } = {
    project,
    reviewData,
    async getProject(id) {
      return id === projectId ? project : null;
    },
    async getProcessedSources(id, sourceIds) {
      if (id !== projectId) return [];
      const allowed = new Set(sourceIds);
      return reviewData.sources.filter(
        (item) => item.status === "processed" && (!allowed.size || allowed.has(item.id))
      );
    },
    async getReviewData(id) {
      return id === projectId ? reviewData : null;
    },
    async ensurePhaseRuns(id, phases, context) {
      for (const phase of phases) {
        if (!reviewData.extraction_runs.some((run) => run.phase === phase)) {
          reviewData.extraction_runs.push({
            id: `run-${phase}`,
            project_id: id,
            phase,
            status: "queued",
            model: null,
            provider: "openai",
            prompt_version: context.promptVersionByPhase[phase],
            input_json: {},
            output_json: {},
            error: null,
            started_at: null,
            completed_at: null,
            duration_ms: null,
            attempt: 0,
            inngest_run_id: null,
            metadata: { request_id: context.requestId },
            created_at: "2026-05-16T08:00:00Z",
            updated_at: "2026-05-16T08:00:00Z"
          } satisfies ExtractionRunRecord);
        }
      }
      return reviewData.extraction_runs;
    },
    async updateRunRunning(runId, patch) {
      const run = getRun(runId);
      Object.assign(run, {
        status: "running",
        model: patch.model,
        input_json: patch.input_json,
        error: null,
        started_at: "2026-05-16T08:00:01Z",
        attempt: run.attempt + 1
      });
      return run;
    },
    async updateRunSucceeded(runId, patch) {
      const run = getRun(runId);
      Object.assign(run, {
        status: "succeeded",
        output_json: patch.output_json,
        error: null,
        completed_at: "2026-05-16T08:00:02Z",
        duration_ms: 1000,
        metadata: { ...run.metadata, ...patch.metadata }
      });
      return run;
    },
    async updateRunFailed(runId, error) {
      const run = getRun(runId);
      Object.assign(run, {
        status: "failed",
        error: JSON.stringify(error),
        completed_at: "2026-05-16T08:00:02Z"
      });
      return run;
    },
    async updateProjectStatus(_id, status) {
      project.status = status;
    },
    async materializeFeatureMap(run, output) {
      reviewData.brand_features.push(
        ...output.features.map((feature, index) => ({
          id: `feature-${index + 1}`,
          project_id: run.project_id,
          extraction_run_id: run.id,
          type: feature.type,
          title: feature.title,
          description: feature.description,
          evidence: feature.evidence,
          source_refs: feature.source_refs,
          confidence: feature.confidence === "high" ? 0.9 : feature.confidence === "medium" ? 0.65 : 0.35,
          review_status: "pending" as const,
          metadata: { temp_id: feature.temp_id, buyer_relevance: feature.buyer_relevance },
          created_at: "2026-05-16T08:00:00Z",
          updated_at: "2026-05-16T08:00:00Z"
        }))
      );
      return reviewData.brand_features.map((row) => row.id);
    },
    async materializeConversationMap(run, output) {
      reviewData.conversations.push(
        ...output.conversations.map((conversation, index) => ({
          id: `conversation-${index + 1}`,
          project_id: run.project_id,
          extraction_run_id: run.id,
          text: conversation.conversation_text,
          stage: "",
          intent_type: "",
          buyer_role: conversation.buyer_role,
          constraints_json: { constraints: [] },
          source_refs: conversation.source_refs,
          confidence: conversation.confidence === "high" ? 0.9 : conversation.confidence === "medium" ? 0.65 : 0.35,
          review_status: "pending" as const,
          metadata: { temp_id: conversation.temp_id, trigger: conversation.trigger },
          created_at: "2026-05-16T08:00:00Z",
          updated_at: "2026-05-16T08:00:00Z"
        }))
      );
      return reviewData.conversations.map((row) => row.id);
    },
    async materializeIntentClassification(_run, output) {
      for (const classification of output.classifications) {
        const row = reviewData.conversations.find(
          (conversation) => conversation.metadata.temp_id === classification.conversation_temp_id
        );
        if (row) {
          row.stage = classification.stage;
          row.intent_type = classification.intent_type;
          row.buyer_role = classification.buyer_role;
          row.constraints_json = { constraints: classification.constraints };
          row.metadata = { ...row.metadata, classification_rationale: classification.rationale };
        }
      }
      return reviewData.conversations.map((row) => row.id);
    },
    async materializeLandingGaps(run, output) {
      reviewData.landing_gaps.push(
        ...output.gaps.map((gap, index) => ({
          id: `gap-${index + 1}`,
          project_id: run.project_id,
          extraction_run_id: run.id,
          conversation_id: reviewData.conversations.find(
            (conversation) => conversation.metadata.temp_id === gap.conversation_temp_id
          )?.id ?? null,
          gap_type: gap.gap_type,
          description: gap.description,
          suggested_fix: gap.suggested_fix,
          severity: gap.severity === "high" ? 5 : gap.severity === "medium" ? 3 : 2,
          source_refs: gap.source_refs,
          review_status: "pending" as const,
          metadata: { temp_id: gap.temp_id, page_area: gap.page_area, rationale: gap.rationale },
          created_at: "2026-05-16T08:00:00Z",
          updated_at: "2026-05-16T08:00:00Z"
        }))
      );
      return reviewData.landing_gaps.map((row) => row.id);
    },
    async materializeAdGroups(run, output) {
      reviewData.ad_groups.push(
        ...output.ad_groups.map((group, index) => ({
          id: `ad-group-${index + 1}`,
          project_id: run.project_id,
          campaign_id: null,
          extraction_run_id: run.id,
          name: group.name,
          rationale: group.rationale,
          context_hints: group.context_hints,
          billing_event_type: "click",
          max_bid_micros: 3000000,
          target_stage: null,
          target_intent: group.primary_intent,
          conversation_ids: reviewData.conversations
            .filter((conversation) => group.conversation_temp_ids.includes(String(conversation.metadata.temp_id)))
            .map((conversation) => conversation.id),
          feature_ids: [],
          landing_gap_ids: [],
          product_feed_item_ids: [],
          status: "draft" as const,
          review_status: "pending" as const,
          metadata: { temp_id: group.temp_id, angle: group.angle, priority: group.priority },
          created_at: "2026-05-16T08:00:00Z",
          updated_at: "2026-05-16T08:00:00Z"
        }))
      );
      return reviewData.ad_groups.map((row) => row.id);
    }
  };

  function getRun(runId: string) {
    const run = reviewData.extraction_runs.find((item) => item.id === runId);
    if (!run) throw new Error(`Missing run ${runId}`);
    return run;
  }

  return repository;
}

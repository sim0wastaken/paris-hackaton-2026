import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import type {
  ExtractionRepository,
  ExtractionReviewData,
  ExtractionRunRecord,
  Spec04ExtractionPhase
} from "./extraction";
import type { ProjectRecord, SourceRecord } from "./projects";
import type { AdGroup, BrandFeature, Conversation, HumanReview, LandingGap } from "./types";

type SupabaseAny = {
  from: (table: string) => SupabaseQuery;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type SupabaseResult = {
  data: unknown;
  error: SupabaseError | null;
};

type SupabaseQuery = PromiseLike<SupabaseResult> & {
  eq(column: string, value: string | number): SupabaseQuery;
  in(column: string, values: string[]): SupabaseQuery;
  insert(value: unknown): SupabaseQuery;
  maybeSingle(): Promise<SupabaseResult>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery;
  select(columns?: string): SupabaseQuery;
  single(): Promise<SupabaseResult>;
  update(value: unknown): SupabaseQuery;
};

export function createSupabaseExtractionRepository(): ExtractionRepository {
  const supabase: SupabaseAny = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async getProject(projectId) {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as ProjectRecord;
    },
    async getProcessedSources(projectId, sourceIds) {
      let query = supabase
        .from("sources")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "processed")
        .order("created_at", { ascending: true });
      if (sourceIds.length > 0) query = query.in("id", sourceIds);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SourceRecord[];
    },
    async getReviewData(projectId) {
      return getExtractionReviewData(supabase, projectId);
    },
    async ensurePhaseRuns(projectId, phases, context) {
      const runs: ExtractionRunRecord[] = [];
      for (const phase of phases) {
        const existing = await getPhaseRun(supabase, projectId, phase);
        if (existing) {
          runs.push(existing);
          continue;
        }

        const { data, error } = await supabase
          .from("extraction_runs")
          .insert({
            project_id: projectId,
            phase,
            status: "queued",
            provider: "openai",
            prompt_version: context.promptVersionByPhase[phase],
            input_json: {},
            output_json: {},
            attempt: 0,
            metadata: {
              request_id: context.requestId
            }
          })
          .select("*")
          .single();
        if (error) throw error;
        runs.push(data as ExtractionRunRecord);
      }
      return runs;
    },
    async updateRunRunning(runId, patch) {
      const run = await getRunById(supabase, runId);
      const { data, error } = await supabase
        .from("extraction_runs")
        .update({
          status: "running",
          model: patch.model,
          prompt_version: patch.prompt_version,
          input_json: patch.input_json,
          error: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          duration_ms: null,
          attempt: run.attempt + 1
        })
        .eq("id", runId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ExtractionRunRecord;
    },
    async updateRunSucceeded(runId, patch) {
      const run = await getRunById(supabase, runId);
      const completedAt = new Date();
      const durationMs = run.started_at
        ? Math.max(0, completedAt.getTime() - new Date(run.started_at).getTime())
        : null;
      const { data, error } = await supabase
        .from("extraction_runs")
        .update({
          status: "succeeded",
          output_json: patch.output_json,
          error: null,
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs,
          metadata: {
            ...asRecord(run.metadata),
            ...patch.metadata
          }
        })
        .eq("id", runId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ExtractionRunRecord;
    },
    async updateRunFailed(runId, errorPayload) {
      const { data, error } = await supabase
        .from("extraction_runs")
        .update({
          status: "failed",
          error: JSON.stringify(errorPayload),
          completed_at: new Date().toISOString()
        })
        .eq("id", runId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ExtractionRunRecord;
    },
    async updateProjectStatus(projectId, status) {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", projectId);
      if (error) throw error;
    },
    async materializeFeatureMap(run, output) {
      const existing = await existingRows<BrandFeature>(supabase, "brand_features", run.id);
      if (existing.length > 0) return existing.map((row) => row.id);

      const rows = output.features.map((feature) => ({
        project_id: run.project_id,
        extraction_run_id: run.id,
        type: feature.type,
        title: feature.title,
        description: feature.description,
        evidence: feature.evidence,
        source_refs: feature.source_refs,
        confidence: confidenceScore(feature.confidence),
        review_status: "pending",
        metadata: {
          temp_id: feature.temp_id,
          buyer_relevance: feature.buyer_relevance
        }
      }));
      if (rows.length === 0) return [];
      const { data, error } = await supabase.from("brand_features").insert(rows).select("*");
      if (error) throw error;
      return ((data ?? []) as BrandFeature[]).map((row) => row.id);
    },
    async materializeConversationMap(run, output) {
      const existing = await existingRows<Conversation>(supabase, "conversations", run.id);
      if (existing.length > 0) return existing.map((row) => row.id);

      const rows = output.conversations.map((conversation) => ({
        project_id: run.project_id,
        extraction_run_id: run.id,
        text: conversation.conversation_text,
        stage: "",
        intent_type: "",
        buyer_role: conversation.buyer_role,
        constraints_json: { constraints: [] },
        source_refs: conversation.source_refs,
        confidence: confidenceScore(conversation.confidence),
        review_status: "pending",
        metadata: {
          temp_id: conversation.temp_id,
          trigger: conversation.trigger,
          pain: conversation.pain,
          desired_outcome: conversation.desired_outcome,
          related_feature_temp_ids: conversation.related_feature_temp_ids
        }
      }));
      if (rows.length === 0) return [];
      const { data, error } = await supabase.from("conversations").insert(rows).select("*");
      if (error) throw error;
      return ((data ?? []) as Conversation[]).map((row) => row.id);
    },
    async materializeIntentClassification(run, output) {
      const conversations = await projectRows<Conversation>(supabase, "conversations", run.project_id);
      const updatedIds: string[] = [];
      for (const classification of output.classifications) {
        const conversation = conversations.find(
          (row) => asRecord(row.metadata).temp_id === classification.conversation_temp_id
        );
        if (!conversation) continue;

        const { data, error } = await supabase
          .from("conversations")
          .update({
            extraction_run_id: run.id,
            stage: classification.stage,
            intent_type: classification.intent_type,
            buyer_role: classification.buyer_role,
            constraints_json: { constraints: classification.constraints },
            confidence: confidenceScore(classification.confidence),
            metadata: {
              ...asRecord(conversation.metadata),
              classification_rationale: classification.rationale
            }
          })
          .eq("id", conversation.id)
          .select("id")
          .single();
        if (error) throw error;
        updatedIds.push(String((data as { id: string }).id));
      }
      return updatedIds;
    },
    async materializeLandingGaps(run, output) {
      const existing = await existingRows<LandingGap>(supabase, "landing_gaps", run.id);
      if (existing.length > 0) return existing.map((row) => row.id);

      const conversations = await projectRows<Conversation>(supabase, "conversations", run.project_id);
      const rows = output.gaps.map((gap) => ({
        project_id: run.project_id,
        extraction_run_id: run.id,
        conversation_id: conversations.find((row) => asRecord(row.metadata).temp_id === gap.conversation_temp_id)?.id ?? null,
        gap_type: gap.gap_type,
        description: gap.description,
        suggested_fix: gap.suggested_fix,
        severity: severityScore(gap.severity),
        source_refs: gap.source_refs,
        review_status: "pending",
        metadata: {
          temp_id: gap.temp_id,
          conversation_temp_id: gap.conversation_temp_id,
          page_area: gap.page_area,
          severity_label: gap.severity,
          rationale: gap.rationale
        }
      }));
      if (rows.length === 0) return [];
      const { data, error } = await supabase.from("landing_gaps").insert(rows).select("*");
      if (error) throw error;
      return ((data ?? []) as LandingGap[]).map((row) => row.id);
    },
    async materializeAdGroups(run, output) {
      const existing = await existingRows<AdGroup>(supabase, "ad_groups", run.id);
      if (existing.length > 0) return existing.map((row) => row.id);

      const conversations = await projectRows<Conversation>(supabase, "conversations", run.project_id);
      const gaps = await projectRows<LandingGap>(supabase, "landing_gaps", run.project_id);
      const rows = output.ad_groups.map((group) => ({
        project_id: run.project_id,
        campaign_id: null,
        extraction_run_id: run.id,
        name: group.name,
        rationale: group.rationale,
        context_hints: group.context_hints,
        billing_event_type: "click",
        max_bid_micros: 3_000_000,
        target_stage: null,
        target_intent: group.primary_intent,
        conversation_ids: conversations
          .filter((row) => group.conversation_temp_ids.includes(String(asRecord(row.metadata).temp_id)))
          .map((row) => row.id),
        feature_ids: [],
        landing_gap_ids: gaps
          .filter((row) => group.linked_landing_gap_temp_ids.includes(String(asRecord(row.metadata).temp_id)))
          .map((row) => row.id),
        product_feed_item_ids: [],
        status: "draft",
        review_status: "pending",
        metadata: {
          temp_id: group.temp_id,
          angle: group.angle,
          priority: group.priority,
          must_include_claims: group.must_include_claims,
          avoid_claims: group.avoid_claims
        }
      }));
      if (rows.length === 0) return [];
      const { data, error } = await supabase.from("ad_groups").insert(rows).select("*");
      if (error) throw error;
      return ((data ?? []) as AdGroup[]).map((row) => row.id);
    }
  };
}

export async function getExtractionReviewData(
  supabase: SupabaseAny = createSupabaseServiceRoleClient() as unknown as SupabaseAny,
  projectId: string
): Promise<ExtractionReviewData | null> {
  const projectResult = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectResult.error) {
    if (projectResult.error.code === "PGRST116") return null;
    throw projectResult.error;
  }

  const [
    sources,
    runs,
    features,
    conversations,
    gaps,
    adGroups,
    reviews
  ] = await Promise.all([
    supabase.from("sources").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("extraction_runs").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("brand_features").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("conversations").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("landing_gaps").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("ad_groups").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
    supabase.from("human_reviews").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
  ]);

  for (const result of [sources, runs, features, conversations, gaps, adGroups, reviews]) {
    if (result.error) throw result.error;
  }

  return {
    project: projectResult.data as ProjectRecord,
    sources: (sources.data ?? []) as SourceRecord[],
    extraction_runs: (runs.data ?? []) as ExtractionRunRecord[],
    brand_features: (features.data ?? []) as BrandFeature[],
    conversations: (conversations.data ?? []) as Conversation[],
    landing_gaps: (gaps.data ?? []) as LandingGap[],
    ad_groups: (adGroups.data ?? []) as AdGroup[],
    human_reviews: (reviews.data ?? []) as HumanReview[]
  };
}

async function getPhaseRun(
  supabase: SupabaseAny,
  projectId: string,
  phase: Spec04ExtractionPhase
): Promise<ExtractionRunRecord | null> {
  const { data, error } = await supabase
    .from("extraction_runs")
    .select("*")
    .eq("project_id", projectId)
    .eq("phase", phase)
    .eq("attempt", 0)
    .maybeSingle();
  if (error) throw error;
  return data as ExtractionRunRecord | null;
}

async function getRunById(supabase: SupabaseAny, runId: string): Promise<ExtractionRunRecord> {
  const { data, error } = await supabase
    .from("extraction_runs")
    .select("*")
    .eq("id", runId)
    .single();
  if (error) throw error;
  return data as ExtractionRunRecord;
}

async function existingRows<Row>(
  supabase: SupabaseAny,
  table: string,
  extractionRunId: string
): Promise<Row[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("extraction_run_id", extractionRunId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}

async function projectRows<Row>(
  supabase: SupabaseAny,
  table: string,
  projectId: string
): Promise<Row[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}

function confidenceScore(label: "low" | "medium" | "high"): number {
  if (label === "high") return 0.9;
  if (label === "medium") return 0.65;
  return 0.35;
}

function severityScore(label: "low" | "medium" | "high"): number {
  if (label === "high") return 5;
  if (label === "medium") return 3;
  return 2;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

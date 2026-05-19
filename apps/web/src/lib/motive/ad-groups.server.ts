import "server-only";

import {
  AD_GROUP_PROMPT_VERSION,
  DEFAULT_AD_GROUP_BID_MICROS,
  type AdGroupGenerationOutput,
  type AdGroupGenerationRepository
} from "./ad-groups";
import type { ExtractionRunRecord } from "./extraction";
import { getExtractionReviewData } from "./extraction.server";
import type { AdGroup, Campaign } from "./types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

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
  limit(count: number): SupabaseQuery;
  maybeSingle(): Promise<SupabaseResult>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery;
  select(columns?: string): SupabaseQuery;
  single(): Promise<SupabaseResult>;
  update(value: unknown): SupabaseQuery;
};

export function createSupabaseAdGroupGenerationRepository(): AdGroupGenerationRepository {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async getReviewData(projectId) {
      return getExtractionReviewData(supabase, projectId);
    },
    async createGenerationRun(input) {
      const attempt = await nextAdGroupAttempt(supabase, input.projectId);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("extraction_runs")
        .insert({
          project_id: input.projectId,
          phase: "ad_groups",
          status: "running",
          provider: input.model.startsWith("openai:") ? "openai" : "deterministic",
          model: input.model,
          prompt_version: AD_GROUP_PROMPT_VERSION,
          input_json: input.input_json,
          output_json: {},
          error: null,
          started_at: now,
          completed_at: null,
          duration_ms: null,
          attempt,
          metadata: {
            request_id: input.requestId,
            source: "spec_06"
          }
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as ExtractionRunRecord;
    },
    async updateGenerationRunSucceeded(runId, patch) {
      const run = await getRunById(supabase, runId);
      const completedAt = new Date();
      const durationMs = run.started_at
        ? Math.max(0, completedAt.getTime() - new Date(run.started_at).getTime())
        : null;
      const { data, error } = await supabase
        .from("extraction_runs")
        .update({
          status: "succeeded",
          model: patch.model,
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
    async updateGenerationRunFailed(runId, errorPayload) {
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
    async materializeCampaignAndAdGroups(run, output, source) {
      const campaign = await insertCampaign(supabase, run, output);
      const adGroups = await insertAdGroups(supabase, run, campaign.id, output, source);
      return { campaign, ad_groups: adGroups };
    }
  };
}

async function nextAdGroupAttempt(supabase: SupabaseAny, projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from("extraction_runs")
    .select("attempt")
    .eq("project_id", projectId)
    .eq("phase", "ad_groups")
    .order("attempt", { ascending: false })
    .limit(1);
  if (error) throw error;
  const latest = Array.isArray(data) ? (data[0] as { attempt?: number } | undefined) : undefined;
  return typeof latest?.attempt === "number" ? latest.attempt + 1 : 0;
}

async function insertCampaign(
  supabase: SupabaseAny,
  run: ExtractionRunRecord,
  output: AdGroupGenerationOutput
): Promise<Campaign> {
  const dates = campaignDates();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      project_id: run.project_id,
      extraction_run_id: run.id,
      name: output.campaign.name,
      objective: output.campaign.objective,
      status: "draft",
      start_date: dates.startDate,
      end_date: dates.endDate,
      lifetime_spend_limit_micros: output.campaign.lifetime_spend_limit_micros,
      countries: output.campaign.countries,
      custom_instruction: output.campaign.custom_instruction,
      rationale: output.campaign.rationale,
      review_status: "pending",
      metadata: {
        prompt_version: AD_GROUP_PROMPT_VERSION
      }
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Campaign;
}

async function insertAdGroups(
  supabase: SupabaseAny,
  run: ExtractionRunRecord,
  campaignId: string,
  output: AdGroupGenerationOutput,
  source: "openai" | "deterministic_fallback"
): Promise<AdGroup[]> {
  const rows = output.ad_groups.map((group) => ({
    project_id: run.project_id,
    campaign_id: campaignId,
    extraction_run_id: run.id,
    name: group.name,
    rationale: group.rationale,
    context_hints: group.context_hints,
    billing_event_type: group.billing_event_type,
    max_bid_micros: group.max_bid_micros || DEFAULT_AD_GROUP_BID_MICROS,
    target_stage: null,
    target_intent: null,
    conversation_ids: group.conversation_ids,
    feature_ids: group.linked_feature_ids,
    landing_gap_ids: group.linked_landing_gap_ids,
    product_feed_item_ids: group.linked_product_feed_item_ids,
    status: "draft",
    review_status: "pending",
    metadata: {
      confidence: group.confidence,
      source,
      prompt_version: AD_GROUP_PROMPT_VERSION
    }
  }));
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from("ad_groups")
    .insert(rows)
    .select("*");
  if (error) throw error;
  return (data ?? []) as AdGroup[];
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

function campaignDates() {
  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

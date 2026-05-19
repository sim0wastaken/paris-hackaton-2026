import "server-only";

import {
  CREATIVE_PROMPT_VERSION,
  type CreativeGenerationRepository,
  type CreativeAssetProvider
} from "./creatives";
import type { ExtractionRunRecord } from "./extraction";
import { getExtractionReviewData } from "./extraction.server";
import type { CreativeVariant } from "./types";
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

export function createSupabaseCreativeGenerationRepository(): CreativeGenerationRepository {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async getReviewData(projectId) {
      return getExtractionReviewData(supabase, projectId);
    },
    async createGenerationRun(input) {
      const attempt = await nextCreativeAttempt(supabase, input.projectId);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("extraction_runs")
        .insert({
          project_id: input.projectId,
          phase: "creative_text",
          status: "running",
          provider: input.model.startsWith("openai:") ? "openai" : "deterministic",
          model: input.model,
          prompt_version: CREATIVE_PROMPT_VERSION,
          input_json: input.input_json,
          output_json: {},
          error: null,
          started_at: now,
          completed_at: null,
          duration_ms: null,
          attempt,
          metadata: {
            request_id: input.requestId,
            source: "spec_07"
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
    async updateGenerationRunFailed(runId, errorPayload, outputJson = {}) {
      const { data, error } = await supabase
        .from("extraction_runs")
        .update({
          status: "failed",
          output_json: outputJson,
          error: JSON.stringify(errorPayload),
          completed_at: new Date().toISOString()
        })
        .eq("id", runId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ExtractionRunRecord;
    },
    async materializeCreativeVariants(run, output, context) {
      const rows = output.variants.map((variant) => ({
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
        asset_generation_status:
          context.assetMode === "fal.ai" && variant.asset_type === "image" ? "pending" : "skipped",
        asset_width: null,
        asset_height: null,
        asset_mime_type: null,
        openai_file_id: null,
        target_url: variant.target_url,
        openai_ad_type: "chat_card",
        openai_ad_status: "paused",
        provider: context.source === "openai" ? "openai" : "deterministic",
        provider_request_json: {
          prompt_version: CREATIVE_PROMPT_VERSION,
          extraction_run_id: run.id,
          ad_group_id: variant.ad_group_id,
          asset_generation_mode: context.assetMode
        },
        provider_response_json: {
          source: context.source,
          variant,
          raw: context.providerRaw
        },
        openai_validation_json: {
          title_max_50: variant.title.length <= 50,
          body_max_100: variant.description.length <= 100,
          target_url_valid: true,
          openai_ad_type: "chat_card"
        },
        error: null,
        status: "draft",
        review_status: "pending",
        metadata: {
          grounding: variant.grounding,
          risks: variant.risks,
          prompt_version: CREATIVE_PROMPT_VERSION,
          // Vertical-expert strategic choices (Schwartz/PAS-BAB-FAB/Motion/Harry Dry).
          strategy: {
            awareness_level: variant.awareness_level,
            copy_formula: variant.copy_formula,
            hook_archetype: variant.hook_archetype,
            verbatim_phrase: variant.verbatim_phrase,
            copy_self_check: variant.copy_self_check
          },
          image_strategy: {
            composition_archetype: variant.image_composition_archetype,
            subject: variant.image_subject,
            lighting: variant.image_lighting,
            lens: variant.image_lens,
            mood_keywords: variant.image_mood_keywords,
            self_check: variant.image_self_check
          }
        }
      }));
      if (rows.length === 0) return [];

      const { data, error } = await supabase
        .from("creative_variants")
        .insert(rows)
        .select("*");
      if (error) throw error;

      const adGroupIds = [...new Set(output.variants.map((variant) => variant.ad_group_id))];
      await markAdGroupsCreativeGenerated(supabase, adGroupIds);
      await markProjectCreativeReady(supabase, run.project_id);
      return (data ?? []) as CreativeVariant[];
    },
    async updateCreativeAssetResult(variant, result) {
      const patch = buildAssetPatch(variant, result);
      const { data, error } = await supabase
        .from("creative_variants")
        .update(patch)
        .eq("id", variant.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as CreativeVariant;
    }
  };
}

async function nextCreativeAttempt(supabase: SupabaseAny, projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from("extraction_runs")
    .select("attempt")
    .eq("project_id", projectId)
    .eq("phase", "creative_text")
    .order("attempt", { ascending: false })
    .limit(1);
  if (error) throw error;
  const latest = Array.isArray(data) ? (data[0] as { attempt?: number } | undefined) : undefined;
  return typeof latest?.attempt === "number" ? latest.attempt + 1 : 0;
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

async function markAdGroupsCreativeGenerated(supabase: SupabaseAny, adGroupIds: string[]): Promise<void> {
  if (adGroupIds.length === 0) return;
  const { error } = await supabase
    .from("ad_groups")
    .update({ status: "creative_generated" })
    .in("id", adGroupIds);
  if (error) throw error;
}

async function markProjectCreativeReady(supabase: SupabaseAny, projectId: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "creative_ready" })
    .eq("id", projectId);
  if (error) throw error;
}

function buildAssetPatch(
  variant: CreativeVariant,
  result: Awaited<ReturnType<CreativeAssetProvider["generateImage"]>>
) {
  const providerRequest = asRecord(variant.provider_request_json);
  const providerResponse = asRecord(variant.provider_response_json);
  if (result.status === "ready") {
    return {
      asset_url: result.data.imageUrl,
      asset_width: result.data.width ?? null,
      asset_height: result.data.height ?? null,
      asset_mime_type: result.data.mimeType ?? "image/jpeg",
      asset_generation_status: "ready",
      error: null,
      provider_request_json: {
        ...providerRequest,
        fal: {
          model: "fal-ai/flux/schnell",
          prompt: variant.asset_prompt,
          request_id: result.requestId
        }
      },
      provider_response_json: {
        ...providerResponse,
        fal: {
          status: "ready",
          raw: result.raw
        }
      }
    };
  }

  const reason = result.reason;
  return {
    asset_generation_status: result.status === "skipped" ? "skipped" : "failed",
    error: result.status === "skipped" ? null : reason,
    provider_request_json: {
      ...providerRequest,
      fal: {
        model: "fal-ai/flux/schnell",
        prompt: variant.asset_prompt,
        request_id: result.requestId
      }
    },
    provider_response_json: {
      ...providerResponse,
      fal: {
        status: result.status,
        reason,
        raw: result.status === "failed" ? result.raw ?? null : null
      }
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

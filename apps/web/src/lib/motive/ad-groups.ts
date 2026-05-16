import { z, type ZodType } from "zod";

import type { ExtractionReviewData, ExtractionRunRecord } from "./extraction";
import { isAcceptedReviewStatus } from "./review-status";
import {
  awarenessLevelValues,
  campaignObjectiveValues,
  funnelStageValues,
  type AdGroup,
  type AwarenessLevel,
  type Campaign,
  type FunnelStage,
  type ProductFeedItem
} from "./types";

export const AD_GROUP_PROMPT_VERSION = "ad_groups_v2_2026-05-16";
export const DEFAULT_CAMPAIGN_BUDGET_MICROS = 5_000_000;
export const DEFAULT_AD_GROUP_BID_MICROS = 3_000_000;
export const DEFAULT_COUNTRIES = ["US"] as const;

const adGroupGenerationCampaignSchema = z.object({
  name: z.string().trim().min(3),
  objective: z.enum(campaignObjectiveValues),
  lifetime_spend_limit_micros: z.number().int().min(1_000_000),
  countries: z.array(z.string().trim().length(2)).min(1),
  custom_instruction: z.string().trim().min(1),
  rationale: z.string().trim().min(1)
});

const looseUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID"
);

const adGroupSelfCheckSchema = z.object({
  tuple_unique: z.boolean(),
  name_is_buyer_voice: z.boolean(),
  funnel_stages_balanced: z.boolean()
});

const adGroupGenerationGroupSchema = z.object({
  name: z.string().trim().min(3),
  rationale: z.string().trim().min(1),
  context_hints: z.array(z.string().trim().min(1)).min(1),
  billing_event_type: z.enum(["click", "view"]),
  max_bid_micros: z.number().int().positive(),
  conversation_ids: z.array(looseUuidSchema).min(1),
  linked_feature_ids: z.array(looseUuidSchema),
  linked_landing_gap_ids: z.array(looseUuidSchema),
  linked_product_feed_item_ids: z.array(looseUuidSchema),
  status: z.literal("draft"),
  confidence: z.number().min(0).max(1),
  // Vertical-expert strategic shape — pain × persona × awareness matrix cell.
  // Nullable for back-compat with deterministic fallback.
  funnel_stage: z.enum(funnelStageValues).nullable(),
  awareness_stage: z.enum(awarenessLevelValues).nullable(),
  primary_pain_or_desire: z.string().trim().min(1).nullable(),
  verbatim_buyer_phrase: z.string().trim().min(1).nullable(),
  self_check: adGroupSelfCheckSchema.nullable()
});

export const adGroupGenerationOutputSchema = z.object({
  campaign: adGroupGenerationCampaignSchema,
  ad_groups: z.array(adGroupGenerationGroupSchema).min(1).max(5),
  rejected_conversation_ids: z.array(
    z.object({
      conversation_id: looseUuidSchema,
      reason: z.string().trim().min(1)
    })
  )
});

export type CampaignDefaults = {
  objective: "Clicks" | "Views";
  lifetime_spend_limit_micros: number;
  countries: string[];
  custom_instruction: string;
};

export type AdGroupGenerationInput = {
  project: {
    id: string;
    name: string;
    brand_url: string;
    extra_context?: string | null;
  };
  source_recap?: {
    summary: string;
    category?: string;
    icp?: string;
    offer?: string;
    constraints?: string[];
  };
  campaign_defaults: CampaignDefaults;
  approved_conversations: Array<{
    id: string;
    text: string;
    stage: string;
    intent_type: string;
    buyer_role: string | null;
    constraints_json: Record<string, unknown>;
    source_refs: unknown;
  }>;
  approved_brand_features: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    source_refs: unknown;
  }>;
  approved_landing_gaps: Array<{
    id: string;
    conversation_id: string | null;
    gap_type: string;
    description: string;
    suggested_fix: string;
  }>;
  approved_product_feed_items: Array<{
    id: string;
    title: string;
    description?: string | null;
    price?: string | null;
    availability?: string | null;
    product_type?: string | null;
  }>;
  existing_campaigns: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  existing_ad_groups: Array<{
    id: string;
    name: string;
    rationale: string;
    conversation_ids: string[];
    status: string;
  }>;
};

export type AdGroupGenerationOutput = z.infer<typeof adGroupGenerationOutputSchema>;

export type StructuredAdGroupProvider = {
  isConfigured(): boolean;
  generate<T>(input: {
    requestId: string;
    model: string;
    schemaName: string;
    schema: ZodType<T>;
    system: string;
    prompt: string;
  }): Promise<{
    output: T;
    raw: unknown;
    responseId: string | null;
    usage: Record<string, unknown>;
    model: string;
  }>;
};

export type AdGroupGenerationRepository = {
  getReviewData(projectId: string): Promise<ExtractionReviewData | null>;
  createGenerationRun(input: {
    projectId: string;
    model: string;
    input_json: Record<string, unknown>;
    requestId: string;
  }): Promise<ExtractionRunRecord>;
  updateGenerationRunSucceeded(
    runId: string,
    patch: {
      model: string;
      output_json: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }
  ): Promise<ExtractionRunRecord>;
  updateGenerationRunFailed(
    runId: string,
    error: {
      code: string;
      message: string;
      retryable: boolean;
    }
  ): Promise<ExtractionRunRecord>;
  materializeCampaignAndAdGroups(
    run: ExtractionRunRecord,
    output: AdGroupGenerationOutput,
    source: "openai" | "deterministic_fallback"
  ): Promise<{ campaign: Campaign; ad_groups: AdGroup[] }>;
};

export type RunAdGroupGenerationInput = {
  projectId: string;
  requestId: string;
  demoMode?: boolean;
  forceFallback?: boolean;
  campaignDefaults?: Partial<CampaignDefaults>;
};

export type RunAdGroupGenerationResult = {
  status: "succeeded";
  projectId: string;
  generation_run: ExtractionRunRecord;
  campaign: Campaign;
  ad_groups: AdGroup[];
  source: "openai" | "deterministic_fallback";
};

// System prompt — voiced as a senior B2B SaaS performance marketer.
// Embeds: pain × persona × awareness matrix (Motion), TOFU/MOFU/BOFU funnel, Wiebe message-mining for naming.
const SYSTEM_PROMPT = [
  "You are Motive's campaign structure planner — a senior B2B SaaS performance marketer.",
  "Create concise OpenAI Ads-compatible ad groups from approved, human-reviewed campaign intelligence only.",
  "Treat each ad group as one cell in the matrix (intent_type × buyer_role × stage). Do NOT merge cells with different awareness stages even if intent_type matches.",
  "Group names should sound like a phrase a real buyer in that segment would utter — not a marketing taxonomy label (Joanna Wiebe message-mining discipline).",
  "Banned puff: revolutionary, supercharge, leverage, unlock, seamless, game-changing, 10x, empower, streamline.",
  "Do not invent unprovided product claims.",
  "Do not use pending or rejected evidence.",
  "Return only the requested schema."
].join(" ");

export class AdGroupGenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "AdGroupGenerationError";
  }
}

export function buildAdGroupGenerationInput(
  data: ExtractionReviewData,
  campaignDefaults: Partial<CampaignDefaults> = {}
): AdGroupGenerationInput {
  const sourceRecapRun = [...data.extraction_runs]
    .reverse()
    .find((run) => run.phase === "source_recap" && run.status === "succeeded");
  const recap = asRecord(sourceRecapRun?.output_json);

  return {
    project: {
      id: data.project.id,
      name: data.project.name,
      brand_url: data.project.brand_url,
      extra_context: data.project.extra_context
    },
    source_recap: sourceRecapRun
      ? {
          summary: stringValue(recap.positioning_summary) || stringValue(recap.one_sentence_offer),
          category: stringValue(recap.category),
          offer: stringValue(recap.one_sentence_offer),
          constraints: arrayOfRecords(recap.constraints)
            .map((constraint) => stringValue(constraint.value))
            .filter(Boolean)
        }
      : undefined,
    campaign_defaults: {
      objective: campaignDefaults.objective ?? "Clicks",
      lifetime_spend_limit_micros: campaignDefaults.lifetime_spend_limit_micros ?? DEFAULT_CAMPAIGN_BUDGET_MICROS,
      countries: campaignDefaults.countries?.length ? campaignDefaults.countries : [...DEFAULT_COUNTRIES],
      custom_instruction:
        campaignDefaults.custom_instruction ??
        "Bias ad groups toward approved buyer conversations, proof needs, and OpenAI Ads context hints."
    },
    approved_conversations: data.conversations
      .filter((conversation) => isAcceptedReviewStatus(conversation.review_status))
      .map((conversation) => ({
        id: conversation.id,
        text: conversation.text,
        stage: conversation.stage,
        intent_type: conversation.intent_type,
        buyer_role: conversation.buyer_role,
        constraints_json: asRecord(conversation.constraints_json),
        source_refs: conversation.source_refs
      })),
    approved_brand_features: data.brand_features
      .filter((feature) => isAcceptedReviewStatus(feature.review_status))
      .map((feature) => ({
        id: feature.id,
        type: feature.type,
        title: feature.title,
        description: feature.description,
        source_refs: feature.source_refs
      })),
    approved_landing_gaps: data.landing_gaps
      .filter((gap) => isAcceptedReviewStatus(gap.review_status))
      .map((gap) => ({
        id: gap.id,
        conversation_id: gap.conversation_id,
        gap_type: gap.gap_type,
        description: gap.description,
        suggested_fix: gap.suggested_fix
      })),
    approved_product_feed_items: ((data.product_feed_items ?? []) as ProductFeedItem[])
      .filter((item) => isAcceptedReviewStatus(item.review_status))
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        availability: item.availability,
        product_type: item.product_type
      })),
    existing_campaigns: data.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status
    })),
    existing_ad_groups: data.ad_groups.map((group) => ({
      id: group.id,
      name: group.name,
      rationale: group.rationale,
      conversation_ids: group.conversation_ids,
      status: group.status
    }))
  };
}

export function buildDeterministicAdGroupGenerationOutput(
  input: AdGroupGenerationInput
): AdGroupGenerationOutput {
  ensureEnoughApprovedConversations(input);

  const campaignName = uniqueName(
    `${input.project.name} - Conversation campaign`,
    input.existing_campaigns.map((campaign) => campaign.name)
  );
  const groups = input.approved_conversations
    .map((conversation) => buildFallbackGroup(input, conversation))
    .slice(0, Math.min(5, input.approved_conversations.length));

  return {
    campaign: {
      name: campaignName,
      objective: input.campaign_defaults.objective,
      lifetime_spend_limit_micros: input.campaign_defaults.lifetime_spend_limit_micros,
      countries: input.campaign_defaults.countries,
      custom_instruction: input.campaign_defaults.custom_instruction,
      rationale: "Default campaign generated from approved Motive HITL evidence for OpenAI Ads."
    },
    ad_groups: groups,
    rejected_conversation_ids: input.approved_conversations
      .slice(groups.length)
      .map((conversation) => ({
        conversation_id: conversation.id,
        reason: "Skipped to keep the demo package focused on the strongest 2-5 groups."
      }))
  };
}

export function validateAdGroupGenerationOutput(
  output: unknown,
  input: AdGroupGenerationInput
): AdGroupGenerationOutput {
  const parsed = adGroupGenerationOutputSchema.safeParse(output);
  if (!parsed.success) {
    throw new AdGroupGenerationError(
      "invalid_ad_group_output",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      true
    );
  }

  ensureEnoughApprovedConversations(input);

  const approvedConversationIds = new Set(input.approved_conversations.map((conversation) => conversation.id));
  const approvedFeatureIds = new Set(input.approved_brand_features.map((feature) => feature.id));
  const approvedGapIds = new Set(input.approved_landing_gaps.map((gap) => gap.id));
  const approvedProductIds = new Set(input.approved_product_feed_items.map((item) => item.id));
  const seenGroupNames = new Set<string>();

  if (parsed.data.ad_groups.length > input.approved_conversations.length) {
    throw new AdGroupGenerationError(
      "too_many_ad_groups",
      "Generated more ad groups than approved conversations.",
      true
    );
  }

  const sanitizedGroups = parsed.data.ad_groups.map((group) => {
    const billingEventType: "click" | "view" = input.campaign_defaults.objective === "Views" ? "view" : "click";
    const normalizedName = normalizeWhitespace(group.name);
    const nameKey = normalizedName.toLowerCase();
    if (seenGroupNames.has(nameKey)) {
      throw new AdGroupGenerationError("duplicate_ad_group", `Duplicate ad group name: ${normalizedName}`, true);
    }
    seenGroupNames.add(nameKey);

    for (const conversationId of group.conversation_ids) {
      if (!approvedConversationIds.has(conversationId)) {
        throw new AdGroupGenerationError(
          "non_approved_conversation_reference",
          `Generated group references non-approved conversation ${conversationId}.`,
          true
        );
      }
    }
    for (const featureId of group.linked_feature_ids) {
      if (!approvedFeatureIds.has(featureId)) {
        throw new AdGroupGenerationError(
          "non_approved_feature_reference",
          `Generated group references non-approved feature ${featureId}.`,
          true
        );
      }
    }
    for (const gapId of group.linked_landing_gap_ids) {
      if (!approvedGapIds.has(gapId)) {
        throw new AdGroupGenerationError(
          "non_approved_landing_gap_reference",
          `Generated group references non-approved landing gap ${gapId}.`,
          true
        );
      }
    }
    for (const productId of group.linked_product_feed_item_ids) {
      if (!approvedProductIds.has(productId)) {
        throw new AdGroupGenerationError(
          "non_approved_product_reference",
          `Generated group references non-approved product feed item ${productId}.`,
          true
        );
      }
    }

    return {
      ...group,
      name: normalizedName,
      rationale: normalizeWhitespace(group.rationale),
      context_hints: distinctStrings(group.context_hints).slice(0, 8),
      billing_event_type: billingEventType,
      max_bid_micros: group.max_bid_micros || DEFAULT_AD_GROUP_BID_MICROS,
      status: "draft" as const
    };
  });

  return {
    campaign: {
      ...parsed.data.campaign,
      name: uniqueName(
        normalizeWhitespace(parsed.data.campaign.name),
        input.existing_campaigns.map((campaign) => campaign.name)
      ),
      objective: parsed.data.campaign.objective,
      countries: distinctStrings(parsed.data.campaign.countries.map((country) => country.toUpperCase())),
      custom_instruction: normalizeWhitespace(parsed.data.campaign.custom_instruction),
      rationale: normalizeWhitespace(parsed.data.campaign.rationale)
    },
    ad_groups: sanitizedGroups,
    rejected_conversation_ids: parsed.data.rejected_conversation_ids.filter((item) =>
      approvedConversationIds.has(item.conversation_id)
    )
  };
}

export async function runAdGroupGeneration(
  input: RunAdGroupGenerationInput,
  deps: {
    repository: AdGroupGenerationRepository;
    provider: StructuredAdGroupProvider;
    model?: string;
  }
): Promise<RunAdGroupGenerationResult> {
  const reviewData = await deps.repository.getReviewData(input.projectId);
  if (!reviewData) {
    throw new AdGroupGenerationError("project_not_found", `Project not found: ${input.projectId}`);
  }

  const generationInput = buildAdGroupGenerationInput(reviewData, input.campaignDefaults);
  ensureEnoughApprovedConversations(generationInput);

  const preferredModel = deps.model ?? process.env.OPENAI_AD_GROUP_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const shouldUseFallback = input.demoMode || input.forceFallback || !deps.provider.isConfigured();
  const initialModel = shouldUseFallback ? "deterministic:fallback" : `openai:${preferredModel}`;
  const run = await deps.repository.createGenerationRun({
    projectId: input.projectId,
    model: initialModel,
    input_json: generationInput as unknown as Record<string, unknown>,
    requestId: input.requestId
  });

  try {
    let fallbackReason = shouldUseFallback ? "fallback_requested_or_provider_unavailable" : null;
    let providerResult: Awaited<ReturnType<typeof callAdGroupProvider>> | null = null;

    if (!shouldUseFallback) {
      try {
        providerResult = await callAdGroupProvider(generationInput, {
          requestId: input.requestId,
          provider: deps.provider,
          model: preferredModel
        });
      } catch (providerError) {
        fallbackReason = providerError instanceof Error ? providerError.message : "provider_failed";
      }
    }

    let source: "openai" | "deterministic_fallback" = providerResult ? "openai" : "deterministic_fallback";
    let output: AdGroupGenerationOutput;

    if (providerResult) {
      try {
        output = validateAdGroupGenerationOutput(providerResult.output, generationInput);
      } catch (validationError) {
        source = "deterministic_fallback";
        fallbackReason = validationError instanceof Error ? validationError.message : "provider_output_invalid";
        output = validateAdGroupGenerationOutput(
          buildDeterministicAdGroupGenerationOutput(generationInput),
          generationInput
        );
      }
    } else {
      output = validateAdGroupGenerationOutput(
        buildDeterministicAdGroupGenerationOutput(generationInput),
        generationInput
      );
    }

    const materialized = await deps.repository.materializeCampaignAndAdGroups(run, output, source);
    const succeededRun = await deps.repository.updateGenerationRunSucceeded(run.id, {
      model: source === "openai" && providerResult ? `openai:${providerResult.model}` : "deterministic:fallback",
      output_json: output as unknown as Record<string, unknown>,
      metadata: {
        request_id: input.requestId,
        source,
        prompt_version: AD_GROUP_PROMPT_VERSION,
        provider_response_id: providerResult?.responseId ?? null,
        provider_usage_json: providerResult?.usage ?? {},
        fallback_reason: fallbackReason,
        materialized_campaign_id: materialized.campaign.id,
        materialized_ad_group_ids: materialized.ad_groups.map((group) => group.id)
      }
    });

    return {
      status: "succeeded",
      projectId: input.projectId,
      generation_run: succeededRun,
      campaign: materialized.campaign,
      ad_groups: materialized.ad_groups,
      source
    };
  } catch (caught) {
    const error = normalizeGenerationError(caught);
    await deps.repository.updateGenerationRunFailed(run.id, error);
    throw error;
  }
}

async function callAdGroupProvider(
  input: AdGroupGenerationInput,
  context: {
    requestId: string;
    provider: StructuredAdGroupProvider;
    model: string;
  }
) {
  return context.provider.generate({
    requestId: context.requestId,
    model: context.model,
    schemaName: "ad_group_generation",
    schema: adGroupGenerationOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: JSON.stringify({
      instructions: [
        "Produce 2-5 ad groups. Each ad group = one cell in (intent_type × buyer_role × stage). Do not merge cells with different awareness stages even if intent_type matches.",
        "For each ad group declare: funnel_stage ∈ {tofu, mofu, bofu}, awareness_stage ∈ {unaware, problem_aware, solution_aware, product_aware, most_aware}, primary_pain_or_desire (in buyer's words lifted from approved_conversations), verbatim_buyer_phrase (3-7 word slice from one approved conversation).",
        "Name pattern: \"{buyer language for the pain} — {buyer_role}, {stage}\". Example: \"Spreadsheet handoff is killing us — Revenue lead, Vendor evaluation\". Stage maps: problem_aware→problem_aware, solution_compare→solution_aware, vendor_evaluation/pricing_check/security_review→product_aware, ready_to_buy→most_aware.",
        "Awareness-stage mapping (Schwartz B2B): use the linked conversation's classified stage to derive awareness_stage with the same map above.",
        "Reject your own draft if two ad groups share the same (intent_type, buyer_role, stage) tuple. Re-split or merge.",
        "When ≥3 ad groups exist, the set should span at least 2 of {tofu, mofu, bofu} (TOFU/MOFU/BOFU budget tilt).",
        "context_hints must include at least one verbatim phrase from an approved conversation, in quotes.",
        "Populate self_check booleans honestly: tuple_unique, name_is_buyer_voice, funnel_stages_balanced. The calling code logs them; do not lie.",
        "Include only approved conversation ids. Avoid duplicates and near-duplicates.",
        "Use names that can become creative briefs (concrete, buyer-language)."
      ],
      input
    })
  });
}

function buildFallbackGroup(
  input: AdGroupGenerationInput,
  conversation: AdGroupGenerationInput["approved_conversations"][number]
): AdGroupGenerationOutput["ad_groups"][number] {
  const constraints = arrayOfRecords(asRecord(conversation.constraints_json).constraints);
  const primaryConstraint = constraints[0];
  const relatedGaps = input.approved_landing_gaps.filter((gap) => gap.conversation_id === conversation.id);
  const linkedFeatures = selectRelevantFeatures(input, conversation);
  const titleSeed = primaryConstraint
    ? `${stringValue(primaryConstraint.value)} ${intentLabel(conversation.intent_type)}`
    : relatedGaps[0]
      ? `${gapLabel(relatedGaps[0].gap_type)} ${stageLabel(conversation.stage)}`
      : `${buyerLabel(conversation.buyer_role)} ${intentLabel(conversation.intent_type)}`;

  return {
    name: titleCaseWords(titleSeed).slice(0, 72),
    rationale: `Targets approved ${intentLabel(conversation.intent_type)} demand from ${buyerLabel(conversation.buyer_role)} buyers using the reviewed conversation: "${truncate(conversation.text, 96)}"`,
    context_hints: distinctStrings([
      `"${truncate(conversation.text, 80)}"`,
      stringValue(primaryConstraint?.value),
      conversation.stage.replaceAll("_", " "),
      conversation.intent_type.replaceAll("_", " "),
      relatedGaps[0]?.gap_type.replaceAll("_", " ")
    ]).slice(0, 5),
    billing_event_type: input.campaign_defaults.objective === "Views" ? "view" : "click",
    max_bid_micros: DEFAULT_AD_GROUP_BID_MICROS,
    conversation_ids: [conversation.id],
    linked_feature_ids: linkedFeatures.map((feature) => feature.id),
    linked_landing_gap_ids: relatedGaps.map((gap) => gap.id),
    linked_product_feed_item_ids: [],
    status: "draft",
    confidence: relatedGaps.length > 0 || constraints.length > 0 ? 0.78 : 0.65,
    // Vertical-expert nullable fields — fallback derives sensible defaults from stage.
    funnel_stage: funnelStageForStage(conversation.stage),
    awareness_stage: awarenessForStage(conversation.stage),
    primary_pain_or_desire: truncate(conversation.text, 120),
    verbatim_buyer_phrase: extractVerbatimPhrase(conversation.text),
    self_check: null
  };
}

// Maps the Motive `stage` enum to the broader funnel taxonomy used by paid-social planners.
function funnelStageForStage(stage: string): FunnelStage {
  if (["problem_aware"].includes(stage)) return "tofu";
  if (["solution_compare", "vendor_evaluation"].includes(stage)) return "mofu";
  return "bofu";
}

// Maps the Motive `stage` enum to Schwartz awareness levels.
function awarenessForStage(stage: string): AwarenessLevel {
  switch (stage) {
    case "problem_aware":
      return "problem_aware";
    case "solution_compare":
      return "solution_aware";
    case "vendor_evaluation":
    case "pricing_check":
    case "security_review":
      return "product_aware";
    case "ready_to_buy":
    case "post_purchase":
      return "most_aware";
    default:
      return "problem_aware";
  }
}

// Lift a 3-7 word slice from buyer text — first noun phrase or just the opening fragment.
function extractVerbatimPhrase(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const words = normalized.split(" ").slice(0, 7).join(" ");
  return words.replace(/[.,!?;:]+$/, "");
}

function selectRelevantFeatures(
  input: AdGroupGenerationInput,
  conversation: AdGroupGenerationInput["approved_conversations"][number]
) {
  const conversationTokens = new Set(tokens(`${conversation.text} ${conversation.intent_type}`));
  const scored = input.approved_brand_features.map((feature) => {
    const featureTokens = tokens(`${feature.title} ${feature.description}`);
    const score = featureTokens.filter((token) => conversationTokens.has(token)).length;
    return { feature, score };
  });

  const matching = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.feature);

  return (matching.length ? matching : input.approved_brand_features).slice(0, 2);
}

function ensureEnoughApprovedConversations(input: AdGroupGenerationInput) {
  if (input.approved_conversations.length < 2) {
    throw new AdGroupGenerationError(
      "not_enough_approved_conversations",
      "Approve at least two conversation rows before generating ad groups."
    );
  }
}

function normalizeGenerationError(caught: unknown) {
  if (caught instanceof AdGroupGenerationError) {
    return {
      code: caught.code,
      message: caught.message,
      retryable: caught.retryable
    };
  }
  return {
    code: "ad_group_generation_failed",
    message: caught instanceof Error ? caught.message : "Ad-group generation failed.",
    retryable: true
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function distinctStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeWhitespace(String(value ?? ""));
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueName(name: string, existingNames: string[]): string {
  const existing = new Set(existingNames.map((item) => item.toLowerCase()));
  if (!existing.has(name.toLowerCase())) return name;
  let index = 2;
  while (existing.has(`${name} ${index}`.toLowerCase())) index += 1;
  return `${name} ${index}`;
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function titleCaseWords(value: string): string {
  return normalizeWhitespace(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function truncate(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function intentLabel(value: string): string {
  const labels: Record<string, string> = {
    workflow_pain: "workflow pain",
    migration_risk: "migration proof",
    proof_request: "proof seekers",
    budget_validation: "pricing clarity",
    trust_check: "trust proof",
    integration_check: "integration proof",
    urgency_timeline: "urgency",
    competitive_switch: "switchers"
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function stageLabel(value: string): string {
  const labels: Record<string, string> = {
    problem_aware: "problem aware",
    solution_compare: "solution evaluators",
    vendor_evaluation: "vendor evaluators",
    pricing_check: "pricing evaluators",
    security_review: "security reviewers",
    ready_to_buy: "ready buyers",
    post_purchase: "post purchase"
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function buyerLabel(value: string | null): string {
  if (!value || value === "unknown") return "buyer";
  return value.replaceAll("_", " ");
}

function gapLabel(value: string): string {
  const labels: Record<string, string> = {
    setup_path: "setup path",
    pricing_clarity: "pricing clarity",
    trust_compliance: "trust proof",
    integration_depth: "integration proof"
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

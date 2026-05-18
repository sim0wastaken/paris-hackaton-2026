import { z, type ZodType } from "zod";

import type { ExtractionReviewData, ExtractionRunRecord } from "./extraction";
import { isAcceptedReviewStatus } from "./review-status";
import {
  awarenessLevelValues,
  copyFormulaValues,
  hookArchetypeValues,
  imageCompositionArchetypeValues,
  type AdGroup,
  type BrandFeature,
  type Conversation,
  type CreativeVariant,
  type LandingGap,
  type ProductFeedItem,
} from "./types";
import { intentCopyStrategyMap, resolveCopyStrategy } from "./copy-map";
import type { ProviderResult } from "@/lib/providers/types";

export const CREATIVE_PROMPT_VERSION = "creative_text_v2_2026-05-16";
export const DEFAULT_CREATIVE_VARIANT_COUNT = 1;

// HARD-BANNED words that signal corporate puff and AI-generated copy.
// Source: Harry Dry visualizable/falsifiable/different rule + practitioner consensus.
const BANNED_COPY_TERMS = [
  "revolutionary",
  "supercharge",
  "leverage",
  "unlock",
  "seamless",
  "seamlessly",
  "game-changing",
  "game changer",
  "10x",
  "empower",
  "streamline",
];

const looseUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID"
);

const qualitySignalValues = [
  "specific_constraint",
  "proof_aligned",
  "gap_aware",
  "generic_angle",
  "pricing_unclear",
  "migration_setup_aligned"
] as const;

// Self-check sub-schema for copy quality (Harry Dry's 3 rules + banned-phrase guard).
const copySelfCheckSchema = z.object({
  visualizable: z.boolean(),
  falsifiable: z.boolean(),
  different: z.boolean(),
  banned_phrase_used: z.boolean()
}).strict();

// Self-check sub-schema for image prompt quality.
const imageSelfCheckSchema = z.object({
  subject_first: z.boolean(),
  no_banned_elements: z.boolean(),
  lighting_named: z.boolean(),
  composition_named: z.boolean(),
  archetype_matches_intent: z.boolean()
}).strict();

const creativeGenerationVariantSchema = z.object({
  ad_group_id: looseUuidSchema,
  title: z.string().trim().min(3).max(50),
  description: z.string().trim().min(1).max(100),
  creative_angle: z.string().trim().min(1),
  asset_type: z.enum(["image", "none"]),
  asset_prompt: z.string().trim().min(1),
  target_url: z.url(),
  grounding: z.object({
    conversation_ids: z.array(looseUuidSchema).min(1),
    brand_feature_ids: z.array(looseUuidSchema),
    landing_gap_ids: z.array(looseUuidSchema),
    product_feed_item_ids: z.array(looseUuidSchema),
    quality_signals: z.array(z.enum(qualitySignalValues)).min(1)
  }).strict(),
  risks: z.array(z.string().trim().min(1)),
  // Vertical-expert strategic choices (nullable for backward compat with deterministic fallback).
  awareness_level: z.enum(awarenessLevelValues).nullable(),
  copy_formula: z.enum(copyFormulaValues).nullable(),
  hook_archetype: z.enum(hookArchetypeValues).nullable(),
  verbatim_phrase: z.string().trim().min(1).nullable(),
  copy_self_check: copySelfCheckSchema.nullable(),
  // Structured image-prompt explainability (the composed_prompt is `asset_prompt` above).
  image_composition_archetype: z.enum(imageCompositionArchetypeValues).nullable(),
  image_subject: z.string().trim().min(1).nullable(),
  image_lighting: z.string().trim().min(1).nullable(),
  image_lens: z.string().trim().min(1).nullable(),
  image_mood_keywords: z.array(z.string().trim().min(1)).nullable(),
  image_self_check: imageSelfCheckSchema.nullable()
}).strict();

export const creativeGenerationOutputSchema = z.object({
  variants: z.array(creativeGenerationVariantSchema).min(1)
}).strict();

// Loose mirror of `creativeGenerationVariantSchema` for parsing the raw OpenAI
// response. OpenAI's strict structured-output mode rejects keywords like
// minLength/maxLength/pattern/format/minItems, so we strip them before sending
// (see stripUnsupportedStrictSchemaKeywords). The model can then return values
// that satisfy OpenAI's view of the schema but violate our Zod constraints —
// parsing with this loose schema first lets validateCreativeGenerationOutput
// raise a clearer CreativeGenerationError on the strict constraints downstream.
const creativeGenerationLooseVariantSchema = z.object({
  ad_group_id: z.string(),
  title: z.string(),
  description: z.string(),
  creative_angle: z.string(),
  asset_type: z.enum(["image", "none"]),
  asset_prompt: z.string(),
  target_url: z.string(),
  grounding: z.object({
    conversation_ids: z.array(z.string()),
    brand_feature_ids: z.array(z.string()),
    landing_gap_ids: z.array(z.string()),
    product_feed_item_ids: z.array(z.string()),
    quality_signals: z.array(z.enum(qualitySignalValues))
  }).strict(),
  risks: z.array(z.string()),
  awareness_level: z.enum(awarenessLevelValues).nullable(),
  copy_formula: z.enum(copyFormulaValues).nullable(),
  hook_archetype: z.enum(hookArchetypeValues).nullable(),
  verbatim_phrase: z.string().nullable(),
  copy_self_check: copySelfCheckSchema.nullable(),
  image_composition_archetype: z.enum(imageCompositionArchetypeValues).nullable(),
  image_subject: z.string().nullable(),
  image_lighting: z.string().nullable(),
  image_lens: z.string().nullable(),
  image_mood_keywords: z.array(z.string()).nullable(),
  image_self_check: imageSelfCheckSchema.nullable()
}).strict();

export const creativeGenerationLooseOutputSchema = z.object({
  variants: z.array(creativeGenerationLooseVariantSchema)
}).strict();

export type CreativeGenerationOutput = z.infer<typeof creativeGenerationOutputSchema>;
export type CreativeQualitySignal = (typeof qualitySignalValues)[number];

export type CreativeAdGroupContext = {
  ad_group: Pick<
    AdGroup,
    | "id"
    | "name"
    | "rationale"
    | "context_hints"
    | "target_stage"
    | "target_intent"
    | "conversation_ids"
    | "feature_ids"
    | "landing_gap_ids"
    | "product_feed_item_ids"
  >;
  conversations: Array<Pick<Conversation, "id" | "text" | "stage" | "intent_type" | "buyer_role" | "constraints_json">>;
  brand_features: Array<Pick<BrandFeature, "id" | "type" | "title" | "description">>;
  landing_gaps: Array<Pick<LandingGap, "id" | "gap_type" | "description" | "suggested_fix">>;
  product_feed_items: Array<Pick<
    ProductFeedItem,
    "id" | "title" | "description" | "link" | "price" | "availability" | "product_type"
  >>;
};

export type CreativeGenerationInput = {
  project: {
    id: string;
    name: string;
    brand_url: string;
    extra_context?: string | null;
  };
  variant_count: number;
  ad_group_contexts: CreativeAdGroupContext[];
  existing_creative_variants: Array<Pick<
    CreativeVariant,
    "id" | "ad_group_id" | "status" | "review_status" | "title"
  >>;
};

export type StructuredCreativeProvider = {
  isConfigured(): boolean;
  generate<T>(input: {
    requestId: string;
    model: string;
    schemaName: string;
    schema: ZodType<T>;
    parseSchema?: ZodType<T>;
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

export type CreativeAssetProvider = {
  isConfigured(): boolean;
  generateImage(input: {
    prompt: string;
    requestId: string;
  }): Promise<ProviderResult<{
    imageUrl?: string;
    width?: number;
    height?: number;
    mimeType?: string;
  }>>;
};

export type CreativeGenerationRepository = {
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
    },
    outputJson?: Record<string, unknown>
  ): Promise<ExtractionRunRecord>;
  materializeCreativeVariants(
    run: ExtractionRunRecord,
    output: CreativeGenerationOutput,
    context: {
      source: "openai" | "deterministic_fallback";
      assetMode: "fal.ai" | "skipped";
      providerRaw: unknown;
    }
  ): Promise<CreativeVariant[]>;
  updateCreativeAssetResult(
    variant: CreativeVariant,
    result: Awaited<ReturnType<CreativeAssetProvider["generateImage"]>>
  ): Promise<CreativeVariant>;
};

export type RunCreativeGenerationInput = {
  projectId: string;
  requestId: string;
  adGroupIds?: string[];
  variantCount?: number;
  generateAssets?: boolean;
  regenerate?: boolean;
  demoMode?: boolean;
  forceFallback?: boolean;
};

export type RunCreativeGenerationResult = {
  status: "succeeded";
  project_id: string;
  generation_run: ExtractionRunRecord | null;
  creative_variants: CreativeVariant[];
  created_variant_ids: string[];
  source: "openai" | "deterministic_fallback" | "existing";
  asset_generation: {
    mode: "fal.ai" | "skipped";
    skipped_count: number;
    failed_count: number;
    ready_count: number;
  };
};

// System prompt — voiced as senior B2B SaaS performance marketer + copywriter + art director.
// Embeds: Harry Dry rules, Schwartz awareness, copy-formula picker, hook archetypes,
// FLUX image composition, FTC claim safety, banned-puff list.
const SYSTEM_PROMPT = [
  "You are Motive's creative strategist: a senior B2B SaaS performance marketer collaborating with a senior copywriter and an art director.",
  "Generate grounded ad copy and visual prompts from approved ad groups and approved evidence only.",
  "Voice discipline: sentence-case headlines, no exclamation points, no emojis. Never use these words:",
  BANNED_COPY_TERMS.join(", ") + ".",
  "Claim safety (FTC Endorsement Guides): no metric that is not in approved brand_features; no #1/best/fastest without a cited proof_point; no fabricated testimonials or quoted reviews; refuse any claim that would require FTC substantiation and add a `risks` entry instead.",
  "Channel fit: paid social newsfeed (Meta/LinkedIn), not Google Search. First 24 characters of the title carry the hook.",
  "Grounding contract: every variant must trace to (1) exactly one approved conversation, (2) at least one proof anchor (brand feature or product feed item), (3) at most one landing gap acknowledged as a `risks` entry — never as a benefit claim.",
  "Return only the requested schema."
].join(" ");

export class CreativeGenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "CreativeGenerationError";
  }
}

export function buildCreativeGenerationInput(
  data: ExtractionReviewData,
  options: {
    adGroupIds?: string[];
    variantCount?: number;
    regenerate?: boolean;
  } = {}
): CreativeGenerationInput {
  const requestedIds = new Set(options.adGroupIds ?? []);
  const knownAdGroupIds = new Set(data.ad_groups.map((group) => group.id));
  for (const id of requestedIds) {
    if (!knownAdGroupIds.has(id)) {
      throw new CreativeGenerationError("ad_group_not_found", `Ad group does not belong to this project: ${id}`);
    }
  }

  const approvedAdGroups = data.ad_groups.filter((group) => {
    const selected = requestedIds.size === 0 || requestedIds.has(group.id);
    const eligibleStatus = group.status === "approved" || group.status === "creative_generated";
    return selected && eligibleStatus && isAcceptedReviewStatus(group.review_status);
  });

  if (approvedAdGroups.length === 0) {
    throw new CreativeGenerationError(
      "no_approved_ad_groups",
      "Approve at least one ad group before generating creatives."
    );
  }

  const activeExisting = data.creative_variants.filter(isActiveCreativeVariant);
  const targetAdGroups = options.regenerate
    ? approvedAdGroups
    : approvedAdGroups.filter((group) => !activeExisting.some((variant) => variant.ad_group_id === group.id));
  if (targetAdGroups.length === 0) {
    return {
      project: {
        id: data.project.id,
        name: data.project.name,
        brand_url: data.project.brand_url,
        extra_context: data.project.extra_context
      },
      variant_count: normalizedVariantCount(options.variantCount),
      ad_group_contexts: [],
      existing_creative_variants: activeExisting.filter((variant) =>
        requestedIds.size === 0 || requestedIds.has(variant.ad_group_id)
      )
    };
  }

  const contexts = targetAdGroups
    .map((group) => buildAdGroupContext(group, data))
    .filter((context) => hasSourceGrounding(context));
  if (contexts.length === 0) {
    throw new CreativeGenerationError(
      "missing_source_grounding",
      "Approved ad groups need linked approved conversations and proof before creative generation.",
      true
    );
  }

  return {
    project: {
      id: data.project.id,
      name: data.project.name,
      brand_url: data.project.brand_url,
      extra_context: data.project.extra_context
    },
    variant_count: normalizedVariantCount(options.variantCount),
    ad_group_contexts: contexts,
    existing_creative_variants: activeExisting.filter((variant) =>
      requestedIds.size === 0 || requestedIds.has(variant.ad_group_id)
    )
  };
}

export function buildDeterministicCreativeGenerationOutput(
  input: CreativeGenerationInput
): CreativeGenerationOutput {
  ensureCreativeTargets(input);

  return {
    variants: input.ad_group_contexts.flatMap((context) =>
      Array.from({ length: input.variant_count }, (_, index) => buildFallbackVariant(input, context, index))
    )
  };
}

export function validateCreativeGenerationOutput(
  output: unknown,
  input: CreativeGenerationInput
): CreativeGenerationOutput {
  const parsed = creativeGenerationOutputSchema.safeParse(output);
  if (!parsed.success) {
    throw new CreativeGenerationError(
      "invalid_creative_output",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      true
    );
  }
  ensureCreativeTargets(input);

  const contextByAdGroupId = new Map(input.ad_group_contexts.map((context) => [context.ad_group.id, context]));
  const maxVariants = input.ad_group_contexts.length * input.variant_count;
  if (parsed.data.variants.length > maxVariants) {
    throw new CreativeGenerationError(
      "too_many_creatives",
      `Generated ${parsed.data.variants.length} variants for a ${maxVariants}-variant request.`,
      true
    );
  }

  return {
    variants: parsed.data.variants.map((variant) => {
      const context = contextByAdGroupId.get(variant.ad_group_id);
      if (!context) {
        throw new CreativeGenerationError(
          "unknown_ad_group_reference",
          `Generated creative references non-target ad group ${variant.ad_group_id}.`,
          true
        );
      }

      assertSubset("conversation", variant.grounding.conversation_ids, context.conversations.map((row) => row.id));
      assertSubset("brand feature", variant.grounding.brand_feature_ids, context.brand_features.map((row) => row.id));
      assertSubset("landing gap", variant.grounding.landing_gap_ids, context.landing_gaps.map((row) => row.id));
      assertSubset("product", variant.grounding.product_feed_item_ids, context.product_feed_items.map((row) => row.id));

      return {
        ...variant,
        title: normalizeWhitespace(variant.title),
        description: normalizeWhitespace(variant.description),
        creative_angle: normalizeWhitespace(variant.creative_angle),
        asset_prompt: normalizeWhitespace(variant.asset_prompt),
        risks: distinctStrings(variant.risks.map(normalizeWhitespace))
      };
    })
  };
}

export async function runCreativeGeneration(
  input: RunCreativeGenerationInput,
  deps: {
    repository: CreativeGenerationRepository;
    provider: StructuredCreativeProvider;
    assetProvider: CreativeAssetProvider;
    model?: string;
  }
): Promise<RunCreativeGenerationResult> {
  const reviewData = await deps.repository.getReviewData(input.projectId);
  if (!reviewData) {
    throw new CreativeGenerationError("project_not_found", `Project not found: ${input.projectId}`);
  }

  const generationInput = buildCreativeGenerationInput(reviewData, {
    adGroupIds: input.adGroupIds,
    variantCount: input.variantCount,
    regenerate: input.regenerate
  });

  if (generationInput.ad_group_contexts.length === 0) {
    const existing = reviewData.creative_variants.filter((variant) =>
      generationInput.existing_creative_variants.some((item) => item.id === variant.id)
    );
    return summarizeCreativeResult({
      projectId: input.projectId,
      run: null,
      variants: existing,
      source: "existing",
      assetMode: "skipped"
    });
  }

  const preferredModel = deps.model ?? process.env.OPENAI_CREATIVE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const shouldUseFallback = input.demoMode || input.forceFallback;
  const run = await deps.repository.createGenerationRun({
    projectId: input.projectId,
    model: shouldUseFallback ? "deterministic:fallback" : `openai:${preferredModel}`,
    input_json: generationInput as unknown as Record<string, unknown>,
    requestId: input.requestId
  });

  let failedOutputJson: Record<string, unknown> = {};
  try {
    let providerResult: Awaited<ReturnType<typeof callCreativeProvider>> | null = null;
    let output: CreativeGenerationOutput;
    let source: "openai" | "deterministic_fallback" = "deterministic_fallback";

    if (shouldUseFallback) {
      output = validateCreativeGenerationOutput(
        buildDeterministicCreativeGenerationOutput(generationInput),
        generationInput
      );
    } else {
      if (!deps.provider.isConfigured()) {
        throw new CreativeGenerationError(
          "openai_not_configured",
          "OPENAI_API_KEY is not configured for creative generation.",
          true
        );
      }
      providerResult = await callCreativeProvider(generationInput, {
        requestId: input.requestId,
        provider: deps.provider,
        model: preferredModel
      });
      failedOutputJson = asFailureOutputJson(providerResult.raw ?? providerResult.output);
      output = validateCreativeGenerationOutput(providerResult.output, generationInput);
      source = "openai";
    }

    const assetMode = input.generateAssets !== false && deps.assetProvider.isConfigured() ? "fal.ai" : "skipped";
    const materialized = await deps.repository.materializeCreativeVariants(run, output, {
      source,
      assetMode,
      providerRaw: providerResult?.raw ?? output
    });
    const variants = await generateAssetsForVariants({
      variants: materialized,
      requestId: input.requestId,
      assetMode,
      repository: deps.repository,
      assetProvider: deps.assetProvider
    });
    const succeededRun = await deps.repository.updateGenerationRunSucceeded(run.id, {
      model: source === "openai" && providerResult ? `openai:${providerResult.model}` : "deterministic:fallback",
      output_json: output as unknown as Record<string, unknown>,
      metadata: {
        request_id: input.requestId,
        source,
        prompt_version: CREATIVE_PROMPT_VERSION,
        provider_response_id: providerResult?.responseId ?? null,
        provider_usage_json: providerResult?.usage ?? {},
        materialized_creative_variant_ids: variants.map((variant) => variant.id),
        asset_generation_mode: assetMode
      }
    });

    return summarizeCreativeResult({
      projectId: input.projectId,
      run: succeededRun,
      variants,
      source,
      assetMode
    });
  } catch (caught) {
    const error = normalizeCreativeError(caught);
    await deps.repository.updateGenerationRunFailed(run.id, error, failedOutputJson);
    throw new CreativeGenerationError(error.code, error.message, error.retryable);
  }
}

function buildAdGroupContext(group: AdGroup, data: ExtractionReviewData): CreativeAdGroupContext {
  const conversationIds = new Set(group.conversation_ids);
  const featureIds = new Set(group.feature_ids);
  const landingGapIds = new Set(group.landing_gap_ids);
  const productIds = new Set(group.product_feed_item_ids);

  return {
    ad_group: {
      id: group.id,
      name: group.name,
      rationale: group.rationale,
      context_hints: group.context_hints,
      target_stage: group.target_stage,
      target_intent: group.target_intent,
      conversation_ids: group.conversation_ids,
      feature_ids: group.feature_ids,
      landing_gap_ids: group.landing_gap_ids,
      product_feed_item_ids: group.product_feed_item_ids
    },
    conversations: data.conversations
      .filter((row) => isAcceptedReviewStatus(row.review_status) && conversationIds.has(row.id))
      .map((row) => ({
        id: row.id,
        text: row.text,
        stage: row.stage,
        intent_type: row.intent_type,
        buyer_role: row.buyer_role,
        constraints_json: row.constraints_json
      })),
    brand_features: data.brand_features
      .filter((row) => isAcceptedReviewStatus(row.review_status) && featureIds.has(row.id))
      .map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description
      })),
    landing_gaps: data.landing_gaps
      .filter((row) => isAcceptedReviewStatus(row.review_status) && landingGapIds.has(row.id))
      .map((row) => ({
        id: row.id,
        gap_type: row.gap_type,
        description: row.description,
        suggested_fix: row.suggested_fix
      })),
    product_feed_items: data.product_feed_items
      .filter((row) => isAcceptedReviewStatus(row.review_status) && productIds.has(row.id))
      .map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        link: row.link,
        price: row.price,
        availability: row.availability,
        product_type: row.product_type
      }))
  };
}

function hasSourceGrounding(context: CreativeAdGroupContext): boolean {
  return context.conversations.length > 0
    && (context.brand_features.length > 0 || context.landing_gaps.length > 0 || context.product_feed_items.length > 0);
}

function buildFallbackVariant(
  input: CreativeGenerationInput,
  context: CreativeAdGroupContext,
  index: number
): CreativeGenerationOutput["variants"][number] {
  const conversation = context.conversations[index % context.conversations.length] ?? context.conversations[0];
  const feature = context.brand_features[index % Math.max(1, context.brand_features.length)];
  const gap = context.landing_gaps[index % Math.max(1, context.landing_gaps.length)];
  const product = context.product_feed_items[index % Math.max(1, context.product_feed_items.length)];
  const title = clipToLimit(buildFallbackTitle(context, conversation, feature, gap), 50);
  const description = clipToLimit(buildFallbackDescription(context, conversation, feature, gap, product), 100);
  const qualitySignals = fallbackQualitySignals(conversation, feature, gap);

  // Resolve vertical-expert strategic choices from the conditional copy map.
  const intentKey = conversation.intent_type as string;
  const strategy = intentCopyStrategyMap[intentKey] ?? null;
  const archetype = strategy?.image_composition_archetype ?? null;
  const composedAssetPrompt = clipToLimit(
    buildFallbackAssetPrompt(context, conversation, feature, gap, archetype),
    700
  );

  return {
    ad_group_id: context.ad_group.id,
    title,
    description,
    creative_angle: fallbackCreativeAngle(conversation, gap),
    asset_type: "image",
    asset_prompt: composedAssetPrompt,
    target_url: product?.link ?? input.project.brand_url,
    grounding: {
      conversation_ids: [conversation.id],
      brand_feature_ids: feature ? [feature.id] : [],
      landing_gap_ids: gap ? [gap.id] : [],
      product_feed_item_ids: product ? [product.id] : [],
      quality_signals: qualitySignals
    },
    risks: gap?.gap_type === "pricing_clarity"
      ? ["Pricing claim depends on landing-page clarity."]
      : [],
    // Strategic explainability fields: deterministic fallback emits the framework picks
    // when an intent strategy is available; otherwise null (model will fill in real runs).
    awareness_level: strategy?.awareness_default ?? null,
    copy_formula: strategy?.copy_formula ?? null,
    hook_archetype: strategy?.hook_archetypes?.[0] ?? null,
    verbatim_phrase: null,
    copy_self_check: null,
    image_composition_archetype: archetype,
    image_subject: null,
    image_lighting: null,
    image_lens: null,
    image_mood_keywords: null,
    image_self_check: null
  };
}

// Builds a FLUX-correct natural-language asset prompt for the deterministic fallback.
// Subject-first, then environment, lighting, lens, mood, palette, negative constraints.
function buildFallbackAssetPrompt(
  context: CreativeAdGroupContext,
  conversation: CreativeAdGroupContext["conversations"][number],
  feature: CreativeAdGroupContext["brand_features"][number] | undefined,
  gap: CreativeAdGroupContext["landing_gaps"][number] | undefined,
  archetype: string | null
): string {
  const subjectByArchetype: Record<string, string> = {
    single_protagonist_at_workspace:
      "A focused B2B operator at a wooden desk reviewing notes on a laptop screen, slightly furrowed brow",
    object_macro_with_context:
      "Macro shot of a single handwritten Post-it note on a coffee-stained desk, next to a closed laptop",
    before_after_diptych:
      "A split-frame image: left side a cluttered tab-stack of spreadsheet rows, right side a clean single dashboard view",
    paper_artifact_on_desk:
      "Top-down view of a napkin with handwritten pricing math next to a half-drunk espresso cup",
    dim_room_late_night:
      "A single founder lit by laptop glow at a kitchen table at 11pm, calm not panicked, decisive",
    meeting_aftermath:
      "A meeting room after everyone has left: post-it notes on a glass wall, empty paper cups, marker on the table"
  };
  const subject = archetype && subjectByArchetype[archetype]
    ? subjectByArchetype[archetype]
    : `A B2B operator working on the ${context.ad_group.name.toLowerCase()} workflow`;
  const lighting = archetype === "dim_room_late_night"
    ? "single warm desk lamp and laptop screen, 11pm key lighting"
    : "soft overcast morning window light";
  const lens = archetype === "object_macro_with_context"
    ? "100mm macro lens, shallow depth of field"
    : "35mm prime lens, shallow depth of field, eye-level";
  const moodCue = gap?.gap_type === "pricing_clarity"
    ? "Mood: candid, deliberate, slightly skeptical"
    : "Mood: candid, focused, professional";
  const groundingLine = [
    conversation ? `Reflects buyer concern: "${conversation.text.slice(0, 90)}"` : "",
    feature ? `Visually nods to proof point: ${feature.title}.` : ""
  ].filter(Boolean).join(" ");

  return [
    `${subject}.`,
    `Lit by ${lighting}.`,
    `Shot on ${lens}.`,
    `${moodCue}. Colour palette: muted earth tones with a single editorial accent.`,
    groundingLine,
    "Editorial product-marketing photography, not stock.",
    "No on-image text, no logos, no UI mockups, no fake metrics, no group of perfectly-smiling people, no glossy or waxy skin, no impossible shadows."
  ].filter(Boolean).join(" ");
}

function buildFallbackTitle(
  context: CreativeAdGroupContext,
  conversation: CreativeAdGroupContext["conversations"][number],
  feature?: CreativeAdGroupContext["brand_features"][number],
  gap?: CreativeAdGroupContext["landing_gaps"][number]
): string {
  const text = `${context.ad_group.name} ${conversation.text} ${feature?.title ?? ""} ${gap?.gap_type ?? ""}`.toLowerCase();
  if (text.includes("friday") || text.includes("timeline")) return "Live by Friday";
  if (text.includes("hubspot") || text.includes("migration") || text.includes("spreadsheet")) return "Move notes safely";
  if (text.includes("pricing") || text.includes("budget")) return "Small team price";
  if (text.includes("security") || text.includes("proof")) return "Proof for Gmail";
  if (feature?.title) return feature.title;
  return context.ad_group.name;
}

function buildFallbackDescription(
  context: CreativeAdGroupContext,
  conversation: CreativeAdGroupContext["conversations"][number],
  feature?: CreativeAdGroupContext["brand_features"][number],
  gap?: CreativeAdGroupContext["landing_gaps"][number],
  product?: CreativeAdGroupContext["product_feed_items"][number]
): string {
  const joined = `${conversation.intent_type} ${conversation.text} ${gap?.gap_type ?? ""}`.toLowerCase();
  if (joined.includes("friday") || joined.includes("timeline")) {
    return "Launch Gmail follow-up before urgent buyer threads go cold.";
  }
  if (joined.includes("migration") || joined.includes("hubspot") || joined.includes("spreadsheet")) {
    return "Import follow-up notes while keeping sync risk visible.";
  }
  if (joined.includes("pricing") || joined.includes("budget")) {
    return "Answer budget blockers with a clearer small-team path.";
  }
  if (joined.includes("security") || joined.includes("proof")) {
    return "Show proof and trust details before approval stalls.";
  }
  if (product?.description) return product.description;
  if (feature?.description) return feature.description;
  return context.ad_group.rationale;
}

function fallbackCreativeAngle(
  conversation: CreativeAdGroupContext["conversations"][number],
  gap?: CreativeAdGroupContext["landing_gaps"][number]
): string {
  if (conversation.intent_type === "urgency_timeline") return "Timeline proof";
  if (conversation.intent_type === "migration_risk") return "Migration setup";
  if (conversation.intent_type === "budget_validation" || gap?.gap_type === "pricing_clarity") return "Pricing clarity";
  if (conversation.intent_type === "trust_check" || conversation.intent_type === "proof_request") return "Proof and trust";
  return "Constraint-aware angle";
}

function fallbackQualitySignals(
  conversation: CreativeAdGroupContext["conversations"][number],
  feature?: CreativeAdGroupContext["brand_features"][number],
  gap?: CreativeAdGroupContext["landing_gaps"][number]
): CreativeQualitySignal[] {
  const signals: CreativeQualitySignal[] = ["specific_constraint"];
  if (feature) signals.push("proof_aligned");
  if (gap) signals.push("gap_aware");
  if (conversation.intent_type === "migration_risk") signals.push("migration_setup_aligned");
  if (gap?.gap_type === "pricing_clarity") signals.push("pricing_unclear");
  return distinctStrings(signals) as CreativeQualitySignal[];
}

async function callCreativeProvider(
  input: CreativeGenerationInput,
  options: {
    requestId: string;
    provider: StructuredCreativeProvider;
    model: string;
  }
) {
  // Build per-ad-group strategy hints from the conditional copy map so the model
  // makes formula/hook/archetype picks consistent with vertical-expert frameworks.
  const strategyHints = input.ad_group_contexts.map((context) => {
    const intent = context.ad_group.target_intent ?? context.conversations[0]?.intent_type ?? null;
    const gapTypes = context.landing_gaps.map((gap) => gap.gap_type as string);
    return {
      ad_group_id: context.ad_group.id,
      target_intent: intent,
      gap_types: gapTypes,
      strategy: resolveCopyStrategy(intent, gapTypes)
    };
  });

  const prompt = [
    "## STRATEGIC CHOICES (decide BEFORE writing copy, per variant)",
    "",
    "1. awareness_level — Schwartz 5 levels {unaware, problem_aware, solution_aware, product_aware, most_aware}. Pick by ad_group's buyer stage:",
    "   • unaware → reveal the hidden cost they don't yet name",
    "   • problem_aware → name the pain in their words",
    "   • solution_aware → category differentiation vs. alternatives",
    "   • product_aware → resolve specific objections",
    "   • most_aware → offer/CTA",
    "",
    "2. copy_formula ∈ {PAS, BAB, FAB, 4Us, PASTOR} — pick by approved conversation's intent_type using this table:",
    "   • workflow_pain → PAS (Problem-Agitate-Solve)",
    "   • urgency_timeline → BAB (Before-After-Bridge)",
    "   • budget_validation → 4Us (Useful/Urgent/Unique/Ultra-specific)",
    "   • proof_request | trust_check → FAB (Feature-Advantage-Benefit) tied to a named proof anchor",
    "   • migration_risk → BAB where the bridge IS the migration mechanic",
    "   • competitive_switch → PAS where the agitator IS the incumbent",
    "   • integration_check → FAB tied to a named integration in approved features",
    "",
    "3. hook_archetype ∈ {contrarian, demographic_callout, confession, curiosity, directive, bold_claim, statistic, how_to, myth_busting, if_then}.",
    "   Compatibility: early-stage (unaware/problem_aware) prefers curiosity/contrarian/confession; late-stage (product_aware/most_aware) prefers directive/if_then/statistic/bold_claim.",
    "",
    "4. verbatim_phrase: lift 3–7 words from one approved conversation. This phrase MUST appear in title OR description.",
    "",
    "## WRITE COPY",
    "- title: ≤50 chars, target 16–24. First 24 chars carry the hook.",
    "- description: ≤100 chars, target 32–48. Deliver the proof anchor and a soft CTA.",
    "- creative_angle: one short plain-English sentence naming the angle.",
    "",
    "## IMAGE PROMPT (FLUX-correct token order)",
    "asset_prompt must be a natural-language image description in this order: {subject} doing {action_or_pose}, in {environment}. Lit by {lighting}. Shot on {lens}, {composition}. Mood: {mood_keywords}. Colour palette: {palette}. No on-image text, no logos, no UI mockups, no fake metrics, no group of perfectly-smiling people, no glossy/waxy skin, no impossible shadows. Editorial product-marketing photography, not stock.",
    "",
    "Pick image_composition_archetype from {single_protagonist_at_workspace, object_macro_with_context, before_after_diptych, paper_artifact_on_desk, dim_room_late_night, meeting_aftermath} — see strategy table below for default per intent_type.",
    "Also populate the structured siblings: image_subject (first 12 words of asset_prompt should match), image_lighting (named condition like 'soft morning window'), image_lens ('35mm, shallow depth'), image_mood_keywords (≤4 keywords).",
    "",
    "## SELF-GRADE BEFORE RETURNING",
    "copy_self_check booleans (Harry Dry's 3 rules + banned-phrase guard):",
    "  - visualizable: a reader can mentally picture what you described",
    "  - falsifiable: the claim could be proved or disproved (no vague puff)",
    "  - different: a competitor in this category could not say the exact same line",
    "  - banned_phrase_used: TRUE if you used any of " + BANNED_COPY_TERMS.join("/") + " — if true, rewrite once before returning.",
    "",
    "image_self_check booleans:",
    "  - subject_first: the asset_prompt's first 12 words name the subject (not 'Square paid-social ad image')",
    "  - no_banned_elements: no on-image text/logos/fake screens/perfectly-smiling group/glossy skin",
    "  - lighting_named: a specific lighting condition (not 'natural light')",
    "  - composition_named: a lens or framing word",
    "  - archetype_matches_intent: picked archetype is plausible for the ad_group's intent_type",
    "",
    "## OPENAI ADS HARD LIMITS",
    "- title hard max 50 chars; description hard max 100 chars.",
    "- Use target_url from the project brand URL or linked product URL.",
    "- asset_type image by default. asset_prompt is a visual description, not UI instructions.",
    "",
    "## OUTPUT INVARIANTS (the harness cannot enforce these — you must)",
    "- ad_group_id: echo verbatim one UUID from ad_group_contexts[].ad_group.id (do not invent).",
    "- grounding.conversation_ids: ≥1 entry, each must be a UUID drawn from the matching ad group's approved conversations.",
    "- grounding.brand_feature_ids / landing_gap_ids / product_feed_item_ids: only UUIDs from the matching ad group's approved evidence (may be empty).",
    "- grounding.quality_signals: ≥1 entry from the enum.",
    "- target_url: fully-qualified https:// URL — use the project brand URL or a linked product URL only.",
    "- title 3–50 chars, description 1–100 chars, creative_angle ≥1 char, asset_prompt ≥1 char.",
    "- Return at least one variant in `variants`.",
    "",
    "## STRATEGY TABLE (defaults — override only if approved conversation contradicts)",
    JSON.stringify(strategyHints, null, 2),
    "",
    "## VARIANT BUDGET",
    `Generate one primary variant per target ad group unless variant_count > 1 (current: ${input.variant_count}).`,
    "",
    "## APPROVED CAMPAIGN CONTEXT",
    JSON.stringify(input, null, 2)
  ].join("\n");

  return options.provider.generate({
    requestId: options.requestId,
    model: options.model,
    schemaName: "creative_generation",
    schema: creativeGenerationOutputSchema,
    parseSchema: creativeGenerationLooseOutputSchema,
    system: SYSTEM_PROMPT,
    prompt
  });
}

async function generateAssetsForVariants(input: {
  variants: CreativeVariant[];
  requestId: string;
  assetMode: "fal.ai" | "skipped";
  repository: CreativeGenerationRepository;
  assetProvider: CreativeAssetProvider;
}): Promise<CreativeVariant[]> {
  if (input.assetMode !== "fal.ai") return input.variants;

  const updated: CreativeVariant[] = [];
  for (const variant of input.variants) {
    if (variant.asset_type !== "image" || !variant.asset_prompt) {
      updated.push(variant);
      continue;
    }
    const result = await input.assetProvider.generateImage({
      prompt: variant.asset_prompt,
      requestId: `${input.requestId}:${variant.id}`
    });
    updated.push(await input.repository.updateCreativeAssetResult(variant, result));
  }
  return updated;
}

function summarizeCreativeResult(input: {
  projectId: string;
  run: ExtractionRunRecord | null;
  variants: CreativeVariant[];
  source: "openai" | "deterministic_fallback" | "existing";
  assetMode: "fal.ai" | "skipped";
}): RunCreativeGenerationResult {
  return {
    status: "succeeded",
    project_id: input.projectId,
    generation_run: input.run,
    creative_variants: input.variants,
    created_variant_ids: input.variants.map((variant) => variant.id),
    source: input.source,
    asset_generation: {
      mode: input.assetMode,
      skipped_count: input.variants.filter((variant) => variant.asset_generation_status === "skipped").length,
      failed_count: input.variants.filter((variant) => variant.asset_generation_status === "failed").length,
      ready_count: input.variants.filter((variant) => variant.asset_generation_status === "ready").length
    }
  };
}

function ensureCreativeTargets(input: CreativeGenerationInput): void {
  if (input.ad_group_contexts.length === 0) {
    throw new CreativeGenerationError(
      "no_creative_targets",
      "All selected ad groups already have active creative variants.",
      false
    );
  }
}

function normalizedVariantCount(value: number | undefined): number {
  if (!value) return DEFAULT_CREATIVE_VARIANT_COUNT;
  return Math.max(1, Math.min(3, Math.floor(value)));
}

function isActiveCreativeVariant(variant: CreativeVariant): boolean {
  return variant.status !== "rejected"
    && variant.status !== "archived"
    && variant.review_status !== "rejected";
}

function assertSubset(kind: string, actual: string[], allowed: string[]): void {
  const allowedIds = new Set(allowed);
  for (const id of actual) {
    if (!allowedIds.has(id)) {
      throw new CreativeGenerationError(
        "non_approved_grounding_reference",
        `Generated creative references non-approved ${kind} ${id}.`,
        true
      );
    }
  }
}

function normalizeCreativeError(caught: unknown) {
  if (caught instanceof CreativeGenerationError) {
    return {
      code: caught.code,
      message: caught.message,
      retryable: caught.retryable
    };
  }
  return {
    code: "creative_generation_failed",
    message: caught instanceof Error ? caught.message : "Creative generation failed.",
    retryable: true
  };
}

function asFailureOutputJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : { raw: value };
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clipToLimit(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  return clipped.length >= 3 ? clipped : normalized.slice(0, maxLength);
}

function distinctStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

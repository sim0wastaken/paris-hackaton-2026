import { z, type ZodType } from "zod";

import type { DeployPackageInput } from "./deployments";
import { recommendedOwnerRoleValues, type PerformanceSnapshot } from "./types";

export const MONITORING_PROMPT_VERSION = "monitoring_synthesis_v2_2026-05-16";

const recommendedActionValues = [
  "keep_angle",
  "fix_landing_gap",
  "regenerate_generic_copy",
  "add_pricing_proof",
  "add_setup_proof",
  "test_proof_heavy_variant",
  "pause_low_quality_variant"
] as const;

const monitoringSelfCheckSchema = z.object({
  tied_to_hypothesis: z.boolean(),
  names_one_bet: z.boolean(),
  acknowledges_simulation: z.boolean(),
  prose_not_numbers: z.boolean()
}).strict();

const monitoringSynthesisSnapshotSchema = z.object({
  ad_group_id: z.string().min(1),
  creative_variant_id: z.string().min(1),
  quality_score: z.number().int().min(1).max(100),
  insight: z.string().trim().min(1),
  recommended_action: z.enum(recommendedActionValues),
  notes: z.string().trim().min(1),
  // Vertical-expert addition: notional owner role for the recommended action.
  // Nullable for back-compat with deterministic fallback that doesn't compute it.
  recommended_owner: z.enum(recommendedOwnerRoleValues).nullable()
}).strict();

export const monitoringSynthesisOutputSchema = z.object({
  snapshots: z.array(monitoringSynthesisSnapshotSchema),
  dashboard_summary: z.object({
    headline: z.string().trim().min(1),
    what_worked: z.string().trim().min(1),
    what_blocked_conversion: z.string().trim().min(1),
    pioneer_learning_signal: z.string().trim().min(1),
    // Vertical-expert additions for the senior-marketer Monday-review narrative.
    next_week_bet: z.string().trim().min(1).nullable(),
    deferred_risk: z.string().trim().min(1).nullable(),
    self_check: monitoringSelfCheckSchema.nullable()
  }).strict()
}).strict();

export type MonitoringSynthesisOutput = z.infer<typeof monitoringSynthesisOutputSchema>;
export type RecommendedMonitoringAction = (typeof recommendedActionValues)[number];

export type StructuredMonitoringProvider = {
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

export type ScoreComponent = {
  key: string;
  label: string;
  delta: number;
  evidence: string;
};

export type PerformanceSnapshotInsert = Omit<PerformanceSnapshot, "id" | "created_at" | "updated_at">;

export type PerformanceOutput = {
  snapshots: PerformanceSnapshotInsert[];
  dashboard_summary: MonitoringSynthesisOutput["dashboard_summary"];
  source: "openai" | "deterministic_fallback";
  provider_raw: unknown;
  model: string;
};

type BuildPerformanceOptions = {
  deploymentId: string;
  now?: Date;
};

// System prompt — voiced as a senior B2B SaaS growth marketer narrating a Monday-morning paid-social review.
// Embeds: Insight→Action→Owner pattern, hypothesis anchoring, signal-vs-noise honesty, simulation transparency.
const SYSTEM_PROMPT = [
  "You are Motive's simulated monitoring analyst — a senior B2B SaaS growth marketer narrating a Monday-morning paid-social review.",
  "Your reader is the project owner, not a data analyst. Use Insight → Action → Owner shape for every snapshot.",
  "Rewrite insight, recommended_action, notes, recommended_owner, and dashboard summary from supplied deterministic metrics. Do NOT alter numeric metrics except quality_score.",
  "For each snapshot: (1) insight links the score to the ad-group bet (awareness × intent), not the raw metric. (2) recommended_action is imperative, starts with a verb, doable in 1 week. (3) recommended_owner ∈ {growth_pm, creative_lead, landing_page_owner, lifecycle_owner}. (4) notes names the load-bearing proof anchor or landing gap.",
  "Dashboard_summary self-check (emit booleans): tied_to_hypothesis (every line points back to the ad-group bet), names_one_bet (single highest-leverage next move named in next_week_bet), acknowledges_simulation (state metrics are simulated and what would change with real data), prose_not_numbers (≤2 numbers per paragraph).",
  "Also emit next_week_bet (the single most leveraged change) and deferred_risk (the single risk you are choosing NOT to fix this week).",
  "Banned puff: revolutionary, supercharge, leverage, unlock, seamless, game-changing, 10x, empower, streamline.",
  "Make clear that KPIs are simulated/internal and not real ad-platform data.",
  "Return only the requested schema."
].join(" ");

export function buildDeterministicPerformanceOutput(
  input: DeployPackageInput,
  options: BuildPerformanceOptions
): PerformanceOutput {
  const now = options.now ?? new Date();
  const periodStart = startOfUtcDay(now);
  const periodEnd = addDays(periodStart, 7);
  const snapshots = input.creatives.map((creative) => {
    const adGroup = input.ad_groups.find((group) => group.id === creative.ad_group_id);
    if (!adGroup) {
      throw new MonitoringGenerationError(
        "missing_ad_group",
        `Creative ${creative.id} does not have a deployable ad group.`
      );
    }

    const context = {
      adGroup,
      conversations: input.conversations.filter((row) => adGroup.conversation_ids.includes(row.id)),
      features: input.brand_features.filter((row) => adGroup.feature_ids.includes(row.id)),
      gaps: input.landing_gaps.filter((row) => adGroup.landing_gap_ids.includes(row.id))
    };
    const components = scoreCreative(creative, context);
    const qualityScore = clamp(
      50 + components.reduce((total, component) => total + component.delta, 0),
      1,
      100
    );
    const metricBasis = {
      simulated_for_hackathon: true,
      prompt_version: MONITORING_PROMPT_VERSION,
      components,
      quality_band: qualityBand(qualityScore),
      score_inputs: {
        ad_group_name: adGroup.name,
        creative_title: creative.title,
        conversation_ids: context.conversations.map((row) => row.id),
        landing_gap_ids: context.gaps.map((row) => row.id)
      }
    };
    const metrics = buildMetrics(creative.id, adGroup.max_bid_micros, qualityScore, components);
    const action = recommendedAction(components, qualityScore);

    return {
      project_id: input.project.id,
      deployment_id: options.deploymentId,
      ad_group_id: adGroup.id,
      creative_variant_id: creative.id,
      conversation_id: context.conversations[0]?.id ?? null,
      snapshot_kind: "simulated" as const,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      ...metrics,
      quality_score: qualityScore,
      insight: deterministicInsight(components, creative.title),
      recommended_action: action,
      metric_basis_json: { ...metricBasis, recommended_owner: ownerForAction(action) },
      confidence: confidenceFor(components, qualityScore),
      notes: "Generated by deterministic fallback; simulated KPI row.",
      provider_request_json: {
        phase: "monitoring_synthesis",
        prompt_version: MONITORING_PROMPT_VERSION
      },
      provider_response_json: {
        source: "deterministic_fallback",
        quality_score: qualityScore,
        recommended_action: action,
        recommended_owner: ownerForAction(action)
      },
      metadata: {
        simulated: true,
        is_seeded_demo: input.sources.some((source) => source.metadata.is_seeded_demo === true),
        recommended_owner: ownerForAction(action)
      }
    };
  });

  return {
    snapshots,
    dashboard_summary: buildDashboardSummary(snapshots),
    source: "deterministic_fallback",
    provider_raw: null,
    model: "deterministic:fallback"
  };
}

export async function buildPerformanceOutput(
  input: DeployPackageInput,
  options: BuildPerformanceOptions & {
    requestId: string;
    forceFallback?: boolean;
  },
  provider: StructuredMonitoringProvider
): Promise<PerformanceOutput> {
  const deterministic = buildDeterministicPerformanceOutput(input, options);

  if (options.forceFallback || !provider.isConfigured()) {
    return deterministic;
  }

  try {
    const result = await provider.generate({
      requestId: options.requestId,
      model: "openai:monitoring-synthesis",
      schemaName: "monitoring_synthesis",
      schema: monitoringSynthesisOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: buildSynthesisPrompt(input, deterministic)
    });
    return applySynthesis(deterministic, result.output, result);
  } catch (caught) {
    return {
      ...deterministic,
      snapshots: deterministic.snapshots.map((snapshot) => ({
        ...snapshot,
        provider_response_json: {
          ...snapshot.provider_response_json,
          fallback_reason: caught instanceof Error ? caught.message : "Monitoring synthesis failed"
        }
      }))
    };
  }
}

export class MonitoringGenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "MonitoringGenerationError";
  }
}

function scoreCreative(
  creative: DeployPackageInput["creatives"][number],
  context: {
    adGroup: DeployPackageInput["ad_groups"][number];
    conversations: DeployPackageInput["conversations"];
    features: DeployPackageInput["brand_features"];
    gaps: DeployPackageInput["landing_gaps"];
  }
): ScoreComponent[] {
  const text = searchableText([
    creative.title,
    creative.description,
    creative.creative_angle,
    creative.asset_prompt,
    context.adGroup.name,
    context.adGroup.context_hints.join(" ")
  ]);
  const components: ScoreComponent[] = [];
  const constraints = context.conversations.flatMap((conversation) =>
    arrayOfRecords(asRecord(conversation.constraints_json).constraints)
      .map((constraint) => stringValue(constraint.value))
      .filter(Boolean)
  );
  const matchedConstraint = constraints.find((value) => phraseOverlaps(text, value));
  if (matchedConstraint) {
    components.push({
      key: "specific_constraint_match",
      label: "Specific constraint match",
      delta: 15,
      evidence: matchedConstraint
    });
  }

  const proofFeature = context.features.find((feature) =>
    feature.type === "proof_point" && (phraseOverlaps(text, feature.title) || phraseOverlaps(text, feature.description))
  );
  if (proofFeature || /\b(proof|case|security|trust|recovery|compliance)\b/.test(text)) {
    components.push({
      key: "proof_alignment",
      label: "Proof alignment",
      delta: 15,
      evidence: proofFeature?.title ?? "Creative names proof or trust language."
    });
  }

  const alignedGap = context.gaps.find((gap) =>
    phraseOverlaps(text, gap.gap_type) || phraseOverlaps(text, gap.description) || phraseOverlaps(text, gap.suggested_fix)
  );
  if (alignedGap) {
    components.push({
      key: "landing_gap_alignment",
      label: "Landing gap alignment",
      delta: 10,
      evidence: alignedGap.description
    });
  }

  const generic = /\b(simple|easy|better|modern|teams|growth|platform|solution|crm)\b/.test(text);
  if (generic && !matchedConstraint && !proofFeature && !alignedGap) {
    components.push({
      key: "generic_angle_penalty",
      label: "Generic angle penalty",
      delta: -20,
      evidence: "Copy could fit many B2B products."
    });
  }

  const pricingIntent = context.conversations.some((conversation) =>
    conversation.stage === "pricing_check" ||
    conversation.intent_type === "budget_validation" ||
    context.gaps.some((gap) => gap.gap_type === "pricing_clarity")
  );
  const pricingProof = context.features.some((feature) =>
    /\b(price|pricing|budget|contract|plan)\b/.test(searchableText([feature.title, feature.description]))
  );
  if (pricingIntent && !pricingProof) {
    components.push({
      key: "pricing_unclear_penalty",
      label: "Pricing clarity penalty",
      delta: -15,
      evidence: "Pricing-check demand exists without approved pricing clarity proof."
    });
  }

  const migrationIntent = context.conversations.some((conversation) =>
    ["migration_risk", "competitive_switch", "integration_check"].includes(conversation.intent_type)
  );
  if (migrationIntent && /\b(setup|migration|migrate|switch|import|sync|comparison)\b/.test(text)) {
    components.push({
      key: "migration_setup_bonus",
      label: "Migration setup bonus",
      delta: 12,
      evidence: "Creative names setup, migration, import, or sync context."
    });
  }

  const proofSeeking = context.conversations.some((conversation) =>
    ["proof_request", "trust_check"].includes(conversation.intent_type) || conversation.stage === "security_review"
  );
  if (proofSeeking && /\b(proof|case|security|trust|compliance|recovery)\b/.test(text)) {
    components.push({
      key: "proof_seeking_bonus",
      label: "Proof-seeking bonus",
      delta: 12,
      evidence: "Proof-seeking conversation receives proof-heavy language."
    });
  }

  if (hasReadySquareImage(creative)) {
    components.push({
      key: "asset_bonus",
      label: "Renderable image asset",
      delta: 5,
      evidence: creative.asset_url ?? "Ready square image asset."
    });
  }

  if (creative.status === "approved" && ["approved", "edited"].includes(creative.review_status)) {
    components.push({
      key: "review_bonus",
      label: "Human reviewed",
      delta: 8,
      evidence: `Creative review status is ${creative.review_status}.`
    });
  }

  return components;
}

function buildMetrics(
  creativeId: string,
  maxBidMicros: number,
  qualityScore: number,
  components: ScoreComponent[]
) {
  const band = qualityBand(qualityScore);
  const ctrRange = band === "high" ? [0.03, 0.055] : band === "medium" ? [0.016, 0.032] : [0.005, 0.018];
  const cvrRange = band === "high" ? [0.05, 0.09] : band === "medium" ? [0.028, 0.055] : [0.008, 0.03];
  const ctrSeed = seededUnit(`${creativeId}:ctr`);
  const cvrSeed = seededUnit(`${creativeId}:cvr`);
  const volumeSeed = seededUnit(`${creativeId}:volume`);
  const hasCtrBoost = components.some((component) => component.key === "landing_gap_alignment");
  const hasCvrDrag = components.some((component) =>
    component.key === "landing_gap_alignment" || component.key === "pricing_unclear_penalty"
  );
  const rawCtr = interpolate(ctrRange[0], ctrRange[1], ctrSeed) + (hasCtrBoost ? 0.004 : 0);
  const rawCvr = Math.max(0.004, interpolate(cvrRange[0], cvrRange[1], cvrSeed) - (hasCvrDrag ? 0.015 : 0));
  const impressions = 2_600 + Math.round(volumeSeed * 2_200);
  const clicks = Math.max(1, Math.min(impressions, Math.round(impressions * rawCtr)));
  const conversions = Math.max(1, Math.min(clicks, Math.round(clicks * rawCvr)));
  const ctr = roundRate(clicks / impressions);
  const cvr = roundRate(conversions / clicks);
  const clickCost = Math.max(0.6, (maxBidMicros / 1_000_000) * (0.55 + seededUnit(`${creativeId}:spend`) * 0.25));

  return {
    impressions,
    clicks,
    ctr,
    conversions,
    cvr,
    spend: roundCurrency(clicks * clickCost)
  };
}

function deterministicInsight(components: ScoreComponent[], title: string): string {
  const keys = new Set(components.map((component) => component.key));
  if (keys.has("generic_angle_penalty")) {
    return `${title} underperforms because the angle is generic and does not connect to an approved buying conversation.`;
  }
  if (keys.has("pricing_unclear_penalty")) {
    return `${title} is capped by pricing-check intent until the landing page explains pricing or adds a proof point.`;
  }
  if (keys.has("landing_gap_alignment")) {
    return `${title} earns attention by naming a real buyer need, but conversion is capped by the unresolved landing-page gap.`;
  }
  if (keys.has("specific_constraint_match")) {
    return `${title} performs well because it mirrors a concrete buyer constraint from the approved conversation map.`;
  }
  return `${title} has a moderate simulated read because the evidence is approved but the angle needs sharper specificity.`;
}

function recommendedAction(components: ScoreComponent[], qualityScore: number): RecommendedMonitoringAction {
  const keys = new Set(components.map((component) => component.key));
  if (keys.has("generic_angle_penalty")) return "regenerate_generic_copy";
  if (keys.has("pricing_unclear_penalty")) return "add_pricing_proof";
  if (keys.has("landing_gap_alignment")) return "fix_landing_gap";
  if (keys.has("migration_setup_bonus")) return "add_setup_proof";
  if (keys.has("proof_seeking_bonus")) return "test_proof_heavy_variant";
  if (qualityScore < 45) return "pause_low_quality_variant";
  return "keep_angle";
}

function confidenceFor(components: ScoreComponent[], qualityScore: number): "low" | "medium" | "high" {
  if (qualityScore >= 75 && components.length >= 3) return "high";
  if (qualityScore <= 45 || components.length <= 1) return "low";
  return "medium";
}

function buildDashboardSummary(snapshots: PerformanceSnapshotInsert[]): MonitoringSynthesisOutput["dashboard_summary"] {
  const best = [...snapshots].sort((a, b) => b.quality_score - a.quality_score)[0];
  const worst = [...snapshots].sort((a, b) => a.quality_score - b.quality_score)[0];
  const genericCount = snapshots.filter((snapshot) =>
    arrayOfRecords(asRecord(snapshot.metric_basis_json).components)
      .some((component) => component.key === "generic_angle_penalty")
  ).length;
  const gapCount = snapshots.filter((snapshot) =>
    arrayOfRecords(asRecord(snapshot.metric_basis_json).components)
      .some((component) => ["landing_gap_alignment", "pricing_unclear_penalty"].includes(String(component.key)))
  ).length;

  // next_week_bet — the single highest-leverage move based on which penalty/bonus dominates.
  const nextBet = genericCount > 0
    ? "Rewrite the highest-impression generic variant with a constraint-anchored hook (creative_lead, 1 week)."
    : gapCount > 0
      ? "Close the landing gap behind the best-performing creative before scaling spend (landing_page_owner, 1 week)."
      : best
        ? `Hold spend on "${best.insight.slice(0, 40)}…" and test a second hook archetype next week (growth_pm).`
        : "Approve and deploy creatives to generate the first signal week.";
  // deferred_risk — explicitly name what we are choosing NOT to address this week.
  const deferred = gapCount > 0 && genericCount > 0
    ? "Generic-angle rewrites are deferred — landing-page fix is the bigger leverage point this week."
    : worst && worst.quality_score < 45
      ? "Pausing the lowest-quality variant is deferred until the rewrite/landing fix lands."
      : "No material risk is being deferred this week.";

  return {
    headline: best
      ? `Simulated KPIs favor ${best.quality_score >= 75 ? "constraint-aware" : "more specific"} creative angles.`
      : "Simulated KPIs are ready after fake deploy.",
    what_worked: best
      ? "The highest-scoring rows match approved buyer constraints, proof points, or setup context."
      : "Approve creatives and fake deploy them to generate the first internal KPI rows.",
    what_blocked_conversion: gapCount > 0 || genericCount > 0
      ? "Unresolved landing gaps, pricing clarity issues, or generic copy cap conversion in the simulated read."
      : "No major conversion blocker was detected in the simulated read.",
    pioneer_learning_signal:
      "These internal rows pair source labels, human review, creative choices, and outcome-like signals for a future Pioneer classifier.",
    next_week_bet: nextBet,
    deferred_risk: deferred,
    self_check: {
      tied_to_hypothesis: true,
      names_one_bet: true,
      acknowledges_simulation: true,
      prose_not_numbers: true
    }
  };
}

// Map a deterministic recommended_action to the most plausible notional owner role.
// (Used by the deterministic fallback so the field is populated even without OpenAI.)
function ownerForAction(action: RecommendedMonitoringAction): "growth_pm" | "creative_lead" | "landing_page_owner" | "lifecycle_owner" {
  switch (action) {
    case "regenerate_generic_copy":
    case "test_proof_heavy_variant":
      return "creative_lead";
    case "fix_landing_gap":
    case "add_pricing_proof":
    case "add_setup_proof":
      return "landing_page_owner";
    case "pause_low_quality_variant":
      return "growth_pm";
    case "keep_angle":
    default:
      return "growth_pm";
  }
}

function applySynthesis(
  deterministic: PerformanceOutput,
  synthesis: MonitoringSynthesisOutput,
  providerResult: {
    raw: unknown;
    responseId: string | null;
    usage: Record<string, unknown>;
    model: string;
  }
): PerformanceOutput {
  const byCreative = new Map(synthesis.snapshots.map((snapshot) => [snapshot.creative_variant_id, snapshot]));
  return {
    snapshots: deterministic.snapshots.map((snapshot) => {
      const synthesized = byCreative.get(snapshot.creative_variant_id ?? "");
      if (!synthesized || synthesized.ad_group_id !== snapshot.ad_group_id) return snapshot;
      return {
        ...snapshot,
        quality_score: synthesized.quality_score,
        insight: synthesized.insight,
        recommended_action: synthesized.recommended_action,
        notes: synthesized.notes,
        provider_response_json: {
          source: "openai",
          response_id: providerResult.responseId,
          usage: providerResult.usage,
          raw: providerResult.raw,
          recommended_owner: synthesized.recommended_owner
        },
        metadata: {
          ...(asRecord(snapshot.metadata) ?? {}),
          recommended_owner: synthesized.recommended_owner
        }
      };
    }),
    dashboard_summary: synthesis.dashboard_summary,
    source: "openai",
    provider_raw: providerResult.raw,
    model: providerResult.model
  };
}

function buildSynthesisPrompt(input: DeployPackageInput, deterministic: PerformanceOutput): string {
  return JSON.stringify({
    project: {
      id: input.project.id,
      name: input.project.name,
      brand_url: input.project.brand_url
    },
    instruction: "Rewrite the supplied simulated monitoring narrative. Do not alter numeric metrics except quality_score.",
    deterministic_snapshots: deterministic.snapshots.map((snapshot) => ({
      ad_group_id: snapshot.ad_group_id,
      creative_variant_id: snapshot.creative_variant_id,
      quality_score: snapshot.quality_score,
      ctr: snapshot.ctr,
      cvr: snapshot.cvr,
      conversions: snapshot.conversions,
      metric_basis_json: snapshot.metric_basis_json,
      current_insight: snapshot.insight,
      current_recommended_action: snapshot.recommended_action
    }))
  });
}

function hasReadySquareImage(creative: DeployPackageInput["creatives"][number]): boolean {
  return Boolean(
    creative.asset_type === "image" &&
    creative.asset_url &&
    creative.asset_generation_status === "ready" &&
    creative.asset_width &&
    creative.asset_height &&
    creative.asset_width === creative.asset_height &&
    creative.asset_width <= 1200 &&
    creative.asset_height <= 1200 &&
    (!creative.asset_mime_type || ["image/jpeg", "image/png"].includes(creative.asset_mime_type))
  );
}

function qualityBand(score: number): "low" | "medium" | "high" {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function seededUnit(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function interpolate(min: number, max: number, unit: number): number {
  return min + (max - min) * unit;
}

function roundRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function searchableText(values: Array<string | null | undefined>): string {
  return values.filter(Boolean).join(" ").toLowerCase().replace(/[_-]+/g, " ");
}

function phraseOverlaps(text: string, phrase: string | null | undefined): boolean {
  if (!phrase) return false;
  const tokens = phrase
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .split(/\W+/)
    .filter((token) => token.length >= 4 && !["with", "from", "that", "this", "your", "their"].includes(token));
  return tokens.some((token) => text.includes(token));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item))
      )
    : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

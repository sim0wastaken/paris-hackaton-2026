import type {
  AwarenessLevel,
  CopyFormula,
  HookArchetype,
  ImageCompositionArchetype,
} from "./types";

/**
 * Conditional copy map: HITL approval signals → creative generation strategy.
 *
 * Single source of truth for the per-intent copy formula, default hook archetype,
 * default image composition archetype, and default awareness level. Injected into
 * the creative-generation prompt as a JSON object so the model picks consistently.
 *
 * Sources:
 *   - Schwartz awareness levels (Breakthrough Advertising, 1966)
 *   - PAS/BAB/FAB/4Us/PASTOR direct-response copy formulas
 *   - Motion creative-strategy hook tactics
 *   - FLUX image composition patterns for paid-social B2B SaaS
 */
export type IntentCopyStrategy = {
  intent_type: string;
  copy_formula: CopyFormula;
  hook_archetypes: HookArchetype[]; // first is default, second is acceptable alternative
  image_composition_archetype: ImageCompositionArchetype;
  awareness_default: AwarenessLevel;
};

export const intentCopyStrategyMap: Record<string, IntentCopyStrategy> = {
  workflow_pain: {
    intent_type: "workflow_pain",
    copy_formula: "PAS",
    hook_archetypes: ["confession", "directive"],
    image_composition_archetype: "single_protagonist_at_workspace",
    awareness_default: "problem_aware",
  },
  urgency_timeline: {
    intent_type: "urgency_timeline",
    copy_formula: "BAB",
    hook_archetypes: ["bold_claim", "directive"],
    image_composition_archetype: "dim_room_late_night",
    awareness_default: "most_aware",
  },
  budget_validation: {
    intent_type: "budget_validation",
    copy_formula: "4Us",
    hook_archetypes: ["statistic", "if_then"],
    image_composition_archetype: "paper_artifact_on_desk",
    awareness_default: "product_aware",
  },
  proof_request: {
    intent_type: "proof_request",
    copy_formula: "FAB",
    hook_archetypes: ["statistic", "myth_busting"],
    image_composition_archetype: "object_macro_with_context",
    awareness_default: "product_aware",
  },
  trust_check: {
    intent_type: "trust_check",
    copy_formula: "FAB",
    hook_archetypes: ["confession", "demographic_callout"],
    image_composition_archetype: "object_macro_with_context",
    awareness_default: "product_aware",
  },
  migration_risk: {
    intent_type: "migration_risk",
    copy_formula: "BAB",
    hook_archetypes: ["how_to", "directive"],
    image_composition_archetype: "before_after_diptych",
    awareness_default: "solution_aware",
  },
  integration_check: {
    intent_type: "integration_check",
    copy_formula: "FAB",
    hook_archetypes: ["how_to", "if_then"],
    image_composition_archetype: "object_macro_with_context",
    awareness_default: "solution_aware",
  },
  competitive_switch: {
    intent_type: "competitive_switch",
    copy_formula: "PAS",
    hook_archetypes: ["contrarian", "myth_busting"],
    image_composition_archetype: "meeting_aftermath",
    awareness_default: "solution_aware",
  },
};

/**
 * landing_gap.gap_type → risk acknowledgments (NOT benefit claims).
 * Encodes what the prompt must avoid claiming when this gap is unresolved.
 */
export const gapRiskOverlay: Record<string, { copy_avoid: string[]; image_override?: ImageCompositionArchetype }> = {
  pricing_clarity: {
    copy_avoid: [
      "Do not quote any price in title or description.",
      "Add a `risks` entry noting price clarity depends on landing-page proof.",
    ],
  },
  proof: {
    copy_avoid: [
      "No superlatives (best/fastest/#1) — proof is not on the landing page.",
      "Add a `risks` entry: claim authority depends on future proof artifact.",
    ],
  },
  security: {
    copy_avoid: [
      "No security or compliance claim in copy or image.",
      "No compliance badge depicted in the image prompt.",
      "Add a `risks` entry: security claim deferred until artifact provided.",
    ],
  },
  trust_compliance: {
    copy_avoid: [
      "No certification (SOC2/ISO/GDPR/HIPAA) in copy.",
      "No badge or seal in image prompt.",
    ],
  },
  setup_path: {
    copy_avoid: [
      "Show, do not tell — the image should depict the path, not claim it.",
    ],
    image_override: "before_after_diptych",
  },
};

export type IntentCopyStrategyLookup = {
  strategy_for_intent: IntentCopyStrategy | null;
  gap_overlays: Array<{ gap_type: string; overlay: (typeof gapRiskOverlay)[string] }>;
};

export function resolveCopyStrategy(
  intent_type: string | null | undefined,
  gap_types: string[] = []
): IntentCopyStrategyLookup {
  return {
    strategy_for_intent: intent_type ? intentCopyStrategyMap[intent_type] ?? null : null,
    gap_overlays: gap_types
      .map((gap_type) => ({ gap_type, overlay: gapRiskOverlay[gap_type] }))
      .filter((entry) => Boolean(entry.overlay)),
  };
}

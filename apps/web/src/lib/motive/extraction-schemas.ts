import { z } from "zod";

import {
  buyerRoleValues,
  buyingJobValues,
  cialdiniPrincipleValues,
  constraintTypeValues,
  featureTypeValues,
  forceTagValues,
  heuristicAxisValues,
  intentTypeValues,
  landingGapTypeValues,
  stageValues
} from "./types";

export const confidenceLabelSchema = z.enum(["low", "medium", "high"]);

export const extractionConstraintSchema = z.object({
  type: z.enum(constraintTypeValues),
  value: z.string(),
  evidence: z.string(),
  source_refs: z.array(z.string()),
  confidence: confidenceLabelSchema.optional()
});

export const sourceRecapOutputSchema = z.object({
  brand_name: z.string(),
  category: z.string(),
  homepage_url: z.string(),
  one_sentence_offer: z.string(),
  positioning_summary: z.string(),
  icp_segments: z.array(
    z.object({
      segment: z.string(),
      pain: z.string(),
      desired_outcome: z.string(),
      source_refs: z.array(z.string()),
      confidence: confidenceLabelSchema
    })
  ),
  competitors: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      source_refs: z.array(z.string()),
      confidence: confidenceLabelSchema
    })
  ),
  proof_points: z.array(
    z.object({
      claim: z.string(),
      evidence: z.string(),
      source_refs: z.array(z.string()),
      confidence: confidenceLabelSchema
    })
  ),
  constraints: z.array(extractionConstraintSchema.omit({ confidence: true })),
  source_quality: z.object({
    coverage: z.enum(["thin", "adequate", "rich"]),
    missing_context: z.array(z.string())
  }),
  assumptions: z.array(z.string())
});

export const featureMapOutputSchema = z.object({
  features: z.array(
    z.object({
      temp_id: z.string(),
      type: z.enum(featureTypeValues),
      title: z.string(),
      description: z.string(),
      buyer_relevance: z.string(),
      evidence: z.string(),
      source_refs: z.array(z.string()),
      confidence: confidenceLabelSchema,
      // Moesta Forces of Progress — populated only for type=objection (null otherwise).
      // Already constrained by the prompt to prefix evidence with the tag too, this is the structured copy.
      force_tag: z.enum(forceTagValues).nullable()
    })
  ),
  missing_feature_context: z.array(z.string())
});

export const conversationMapOutputSchema = z.object({
  conversations: z.array(
    z.object({
      temp_id: z.string(),
      conversation_text: z.string(),
      buyer_role: z.string(),
      trigger: z.string(),
      pain: z.string(),
      desired_outcome: z.string(),
      related_feature_temp_ids: z.array(z.string()),
      source_refs: z.array(z.string()),
      confidence: confidenceLabelSchema,
      // Vertical-expert additions (Moesta switch interview + Gartner buying jobs).
      // Nullable so older outputs still parse and so the model can abstain when source is thin.
      anxiety: z.string().nullable(),
      buying_job: z.enum(buyingJobValues).nullable()
    })
  )
});

export const intentClassificationOutputSchema = z.object({
  classifications: z.array(
    z.object({
      conversation_temp_id: z.string(),
      stage: z.enum(stageValues),
      intent_type: z.enum(intentTypeValues),
      buyer_role: z.enum(buyerRoleValues),
      constraints: z.array(extractionConstraintSchema.required({ confidence: true })),
      rationale: z.string(),
      confidence: confidenceLabelSchema,
      // Chain-of-verification: the runner-up stage the model considered and why it rejected it.
      // Nullable so old fixtures still parse.
      runner_up_stage: z.enum(stageValues).nullable(),
      runner_up_reason: z.string().nullable()
    })
  )
});

export const landingGapsOutputSchema = z.object({
  gaps: z.array(
    z.object({
      temp_id: z.string(),
      conversation_temp_id: z.string(),
      gap_type: z.enum(landingGapTypeValues),
      severity: z.enum(["low", "medium", "high"]),
      description: z.string(),
      suggested_fix: z.string(),
      page_area: z.string(),
      source_refs: z.array(z.string()),
      rationale: z.string(),
      // CXL ResearchXL heuristic axis (complements gap_type — same gap can sit on multiple axes; pick the dominant).
      heuristic_axis: z.enum(heuristicAxisValues).nullable(),
      // Cialdini principle for the suggested fix (when the fix is grounded).
      cialdini_principle: z.enum(cialdiniPrincipleValues).nullable(),
      // CRITICAL anti-hallucination guard: did the model find the proposed artifact in the sources,
      // or is it requesting the brand provide a new artifact? Defaults to null for old outputs.
      fix_artifact_status: z.enum(["present_in_source", "request_from_brand"]).nullable()
    })
  )
});

export const adGroupsOutputSchema = z.object({
  ad_groups: z.array(
    z.object({
      temp_id: z.string(),
      name: z.string(),
      primary_intent: z.string(),
      context_hints: z.array(z.string()),
      conversation_temp_ids: z.array(z.string()),
      angle: z.string(),
      rationale: z.string(),
      must_include_claims: z.array(z.string()),
      avoid_claims: z.array(z.string()),
      linked_landing_gap_temp_ids: z.array(z.string()),
      priority: z.enum(["low", "medium", "high"])
    })
  )
});

export const phaseOutputSchemas = {
  source_recap: sourceRecapOutputSchema,
  feature_map: featureMapOutputSchema,
  conversation_map: conversationMapOutputSchema,
  intent_classification: intentClassificationOutputSchema,
  landing_gaps: landingGapsOutputSchema,
  ad_groups: adGroupsOutputSchema
} as const;

export type SourceRecapOutput = z.infer<typeof sourceRecapOutputSchema>;
export type FeatureMapOutput = z.infer<typeof featureMapOutputSchema>;
export type ConversationMapOutput = z.infer<typeof conversationMapOutputSchema>;
export type IntentClassificationOutput = z.infer<typeof intentClassificationOutputSchema>;
export type LandingGapsOutput = z.infer<typeof landingGapsOutputSchema>;
export type AdGroupsOutput = z.infer<typeof adGroupsOutputSchema>;
export type PhaseOutput =
  | SourceRecapOutput
  | FeatureMapOutput
  | ConversationMapOutput
  | IntentClassificationOutput
  | LandingGapsOutput
  | AdGroupsOutput;

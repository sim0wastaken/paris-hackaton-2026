import { describe, expect, it } from "vitest";

import {
  adGroupsOutputSchema,
  conversationMapOutputSchema,
  featureMapOutputSchema,
  intentClassificationOutputSchema,
  landingGapsOutputSchema,
  sourceRecapOutputSchema
} from "./extraction-schemas";

describe("Spec 04 extraction schemas", () => {
  it("accepts the six structured phase output contracts", () => {
    expect(() =>
      sourceRecapOutputSchema.parse({
        brand_name: "AtlasDesk",
        category: "B2B SaaS",
        homepage_url: "https://atlasdesk.example",
        one_sentence_offer: "Gmail-native CRM follow-up for small revenue teams.",
        positioning_summary: "AtlasDesk turns inbox conversations into CRM-ready follow-up.",
        icp_segments: [
          {
            segment: "Founder-led revenue teams",
            pain: "Deals go cold in Gmail",
            desired_outcome: "Clear next steps before Friday",
            source_refs: ["source-1"],
            confidence: "high"
          }
        ],
        competitors: [],
        proof_points: [
          {
            claim: "Live in Gmail by Friday",
            evidence: "Launch your team before Friday",
            source_refs: ["source-1"],
            confidence: "high"
          }
        ],
        constraints: [
          {
            type: "timeline",
            value: "before Friday",
            evidence: "Launch your team before Friday",
            source_refs: ["source-1"]
          }
        ],
        source_quality: {
          coverage: "adequate",
          missing_context: ["pricing page"]
        },
        assumptions: []
      })
    ).not.toThrow();

    expect(() =>
      featureMapOutputSchema.parse({
        features: [
          {
            temp_id: "feature_1",
            type: "value_prop",
            title: "Live before Friday",
            description: "Fast setup for urgent small teams.",
            buyer_relevance: "Supports urgency-led acquisition.",
            evidence: "Launch your team before Friday",
            source_refs: ["source-1"],
            confidence: "high"
          }
        ],
        missing_feature_context: []
      })
    ).not.toThrow();

    expect(() =>
      conversationMapOutputSchema.parse({
        conversations: [
          {
            temp_id: "conversation_1",
            conversation_text: "Can we get this live before Friday?",
            buyer_role: "founder",
            trigger: "urgent setup",
            pain: "Gmail follow-up is scattered",
            desired_outcome: "working CRM workflow this week",
            related_feature_temp_ids: ["feature_1"],
            source_refs: ["source-1"],
            confidence: "high"
          }
        ]
      })
    ).not.toThrow();

    expect(() =>
      intentClassificationOutputSchema.parse({
        classifications: [
          {
            conversation_temp_id: "conversation_1",
            stage: "vendor_evaluation",
            intent_type: "urgency_timeline",
            buyer_role: "founder",
            constraints: [
              {
                type: "timeline",
                value: "before Friday",
                evidence: "Can we get this live before Friday?",
                source_refs: ["conversation_1"],
                confidence: "high"
              }
            ],
            rationale: "The buyer is evaluating setup speed.",
            confidence: "high"
          }
        ]
      })
    ).not.toThrow();

    expect(() =>
      landingGapsOutputSchema.parse({
        gaps: [
          {
            temp_id: "gap_1",
            conversation_temp_id: "conversation_1",
            gap_type: "setup_path",
            severity: "high",
            description: "The page does not prove Friday setup.",
            suggested_fix: "Add a setup checklist and implementation timeline.",
            page_area: "hero proof block",
            source_refs: ["source-1"],
            rationale: "Urgency-led buyers need proof before converting."
          }
        ]
      })
    ).not.toThrow();

    expect(() =>
      adGroupsOutputSchema.parse({
        ad_groups: [
          {
            temp_id: "ad_group_1",
            name: "Friday setup urgency",
            primary_intent: "urgency_timeline",
            context_hints: ["Gmail CRM live before Friday"],
            conversation_temp_ids: ["conversation_1"],
            angle: "Speed-to-value",
            rationale: "Groups buyers with timeline pressure.",
            must_include_claims: ["Gmail-native workflow"],
            avoid_claims: ["Unsupported security certifications"],
            linked_landing_gap_temp_ids: ["gap_1"],
            priority: "high"
          }
        ]
      })
    ).not.toThrow();
  });

  it("rejects non-canonical intent labels", () => {
    const parsed = intentClassificationOutputSchema.safeParse({
      classifications: [
        {
          conversation_temp_id: "conversation_1",
          stage: "random_stage",
          intent_type: "urgency_timeline",
          buyer_role: "founder",
          constraints: [],
          rationale: "Invalid stage should be rejected.",
          confidence: "medium"
        }
      ]
    });

    expect(parsed.success).toBe(false);
  });
});

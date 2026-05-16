import { describe, expect, it } from "vitest";

import {
  buildReviewRpcArgs,
  parseReviewActionInput,
  validateReviewPatch
} from "./reviews";

const projectId = "00000000-0000-0000-0000-0000000000aa";
const entityId = "10000000-0000-0000-0000-0000000000aa";

describe("Spec 05 review actions", () => {
  it("builds an audited approve mutation for a brand feature", () => {
    const input = parseReviewActionInput(projectId, {
      entityType: "brand_feature",
      entityId,
      action: "approve",
      comment: "Strong enough for downstream ad groups."
    });

    const args = buildReviewRpcArgs(input);

    expect(args).toMatchObject({
      p_project_id: projectId,
      p_entity_type: "brand_feature",
      p_entity_id: entityId,
      p_action: "approve",
      p_patch: {},
      p_comment: "Strong enough for downstream ad groups.",
      p_reviewer_user_id: null,
      p_metadata: { reviewer: "demo_user" }
    });
  });

  it("allows only review-safe conversation edit fields", () => {
    const patch = validateReviewPatch("conversation", "edit", {
      text: "Can we migrate spreadsheet follow-up notes without breaking HubSpot sync?",
      stage: "solution_compare",
      intent_type: "migration_risk",
      buyer_role: "revenue_lead",
      constraints_json: {
        constraints: [
          { type: "integration", value: "HubSpot" },
          { type: "migration_object", value: "spreadsheet follow-up notes" }
        ]
      },
      status: "approved"
    });

    expect(patch.success).toBe(false);
    if (patch.success) throw new Error("Expected conversation patch validation to fail");
    expect(patch.error?.issues[0]?.message).toContain("status");
  });

  it("rejects empty primary edit fields before writing an audit row", () => {
    const patch = validateReviewPatch("landing_gap", "edit", {
      suggested_fix: "   "
    });

    expect(patch.success).toBe(false);
    if (patch.success) throw new Error("Expected landing gap patch validation to fail");
    expect(patch.error?.issues[0]?.message).toContain("suggested_fix");
  });

  it("normalizes enrich as a manual reviewed patch that stays out of approved downstream rows", () => {
    const input = parseReviewActionInput(projectId, {
      entityType: "ad_group",
      entityId,
      action: "enrich",
      patch: {
        rationale: "Focus on urgent Gmail setup for five-person revenue teams.",
        context_hints: ["live before Friday", "five reps", "Gmail-native setup"]
      },
      comment: "Make the angle more concrete."
    });

    const args = buildReviewRpcArgs(input);

    expect(args.p_patch).toEqual({
      rationale: "Focus on urgent Gmail setup for five-person revenue teams.",
      context_hints: ["live before Friday", "five reps", "Gmail-native setup"]
    });
    expect(args.p_action).toBe("enrich");
  });
});

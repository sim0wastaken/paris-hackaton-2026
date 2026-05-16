import { z } from "zod";

import {
  buyerRoleValues,
  constraintSchema,
  assetGenerationStatusValues,
  creativeAssetTypeValues,
  featureTypeValues,
  intentTypeValues,
  jsonObjectSchema,
  landingGapTypeValues,
  reviewActionValues,
  stageValues,
} from "./types";
import type { HumanReview, ReviewAction } from "./types";

export const reviewableEntityTypeValues = [
  "extraction_run",
  "brand_feature",
  "conversation",
  "landing_gap",
  "ad_group",
  "creative_variant"
] as const;

export type ReviewableEntityType = (typeof reviewableEntityTypeValues)[number];

export type ReviewActionInput = {
  projectId: string;
  entityType: ReviewableEntityType;
  entityId: string;
  action: ReviewAction;
  patch: Record<string, unknown>;
  comment: string | null;
  expectedUpdatedAt: string | null;
  reviewerUserId: string | null;
};

export type ReviewActionRpcArgs = {
  p_project_id: string;
  p_entity_type: ReviewableEntityType;
  p_entity_id: string;
  p_action: ReviewAction;
  p_patch: Record<string, unknown>;
  p_comment: string | null;
  p_expected_updated_at: string | null;
  p_reviewer_user_id: string | null;
  p_metadata: Record<string, unknown>;
};

export type ReviewActionResult = {
  entity_type: ReviewableEntityType;
  entity: Record<string, unknown>;
  human_review: HumanReview;
};

export type ReviewIssue = {
  path: Array<string | number>;
  message: string;
};

export class ReviewValidationError extends Error {
  readonly issues: ReviewIssue[];

  constructor(issues: ReviewIssue[]) {
    super(issues.map((issue) => issue.message).join("; "));
    this.name = "ReviewValidationError";
    this.issues = issues;
  }
}

const reviewableEntityTypeSchema = z.enum(reviewableEntityTypeValues);
const looseUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID"
);
const reviewActionInputSchema = z.object({
  entityType: reviewableEntityTypeSchema,
  entityId: looseUuidSchema,
  action: z.enum(reviewActionValues),
  patch: jsonObjectSchema.optional().default({}),
  comment: z.string().trim().max(2_000).nullable().optional(),
  expectedUpdatedAt: z.string().min(1).nullable().optional(),
  reviewerUserId: looseUuidSchema.nullable().optional()
});

const nonEmptyString = z.string().trim().min(1);
const uuidArray = z.array(looseUuidSchema);
const jsonArray = z.array(z.unknown());
const reviewPatchSchemas: Record<ReviewableEntityType, z.ZodObject> = {
  extraction_run: z.object({
    output_json: jsonObjectSchema,
    metadata: jsonObjectSchema
  }).partial().strict(),
  brand_feature: z.object({
    type: z.enum(featureTypeValues),
    title: nonEmptyString,
    description: nonEmptyString,
    evidence: z.string().trim().nullable(),
    source_refs: jsonArray,
    metadata: jsonObjectSchema
  }).partial().strict(),
  conversation: z.object({
    text: nonEmptyString,
    stage: z.enum(stageValues),
    intent_type: z.enum(intentTypeValues),
    buyer_role: z.enum(buyerRoleValues).nullable(),
    constraints_json: z.object({
      constraints: z.array(constraintSchema).optional()
    }).catchall(z.unknown()),
    source_refs: jsonArray,
    metadata: jsonObjectSchema
  }).partial().strict(),
  landing_gap: z.object({
    gap_type: z.enum(landingGapTypeValues),
    description: nonEmptyString,
    suggested_fix: nonEmptyString,
    severity: z.number().int().min(1).max(5),
    source_refs: jsonArray,
    metadata: jsonObjectSchema
  }).partial().strict(),
  ad_group: z.object({
    name: nonEmptyString,
    rationale: nonEmptyString,
    context_hints: z.array(nonEmptyString),
    target_stage: z.enum(stageValues).nullable(),
    target_intent: z.enum(intentTypeValues).nullable(),
    conversation_ids: uuidArray,
    feature_ids: uuidArray,
    landing_gap_ids: uuidArray,
    product_feed_item_ids: uuidArray,
    metadata: jsonObjectSchema
  }).partial().strict(),
  creative_variant: z.object({
    title: nonEmptyString.max(50),
    description: nonEmptyString.max(100),
    creative_angle: nonEmptyString,
    asset_type: z.enum(creativeAssetTypeValues),
    asset_prompt: z.string().trim().nullable(),
    asset_url: z.url().nullable(),
    asset_generation_status: z.enum(assetGenerationStatusValues),
    openai_file_id: z.string().trim().nullable(),
    target_url: z.url(),
    openai_ad_status: z.enum(["paused", "active", "archived"]).or(z.string().min(1)),
    provider_request_json: jsonObjectSchema,
    provider_response_json: jsonObjectSchema,
    openai_validation_json: jsonObjectSchema,
    metadata: jsonObjectSchema
  }).partial().strict()
};

export function parseReviewActionInput(projectId: string, payload: unknown): ReviewActionInput {
  const parsed = reviewActionInputSchema.safeParse(payload);
  if (!parsed.success) throw new ReviewValidationError(toReviewIssues(parsed.error.issues));

  const patch = validateReviewPatch(parsed.data.entityType, parsed.data.action, parsed.data.patch);
  if (!patch.success) throw new ReviewValidationError(patch.error.issues);

  return {
    projectId,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    action: parsed.data.action,
    patch: patch.data,
    comment: parsed.data.comment ?? null,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt ?? null,
    reviewerUserId: parsed.data.reviewerUserId ?? null
  };
}

export function validateReviewPatch(
  entityType: ReviewableEntityType,
  action: ReviewAction,
  patch: Record<string, unknown>
): { success: true; data: Record<string, unknown> } | { success: false; error: { issues: ReviewIssue[] } } {
  const keys = Object.keys(patch);
  if ((action === "approve" || action === "reject") && keys.length > 0) {
    return failReviewPatch([], `${action} actions do not accept patch fields.`);
  }
  if ((action === "edit" || action === "enrich") && keys.length === 0) {
    return failReviewPatch([], `${action} actions require at least one patch field.`);
  }

  const result = reviewPatchSchemas[entityType].safeParse(patch);
  if (!result.success) {
    return { success: false, error: { issues: toReviewIssues(result.error.issues) } };
  }
  return { success: true, data: result.data };
}

export function buildReviewRpcArgs(input: ReviewActionInput): ReviewActionRpcArgs {
  return {
    p_project_id: input.projectId,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_action: input.action,
    p_patch: input.patch,
    p_comment: input.comment,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_reviewer_user_id: input.reviewerUserId,
    p_metadata: { reviewer: "demo_user" }
  };
}

function failReviewPatch(path: Array<string | number>, message: string) {
  return { success: false as const, error: { issues: [{ path, message }] } };
}

function toReviewIssues(issues: Array<{ path: PropertyKey[]; message: string }>): ReviewIssue[] {
  return issues.map((issue) => ({
    path: issue.path.map((part) => (typeof part === "symbol" ? part.toString() : part)),
    message: issue.path.length > 0
      ? `${issue.path.map((part) => String(part)).join(".")}: ${issue.message}`
      : issue.message
  }));
}

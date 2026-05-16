import { z } from "zod";

export const projectStatusValues = ["draft", "extracting", "review", "creative_ready", "deployed", "failed"] as const;
export const sourceTypeValues = ["url", "pdf", "markdown", "text", "screenshot", "product_feed"] as const;
export const sourceStatusValues = ["pending", "processing", "processed", "failed", "skipped", "needs_manual_text"] as const;
export const extractionPhaseValues = [
  "source_recap",
  "feature_map",
  "conversation_map",
  "intent_classification",
  "landing_gaps",
  "ad_groups",
  "creative_text",
  "monitoring_synthesis",
] as const;
export const runStatusValues = ["queued", "running", "succeeded", "failed", "cancelled"] as const;
export const reviewStatusValues = ["pending", "approved", "edited", "rejected", "enriched"] as const;
export const featureTypeValues = ["feature", "value_prop", "usp", "use_case", "proof_point", "objection"] as const;
export const reviewEntityTypeValues = [
  "extraction_run",
  "brand_feature",
  "conversation",
  "landing_gap",
  "campaign",
  "ad_group",
  "creative_variant",
  "performance_snapshot",
] as const;
export const reviewActionValues = ["approve", "edit", "reject", "enrich"] as const;
export const adGroupStatusValues = ["draft", "approved", "creative_generated", "deployed", "rejected"] as const;
export const campaignObjectiveValues = ["Views", "Clicks"] as const;
export const campaignStatusValues = ["draft", "approved", "deployed", "rejected"] as const;
export const creativeAssetTypeValues = ["image", "video", "none"] as const;
export const assetGenerationStatusValues = ["not_requested", "pending", "skipped", "ready", "failed"] as const;
export const creativeStatusValues = ["draft", "approved", "rejected", "archived"] as const;
export const deploymentStatusValues = ["fake_deployed", "failed"] as const;
export const performanceSnapshotKindValues = ["simulated", "imported"] as const;
export const productFeedStatusValues = ["draft", "uploaded", "processed", "failed", "export_ready"] as const;

export const stageValues = [
  "problem_aware",
  "solution_compare",
  "vendor_evaluation",
  "pricing_check",
  "security_review",
  "ready_to_buy",
  "post_purchase",
] as const;
export const intentTypeValues = [
  "workflow_pain",
  "migration_risk",
  "proof_request",
  "budget_validation",
  "trust_check",
  "integration_check",
  "urgency_timeline",
  "competitive_switch",
] as const;
export const buyerRoleValues = [
  "founder",
  "revenue_lead",
  "marketing_lead",
  "customer_success",
  "operations",
  "security",
  "finance",
  "unknown",
] as const;
export const landingGapTypeValues = [
  "proof",
  "comparison",
  "setup_path",
  "pricing_clarity",
  "trust_compliance",
  "integration_depth",
  "security",
  "performance",
  "other",
] as const;
export const constraintTypeValues = [
  "budget",
  "timeline",
  "integration",
  "team_size",
  "compliance",
  "migration_object",
  "approval_process",
  "geography",
  "existing_tool",
  "technical",
  "other",
] as const;

export const uuidSchema = z.uuid();
export const nullableUuidSchema = uuidSchema.nullable();
export const timestampSchema = z.string().min(1);
export const dateSchema = z.string().min(1);
export const jsonObjectSchema = z.record(z.string(), z.unknown());
export const jsonArraySchema = z.array(z.unknown());
export const qualityScore = z.number().int().min(1).max(100);

const baseRowSchema = z.object({
  id: uuidSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

const optionalBaseRowSchema = z.object({
  id: uuidSchema.optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

export const constraintSchema = z.object({
  type: z.enum(constraintTypeValues),
  value: z.string().min(1),
  evidence: z.string().optional(),
});

export const projectSchema = baseRowSchema.extend({
  owner_user_id: nullableUuidSchema,
  name: z.string().min(1),
  brand_url: z.url(),
  status: z.enum(projectStatusValues),
  extra_context: z.string().nullable(),
  demo_slug: z.string().nullable(),
  metadata: jsonObjectSchema,
});

export const sourceSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  type: z.enum(sourceTypeValues),
  name: z.string().min(1),
  uri: z.string().nullable(),
  storage_path: z.string().nullable(),
  mime_type: z.string().nullable(),
  raw_text: z.string().nullable(),
  extracted_text: z.string().nullable(),
  status: z.enum(sourceStatusValues),
  provider: z.string().nullable(),
  provider_request_json: jsonObjectSchema,
  provider_response_json: jsonObjectSchema,
  error: z.string().nullable(),
  metadata: jsonObjectSchema,
});

export const extractionRunSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  phase: z.enum(extractionPhaseValues),
  status: z.enum(runStatusValues),
  model: z.string().nullable(),
  provider: z.string().min(1),
  prompt_version: z.string().min(1),
  input_json: jsonObjectSchema,
  output_json: jsonObjectSchema,
  error: z.string().nullable(),
  started_at: timestampSchema.nullable(),
  completed_at: timestampSchema.nullable(),
  duration_ms: z.number().int().nonnegative().nullable(),
  attempt: z.number().int().nonnegative(),
  inngest_run_id: z.string().nullable(),
  metadata: jsonObjectSchema,
});

export const brandFeatureSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  extraction_run_id: nullableUuidSchema,
  type: z.enum(featureTypeValues),
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.string().nullable(),
  source_refs: jsonArraySchema,
  confidence: z.number().min(0).max(1).nullable(),
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const conversationSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  extraction_run_id: nullableUuidSchema,
  text: z.string().min(1),
  stage: z.enum(stageValues).or(z.string().min(1)),
  intent_type: z.enum(intentTypeValues).or(z.string().min(1)),
  buyer_role: z.enum(buyerRoleValues).or(z.string().min(1)).nullable(),
  constraints_json: z.object({ constraints: z.array(constraintSchema).optional() }).catchall(z.unknown()),
  source_refs: jsonArraySchema,
  confidence: z.number().min(0).max(1).nullable(),
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const landingGapSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  extraction_run_id: nullableUuidSchema,
  conversation_id: nullableUuidSchema,
  gap_type: z.enum(landingGapTypeValues).or(z.string().min(1)),
  description: z.string().min(1),
  suggested_fix: z.string().min(1),
  severity: z.number().int().min(1).max(5),
  source_refs: jsonArraySchema,
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const campaignSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  extraction_run_id: nullableUuidSchema,
  name: z.string().min(3),
  objective: z.enum(campaignObjectiveValues),
  status: z.enum(campaignStatusValues),
  start_date: dateSchema.nullable(),
  end_date: dateSchema.nullable(),
  lifetime_spend_limit_micros: z.number().int().min(1_000_000),
  countries: z.array(z.string().length(2)).min(1),
  custom_instruction: z.string().nullable(),
  rationale: z.string().nullable(),
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const adGroupSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  campaign_id: nullableUuidSchema,
  extraction_run_id: nullableUuidSchema,
  name: z.string().min(3),
  rationale: z.string().min(1),
  context_hints: z.array(z.string().min(1)),
  billing_event_type: z.literal("click").or(z.string().min(1)),
  max_bid_micros: z.number().int().positive(),
  target_stage: z.string().nullable(),
  target_intent: z.string().nullable(),
  conversation_ids: z.array(uuidSchema),
  feature_ids: z.array(uuidSchema),
  landing_gap_ids: z.array(uuidSchema),
  product_feed_item_ids: z.array(uuidSchema),
  status: z.enum(adGroupStatusValues),
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const creativeVariantSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  ad_group_id: uuidSchema,
  extraction_run_id: nullableUuidSchema,
  title: z.string().min(3).max(50),
  description: z.string().max(100),
  creative_angle: z.string().min(1),
  asset_type: z.enum(creativeAssetTypeValues),
  asset_prompt: z.string().nullable(),
  asset_url: z.string().nullable(),
  asset_storage_path: z.string().nullable(),
  asset_generation_status: z.enum(assetGenerationStatusValues),
  asset_width: z.number().int().positive().nullable(),
  asset_height: z.number().int().positive().nullable(),
  asset_mime_type: z.string().nullable(),
  openai_file_id: z.string().nullable(),
  target_url: z.string().nullable(),
  openai_ad_type: z.literal("chat_card").or(z.string().min(1)),
  openai_ad_status: z.literal("paused").or(z.string().min(1)),
  provider: z.string().nullable(),
  provider_request_json: jsonObjectSchema,
  provider_response_json: jsonObjectSchema,
  openai_validation_json: jsonObjectSchema,
  status: z.enum(creativeStatusValues),
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const humanReviewSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  reviewer_user_id: nullableUuidSchema,
  entity_type: z.enum(reviewEntityTypeValues),
  entity_id: uuidSchema,
  action: z.enum(reviewActionValues),
  before_json: jsonObjectSchema,
  after_json: jsonObjectSchema,
  comment: z.string().nullable(),
  metadata: jsonObjectSchema,
});

export const deploymentSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  status: z.enum(deploymentStatusValues),
  deployed_at: timestampSchema.nullable(),
  payload_json: jsonObjectSchema,
  metadata: jsonObjectSchema,
});

export const performanceSnapshotSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  deployment_id: nullableUuidSchema,
  ad_group_id: nullableUuidSchema,
  creative_variant_id: nullableUuidSchema,
  conversation_id: nullableUuidSchema,
  snapshot_kind: z.enum(performanceSnapshotKindValues),
  period_start: timestampSchema,
  period_end: timestampSchema,
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  ctr: z.number().nonnegative(),
  conversions: z.number().int().nonnegative(),
  cvr: z.number().nonnegative(),
  spend: z.number().nonnegative(),
  quality_score: qualityScore,
  insight: z.string().min(1),
  recommended_action: z.string().min(1),
  metric_basis_json: jsonObjectSchema,
  confidence: z.string().min(1),
  notes: z.string().nullable(),
  provider_request_json: jsonObjectSchema,
  provider_response_json: jsonObjectSchema,
  metadata: jsonObjectSchema,
});

export const productFeedSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  name: z.string().min(1),
  source_type: z.string().min(1),
  source_uri: z.string().nullable(),
  storage_path: z.string().nullable(),
  format: z.string().nullable(),
  status: z.enum(productFeedStatusValues),
  item_count: z.number().int().nonnegative(),
  provider_request_json: jsonObjectSchema,
  provider_response_json: jsonObjectSchema,
  error: z.string().nullable(),
  metadata: jsonObjectSchema,
});

export const productFeedItemSchema = baseRowSchema.extend({
  project_id: uuidSchema,
  product_feed_id: uuidSchema,
  item_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  link: z.string().nullable(),
  image_link: z.string().nullable(),
  availability: z.string().nullable(),
  price: z.string().nullable(),
  brand: z.string().nullable(),
  google_product_category: z.string().nullable(),
  product_type: z.string().nullable(),
  condition: z.string().nullable(),
  raw_json: jsonObjectSchema,
  review_status: z.enum(reviewStatusValues),
  metadata: jsonObjectSchema,
});

export const projectInsertSchema = projectSchema.merge(optionalBaseRowSchema).omit({
  created_at: true,
  updated_at: true,
});

export const openAiAdsExportSchema = z.object({
  campaign: z.object({
    name: z.string().min(3),
    objective: z.enum(campaignObjectiveValues),
    start_date: dateSchema,
    end_date: dateSchema,
    budget: z.object({
      lifetime_spend_limit_micros: z.number().int().min(1_000_000),
    }),
    targeting: z.object({
      locations: z.object({
        countries: z.array(z.string().length(2)).min(1),
      }),
    }),
    custom_instruction: z.string().optional(),
  }),
  ad_groups: z.array(
    z.object({
      name: z.string().min(3),
      context_hints: z.array(z.string().min(1)).min(1),
      bidding_config: z.object({
        billing_event_type: z.literal("click"),
        max_bid_micros: z.number().int().positive(),
      }),
    }),
  ),
  ads: z.array(
    z.object({
      ad_group_name: z.string().min(3),
      type: z.literal("chat_card"),
      title: z.string().min(3).max(50),
      body: z.string().min(1).max(100),
      target_url: z.url(),
      file_id: z.string().optional(),
      image_url_for_bulk_upload: z.url().optional(),
      status: z.literal("paused"),
    }),
  ),
});

export type ProjectStatus = (typeof projectStatusValues)[number];
export type SourceType = (typeof sourceTypeValues)[number];
export type ExtractionPhase = (typeof extractionPhaseValues)[number];
export type ReviewStatus = (typeof reviewStatusValues)[number];
export type ReviewAction = (typeof reviewActionValues)[number];
export type Project = z.infer<typeof projectSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type ExtractionRun = z.infer<typeof extractionRunSchema>;
export type BrandFeature = z.infer<typeof brandFeatureSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type LandingGap = z.infer<typeof landingGapSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type AdGroup = z.infer<typeof adGroupSchema>;
export type CreativeVariant = z.infer<typeof creativeVariantSchema>;
export type HumanReview = z.infer<typeof humanReviewSchema>;
export type Deployment = z.infer<typeof deploymentSchema>;
export type PerformanceSnapshot = z.infer<typeof performanceSnapshotSchema>;
export type ProductFeed = z.infer<typeof productFeedSchema>;
export type ProductFeedItem = z.infer<typeof productFeedItemSchema>;
export type OpenAiAdsExport = z.infer<typeof openAiAdsExportSchema>;

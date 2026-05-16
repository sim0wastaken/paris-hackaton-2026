export const DEFAULT_DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_DEMO_SEED_VERSION = "2026-05-16.worker-e.v1";

export const DEMO_REPLAY_PHASES = [
  "source_recap",
  "feature_map",
  "conversation_map",
  "intent_classification",
  "landing_gaps",
  "ad_groups",
  "creative_text",
  "monitoring_synthesis"
] as const;

export type DemoReplayPhase = (typeof DEMO_REPLAY_PHASES)[number];

export type SeededDemoDataset = {
  project: DemoProjectRow;
  sources: DemoSourceRow[];
  extraction_runs: DemoExtractionRunRow[];
  brand_features: DemoBrandFeatureRow[];
  conversations: DemoConversationRow[];
  landing_gaps: DemoLandingGapRow[];
  campaigns: DemoCampaignRow[];
  product_feeds: DemoProductFeedRow[];
  product_feed_items: DemoProductFeedItemRow[];
  ad_groups: DemoAdGroupRow[];
  creative_variants: DemoCreativeVariantRow[];
  human_reviews: DemoHumanReviewRow[];
  deployments: DemoDeploymentRow[];
  performance_snapshots: DemoPerformanceSnapshotRow[];
};

export type DemoProjectRow = {
  id: string;
  name: string;
  brand_url: string;
  status: "draft" | "extracting" | "review" | "creative_ready" | "deployed" | "failed";
  extra_context: string | null;
  demo_slug: string;
  metadata: Record<string, unknown>;
};

export type DemoSourceRow = {
  id: string;
  project_id: string;
  type: "url" | "markdown" | "text" | "product_feed";
  name: string;
  uri: string | null;
  raw_text: string | null;
  extracted_text: string | null;
  status: "processed";
  provider: string | null;
  provider_request_json: Record<string, unknown>;
  provider_response_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type DemoExtractionRunRow = {
  id: string;
  project_id: string;
  phase: DemoReplayPhase;
  status: "queued" | "running" | "succeeded";
  model: string;
  provider: "seeded_fixture";
  prompt_version: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  error: null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  attempt: number;
  metadata: Record<string, unknown>;
};

export type DemoBrandFeatureRow = {
  id: string;
  project_id: string;
  extraction_run_id: string;
  type: "feature" | "value_prop" | "usp" | "use_case" | "proof_point" | "objection";
  title: string;
  description: string;
  evidence: string;
  source_refs: string[];
  confidence: number;
  review_status: "pending" | "approved" | "edited";
  metadata: Record<string, unknown>;
};

export type DemoConversationRow = {
  id: string;
  project_id: string;
  extraction_run_id: string;
  text: string;
  stage: string;
  intent_type: string;
  buyer_role: string;
  constraints_json: {
    constraints: Array<{
      type: string;
      value: string;
      evidence?: string;
    }>;
  };
  source_refs: string[];
  confidence: number;
  review_status: "pending" | "approved" | "edited";
  metadata: Record<string, unknown>;
};

export type DemoLandingGapRow = {
  id: string;
  project_id: string;
  extraction_run_id: string;
  conversation_id: string;
  gap_type: string;
  description: string;
  suggested_fix: string;
  severity: number;
  source_refs: string[];
  review_status: "pending" | "approved" | "edited";
  metadata: Record<string, unknown>;
};

export type DemoCampaignRow = {
  id: string;
  project_id: string;
  extraction_run_id: string;
  name: string;
  objective: "Clicks" | "Views";
  status: "approved" | "deployed";
  start_date: string;
  end_date: string;
  lifetime_spend_limit_micros: number;
  countries: string[];
  custom_instruction: string;
  rationale: string;
  review_status: "approved";
  metadata: Record<string, unknown>;
};

export type DemoProductFeedRow = {
  id: string;
  project_id: string;
  name: string;
  source_type: string;
  format: string;
  status: "processed";
  item_count: number;
  metadata: Record<string, unknown>;
};

export type DemoProductFeedItemRow = {
  id: string;
  project_id: string;
  product_feed_id: string;
  item_id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  availability: string;
  price: string;
  brand: string;
  google_product_category: string;
  product_type: string;
  condition: string;
  raw_json: Record<string, unknown>;
  review_status: "pending" | "approved";
  metadata: Record<string, unknown>;
};

export type DemoAdGroupRow = {
  id: string;
  project_id: string;
  campaign_id: string;
  extraction_run_id: string;
  name: string;
  rationale: string;
  context_hints: string[];
  billing_event_type: "click";
  max_bid_micros: number;
  target_stage: string;
  target_intent: string;
  conversation_ids: string[];
  feature_ids: string[];
  landing_gap_ids: string[];
  product_feed_item_ids: string[];
  status: "approved" | "deployed";
  review_status: "approved";
  metadata: Record<string, unknown>;
};

export type DemoCreativeVariantRow = {
  id: string;
  project_id: string;
  ad_group_id: string;
  extraction_run_id: string;
  title: string;
  description: string;
  creative_angle: string;
  asset_type: "image" | "none";
  asset_prompt: string | null;
  asset_url: string | null;
  asset_generation_status: "ready" | "skipped";
  asset_width: number | null;
  asset_height: number | null;
  asset_mime_type: string | null;
  target_url: string;
  provider: "seeded_fixture";
  provider_request_json: Record<string, unknown>;
  provider_response_json: Record<string, unknown>;
  openai_validation_json: Record<string, unknown>;
  status: "draft" | "approved";
  review_status: "pending" | "approved" | "edited";
  metadata: Record<string, unknown>;
};

export type DemoHumanReviewRow = {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: Record<string, unknown>;
  after_json: Record<string, unknown>;
  comment: string;
  metadata: Record<string, unknown>;
};

export type DemoDeploymentRow = {
  id: string;
  project_id: string;
  status: "fake_deployed";
  deployed_at: string;
  payload_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type DemoPerformanceSnapshotRow = {
  id: string;
  project_id: string;
  deployment_id: string;
  ad_group_id: string;
  creative_variant_id: string;
  conversation_id: string;
  snapshot_kind: "simulated";
  period_start: string;
  period_end: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cvr: number;
  spend: number;
  quality_score: number;
  insight: string;
  recommended_action: string;
  metric_basis_json: Record<string, unknown>;
  confidence: string;
  notes: string;
  provider_request_json: Record<string, unknown>;
  provider_response_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type DemoResetInput = {
  demoProjectId: string;
  seedVersion: string;
  replay: boolean;
  requestedBy: string;
};

export type DemoReplayInput = {
  projectId: string;
  demoRunId: string;
  seedVersion: string;
  requestedBy: string;
};

export type DemoReplayRequestedEvent = {
  projectId: string;
  demoRunId: string;
  seedVersion: string;
  requestedBy: string;
  mode: "seeded_fixture";
};

export type DemoResetRepository = {
  replaceWithCompleteDataset(dataset: SeededDemoDataset): Promise<void>;
};

export type DemoReplayRepository = {
  prepareReplay(dataset: SeededDemoDataset): Promise<void>;
  startPhase(phase: DemoReplayPhase, run: DemoExtractionRunRow): Promise<void>;
  completePhase(phase: DemoReplayPhase, dataset: SeededDemoDataset): Promise<void>;
};

export type DemoResetResult = {
  project_id: string;
  demo_run_id: string;
  seed_version: string;
  replay_started: boolean;
  replay_error?: string;
};

export type DemoReplayResult = {
  status: "succeeded";
  project_id: string;
  demo_run_id: string;
  seed_version: string;
  phases: DemoReplayPhase[];
};

export function buildSeededDemoDataset(options: {
  demoProjectId?: string;
  seedVersion?: string;
  demoRunId?: string;
  now?: Date;
  projectStatus?: DemoProjectRow["status"];
} = {}): SeededDemoDataset {
  const projectId = options.demoProjectId ?? DEFAULT_DEMO_PROJECT_ID;
  const seedVersion = options.seedVersion ?? DEFAULT_DEMO_SEED_VERSION;
  const demoRunId = options.demoRunId ?? "seeded-baseline";
  const now = options.now ?? new Date();
  const nowIso = now.toISOString();
  const periodStart = "2026-05-16T00:00:00Z";
  const periodEnd = "2026-05-23T00:00:00Z";
  const metadata = {
    is_seeded_demo: true,
    demo_seed_version: seedVersion,
    demo_run_id: demoRunId,
    demo_project_id: projectId,
    provider_mode: "seeded_fixture"
  };
  const sourceIds = {
    homepage: "10000000-0000-0000-0000-000000000001",
    founder: "10000000-0000-0000-0000-000000000002",
    quotes: "10000000-0000-0000-0000-000000000003"
  };
  const runIds = {
    source_recap: "20000000-0000-0000-0000-000000000001",
    feature_map: "20000000-0000-0000-0000-000000000002",
    conversation_map: "20000000-0000-0000-0000-000000000003",
    intent_classification: "20000000-0000-0000-0000-000000000004",
    landing_gaps: "20000000-0000-0000-0000-000000000005",
    ad_groups: "20000000-0000-0000-0000-000000000006",
    creative_text: "20000000-0000-0000-0000-000000000007",
    monitoring_synthesis: "20000000-0000-0000-0000-000000000008"
  } satisfies Record<DemoReplayPhase, string>;
  const featureIds = Array.from({ length: 10 }, (_, index) => `30000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  const conversationIds = Array.from({ length: 8 }, (_, index) => `40000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  const gapIds = Array.from({ length: 5 }, (_, index) => `50000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  const campaignId = "60000000-0000-0000-0000-000000000001";
  const feedId = "61000000-0000-0000-0000-000000000001";
  const productIds = ["62000000-0000-0000-0000-000000000001", "62000000-0000-0000-0000-000000000002"];
  const adGroupIds = Array.from({ length: 4 }, (_, index) => `70000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  const creativeIds = Array.from({ length: 6 }, (_, index) => `80000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`);
  const deploymentId = "90000000-0000-0000-0000-000000000001";

  const sources: DemoSourceRow[] = [
    {
      id: sourceIds.homepage,
      project_id: projectId,
      type: "url",
      name: "AtlasDesk homepage",
      uri: "https://demo.motive.local/atlasdesk",
      raw_text: homepageSourceText,
      extracted_text: homepageSourceText,
      status: "processed",
      provider: "seeded_fixture",
      provider_request_json: { url: "https://demo.motive.local/atlasdesk" },
      provider_response_json: { status: "seeded_fixture" },
      metadata: { ...metadata, source_role: "homepage_copy" }
    },
    {
      id: sourceIds.founder,
      project_id: projectId,
      type: "markdown",
      name: "Founder positioning note",
      uri: null,
      raw_text: founderSourceText,
      extracted_text: founderSourceText,
      status: "processed",
      provider: "seeded_fixture",
      provider_request_json: {},
      provider_response_json: { status: "seeded_fixture" },
      metadata: { ...metadata, source_role: "founder_note" }
    },
    {
      id: sourceIds.quotes,
      project_id: projectId,
      type: "text",
      name: "Customer quote snippets",
      uri: null,
      raw_text: quoteSourceText,
      extracted_text: quoteSourceText,
      status: "processed",
      provider: "seeded_fixture",
      provider_request_json: {},
      provider_response_json: { status: "seeded_fixture" },
      metadata: { ...metadata, source_role: "customer_quotes" }
    }
  ];

  const extraction_runs = DEMO_REPLAY_PHASES.map((phase, index) => buildRun({
    id: runIds[phase],
    phase,
    projectId,
    seedVersion,
    demoRunId,
    startedAt: new Date(now.getTime() + index * 1000).toISOString(),
    completedAt: new Date(now.getTime() + index * 1000 + 650).toISOString(),
    input_json: {
      demo_run_id: demoRunId,
      source_ids: sources.map((source) => source.id),
      provider_mode: "seeded_fixture"
    },
    output_json: outputForPhase(phase),
    metadata
  }));

  const brand_features: DemoBrandFeatureRow[] = [
    feature(featureIds[0], "feature", "Gmail-native workspace", "Sales follow-up stays inside Gmail, not a separate CRM tab.", "AtlasDesk turns Gmail conversations into CRM-ready follow-up.", sourceIds.homepage, "approved", metadata),
    feature(featureIds[1], "value_prop", "Live before Friday", "Teams can launch a working inbox follow-up process this week.", "Setup promise is before Friday.", sourceIds.homepage, "approved", metadata),
    feature(featureIds[2], "usp", "Label-safe migration", "Existing Gmail labels and spreadsheet notes can become structured follow-up.", "Founder note names import labels and spreadsheet migration.", sourceIds.founder, "approved", metadata),
    feature(featureIds[3], "use_case", "Founder-led sales", "Small teams can keep founder inboxes from dropping buyer next steps.", "ICP is founder-led B2B software companies.", sourceIds.founder, "approved", metadata),
    feature(featureIds[4], "proof_point", "Setup checklist proof", "The strongest proof request is a visible launch checklist with owner and time estimates.", "Customers ask to prove setup works before Friday.", sourceIds.quotes, "approved", metadata),
    feature(featureIds[5], "objection", "Pricing clarity", "Small teams need a clear answer under 500 USD/month.", "Pricing-check buyers ask for under 500 USD/month.", sourceIds.quotes, "approved", metadata),
    feature(featureIds[6], "objection", "SOC 2 proof missing", "Security-minded buyers need proof before approving Gmail access.", "Security review asks for SOC 2 proof.", sourceIds.quotes, "approved", metadata),
    feature(featureIds[7], "feature", "Thread-to-next-step capture", "Every buyer thread can be assigned a next step and owner.", "Homepage promises CRM-ready follow-up.", sourceIds.homepage, "approved", metadata),
    feature(featureIds[8], "proof_point", "HubSpot coexistence", "Migration copy should explain that Gmail follow-up can coexist with HubSpot sync.", "Revenue lead asks about import labels and HubSpot sync.", sourceIds.founder, "edited", metadata),
    feature(featureIds[9], "value_prop", "No context switching", "Revenue teams can manage follow-up without leaving Gmail.", "Gmail-only constraint repeats in quotes.", sourceIds.quotes, "pending", metadata)
  ];

  const conversations: DemoConversationRow[] = [
    conversation(conversationIds[0], runIds.intent_classification, "Our founder still works only from Gmail. Can AtlasDesk make those messy inbox threads CRM-ready without forcing reps into another tool?", "problem_aware", "workflow_pain", "founder", [{ type: "existing_tool", value: "Gmail only", evidence: "Founder asks to stay in Gmail." }], sourceIds.quotes, "approved", "conversation_1", metadata),
    conversation(conversationIds[1], runIds.intent_classification, "Can you import existing inbox labels and spreadsheet notes without breaking HubSpot sync?", "solution_compare", "migration_risk", "revenue_lead", [{ type: "migration_object", value: "import existing inbox labels", evidence: "Buyer names labels and spreadsheet notes." }], sourceIds.founder, "approved", "conversation_2", metadata),
    conversation(conversationIds[2], runIds.intent_classification, "We need proof setup works before Friday because our customer-success team is presenting the workflow next week.", "vendor_evaluation", "proof_request", "customer_success", [{ type: "timeline", value: "prove setup works before Friday", evidence: "Buyer asks for Friday proof." }], sourceIds.quotes, "approved", "conversation_3", metadata),
    conversation(conversationIds[3], runIds.intent_classification, "Can operations keep this under 500 USD per month for a ten-person team?", "pricing_check", "budget_validation", "operations", [{ type: "budget", value: "under 500 USD/month", evidence: "Buyer states budget cap." }], sourceIds.quotes, "pending", "conversation_4", metadata),
    conversation(conversationIds[4], runIds.intent_classification, "Operations needs SOC 2 proof and a clear Gmail permissions explanation before we approve.", "security_review", "trust_check", "operations", [{ type: "compliance", value: "SOC 2 proof missing", evidence: "Buyer asks for SOC 2 and permissions." }], sourceIds.quotes, "approved", "conversation_5", metadata),
    conversation(conversationIds[5], runIds.intent_classification, "We are switching from spreadsheets because follow-up owners disappear after trade-show demos.", "problem_aware", "workflow_pain", "revenue_lead", [{ type: "existing_tool", value: "spreadsheets", evidence: "Buyer names spreadsheets." }], sourceIds.founder, "approved", "conversation_6", metadata),
    conversation(conversationIds[6], runIds.intent_classification, "Does this compare against a lightweight CRM rollout without adding admin work?", "solution_compare", "competitive_switch", "founder", [{ type: "approval_process", value: "avoid admin-heavy CRM rollout", evidence: "Buyer compares rollout burden." }], sourceIds.founder, "approved", "conversation_7", metadata),
    conversation(conversationIds[7], runIds.intent_classification, "If the Gmail integration is reliable, we are ready to buy after the setup checklist review.", "ready_to_buy", "integration_check", "operations", [{ type: "integration", value: "reliable Gmail integration", evidence: "Buyer names Gmail integration." }], sourceIds.quotes, "approved", "conversation_8", metadata)
  ];

  const landing_gaps: DemoLandingGapRow[] = [
    gap(gapIds[0], conversationIds[2], "proof", "The page promises fast setup but does not show proof that setup can work before Friday.", "Add a Friday setup checklist with owner, task, and timing proof.", 5, sourceIds.homepage, "approved", "gap_1", metadata),
    gap(gapIds[1], conversationIds[1], "setup_path", "Migration copy does not explain how existing Gmail labels are preserved.", "Add a migration path section showing label import and rollback steps.", 5, sourceIds.founder, "approved", "gap_2", metadata),
    gap(gapIds[2], conversationIds[3], "pricing_clarity", "Small-team pricing and minimum contract details are not visible.", "Add an under-500 USD/month small-team package or pricing FAQ.", 5, sourceIds.quotes, "pending", "gap_3", metadata),
    gap(gapIds[3], conversationIds[4], "trust_compliance", "The security section does not answer SOC 2 or Gmail permission questions.", "Add SOC 2 status, OAuth scopes, retention, and admin-control proof.", 5, sourceIds.quotes, "approved", "gap_4", metadata),
    gap(gapIds[4], conversationIds[6], "comparison", "The page does not compare AtlasDesk against a lightweight CRM rollout.", "Add a comparison block against spreadsheet and CRM admin overhead.", 3, sourceIds.founder, "approved", "gap_5", metadata)
  ];

  const campaigns: DemoCampaignRow[] = [
    {
      id: campaignId,
      project_id: projectId,
      extraction_run_id: runIds.ad_groups,
      name: "AtlasDesk - Gmail setup sprint",
      objective: "Clicks",
      status: options.projectStatus === "deployed" || options.projectStatus === undefined ? "deployed" : "approved",
      start_date: "2026-05-16",
      end_date: "2026-06-15",
      lifetime_spend_limit_micros: 5_000_000,
      countries: ["US"],
      custom_instruction: "Bias generation toward Gmail setup speed, migration safety, proof-seeking buyers, and pricing clarity.",
      rationale: "Campaign groups the seeded AtlasDesk conversations by the strongest purchase constraints.",
      review_status: "approved",
      metadata
    }
  ];

  const product_feeds: DemoProductFeedRow[] = [
    {
      id: feedId,
      project_id: projectId,
      name: "AtlasDesk demo plan feed",
      source_type: "manual",
      format: "jsonl",
      status: "processed",
      item_count: 2,
      metadata: { ...metadata, note: "Product-feed path exists even though the primary demo is B2B SaaS." }
    }
  ];
  const product_feed_items: DemoProductFeedItemRow[] = [
    product(productIds[0], projectId, feedId, "atlasdesk-starter", "AtlasDesk Starter", "Gmail-native follow-up for small revenue teams.", "49 USD", "approved", metadata),
    product(productIds[1], projectId, feedId, "atlasdesk-growth", "AtlasDesk Growth", "Advanced follow-up controls for growing founder-led teams.", "149 USD", "pending", metadata)
  ];

  const ad_groups: DemoAdGroupRow[] = [
    adGroup(adGroupIds[0], projectId, campaignId, runIds.ad_groups, "Inbox chaos to CRM follow-up", "Targets founders who feel Gmail-only follow-up pain and need CRM-ready next steps.", ["Gmail-only founder inbox", "CRM-ready next steps", "stop dropped follow-ups"], "problem_aware", "workflow_pain", [conversationIds[0], conversationIds[5]], [featureIds[0], featureIds[7], featureIds[9]], [], [productIds[0]], metadata),
    adGroup(adGroupIds[1], projectId, campaignId, runIds.ad_groups, "Friday setup promise", "Targets proof-seeking buyers with a time-bound setup promise.", ["prove setup before Friday", "ten-person revenue team", "launch checklist"], "vendor_evaluation", "proof_request", [conversationIds[2], conversationIds[7]], [featureIds[1], featureIds[4]], [gapIds[0]], [], metadata),
    adGroup(adGroupIds[2], projectId, campaignId, runIds.ad_groups, "Migration without losing labels", "Targets teams switching from spreadsheets and worried about losing Gmail labels.", ["import existing inbox labels", "spreadsheet migration", "HubSpot sync safety"], "solution_compare", "migration_risk", [conversationIds[1], conversationIds[6]], [featureIds[2], featureIds[8]], [gapIds[1], gapIds[4]], [productIds[1]], metadata),
    adGroup(adGroupIds[3], projectId, campaignId, runIds.ad_groups, "Trust and pricing clarity", "Targets operations buyers who need pricing clarity and trust proof before approval.", ["under 500 USD/month", "SOC 2 proof", "Gmail permissions"], "pricing_check", "budget_validation", [conversationIds[3], conversationIds[4]], [featureIds[5], featureIds[6]], [gapIds[2], gapIds[3]], [], metadata)
  ];

  const creative_variants: DemoCreativeVariantRow[] = [
    creative(creativeIds[0], projectId, adGroupIds[0], runIds.creative_text, "Stop losing follow-ups", "Turn messy Gmail threads into CRM-ready next steps.", "workflow_pain_specific", "image", "Square SaaS ad showing Gmail threads becoming organized CRM follow-up cards.", "https://demo.motive.local/assets/atlasdesk-followups.jpg", "https://demo.motive.local/atlasdesk/gmail-crm", "approved", "approved", metadata),
    creative(creativeIds[1], projectId, adGroupIds[1], runIds.creative_text, "Live in Gmail by Friday", "Prove setup works before the week ends.", "timeline_proof", "image", "Square image of a Friday launch checklist beside a Gmail inbox.", "https://demo.motive.local/assets/atlasdesk-friday.jpg", "https://demo.motive.local/atlasdesk/setup", "approved", "approved", metadata),
    creative(creativeIds[2], projectId, adGroupIds[1], runIds.creative_text, "Simple CRM for teams", "Give modern teams an easier way to manage follow-up.", "generic_value_prop", "none", "Prompt-only fallback intentionally generic for monitoring contrast.", null, "https://demo.motive.local/atlasdesk/setup", "draft", "pending", metadata),
    creative(creativeIds[3], projectId, adGroupIds[2], runIds.creative_text, "Keep every Gmail label", "Import inbox labels while planning HubSpot sync.", "migration_setup", "image", "Square image of Gmail labels moving safely into structured follow-up lanes.", "https://demo.motive.local/assets/atlasdesk-labels.jpg", "https://demo.motive.local/atlasdesk/migration", "approved", "approved", metadata),
    creative(creativeIds[4], projectId, adGroupIds[3], runIds.creative_text, "Pricing without guesswork", "Answer budget blockers before operations stalls.", "pricing_clarity", "none", "Prompt-only card focused on the missing pricing FAQ.", null, "https://demo.motive.local/atlasdesk/pricing", "draft", "pending", metadata),
    creative(creativeIds[5], projectId, adGroupIds[3], runIds.creative_text, "SOC 2 proof for Gmail", "Show security review details before approval.", "trust_proof", "image", "Square proof dashboard with Gmail permission scopes and SOC 2 checklist.", "https://demo.motive.local/assets/atlasdesk-trust.jpg", "https://demo.motive.local/atlasdesk/security", "approved", "edited", metadata)
  ];

  const deploymentPayload = buildDeploymentPayload(campaigns[0], ad_groups, creative_variants, nowIso);
  const deployments: DemoDeploymentRow[] = [
    {
      id: deploymentId,
      project_id: projectId,
      status: "fake_deployed",
      deployed_at: nowIso,
      payload_json: deploymentPayload,
      metadata
    }
  ];

  const performance_snapshots: DemoPerformanceSnapshotRow[] = [
    snapshot("91000000-0000-0000-0000-000000000001", projectId, deploymentId, adGroupIds[1], creativeIds[1], conversationIds[2], periodStart, periodEnd, 91, 4200, 315, 54, 840, "Specific Friday setup copy wins because it mirrors the proof-before-Friday constraint.", "Scale the Friday setup promise after adding the launch checklist proof.", ["specific timeline", "proof request"], metadata),
    snapshot("91000000-0000-0000-0000-000000000002", projectId, deploymentId, adGroupIds[0], creativeIds[0], conversationIds[0], periodStart, periodEnd, 84, 3800, 250, 39, 690, "Workflow-pain copy is balanced because it names Gmail mess and CRM-ready next steps.", "Keep the Gmail-only constraint in the first sentence.", ["workflow pain", "Gmail only"], metadata),
    snapshot("91000000-0000-0000-0000-000000000003", projectId, deploymentId, adGroupIds[1], creativeIds[2], conversationIds[7], periodStart, periodEnd, 52, 3100, 128, 12, 430, "Generic team CRM copy underperforms because it drops the Friday proof constraint.", "Rewrite this variant around the Friday setup checklist.", ["generic angle", "missing constraint"], metadata),
    snapshot("91000000-0000-0000-0000-000000000004", projectId, deploymentId, adGroupIds[2], creativeIds[3], conversationIds[1], periodStart, periodEnd, 82, 3600, 246, 31, 765, "Migration copy improves conversion because it names Gmail labels and HubSpot sync risk.", "Add migration proof to the landing page before increasing budget.", ["migration risk", "setup path"], metadata),
    snapshot("91000000-0000-0000-0000-000000000005", projectId, deploymentId, adGroupIds[3], creativeIds[4], conversationIds[3], periodStart, periodEnd, 47, 3000, 150, 10, 510, "Pricing-check audiences punish the missing under-500 USD pricing proof.", "Do not scale pricing traffic until the pricing FAQ is visible.", ["pricing clarity gap"], metadata),
    snapshot("91000000-0000-0000-0000-000000000006", projectId, deploymentId, adGroupIds[3], creativeIds[5], conversationIds[4], periodStart, periodEnd, 74, 3300, 218, 23, 720, "Trust-heavy copy earns clicks from operations buyers, but conversion waits on SOC 2 proof.", "Add SOC 2 and Gmail permissions proof before scaling security-review traffic.", ["trust check", "SOC 2 proof"], metadata)
  ];

  const human_reviews: DemoHumanReviewRow[] = [
    review("81000000-0000-0000-0000-000000000001", projectId, "brand_feature", featureIds[8], "edit", { title: "HubSpot mention" }, { title: "HubSpot coexistence" }, "Clarified that this evidence is about migration safety.", metadata),
    review("81000000-0000-0000-0000-000000000002", projectId, "conversation", conversationIds[0], "approve", {}, { review_status: "approved" }, "Strong Gmail-only workflow-pain signal.", metadata),
    review("81000000-0000-0000-0000-000000000003", projectId, "landing_gap", gapIds[2], "enrich", { suggested_fix: "Add pricing." }, { suggested_fix: landing_gaps[2].suggested_fix }, "Make the pricing fix demo-actionable.", metadata),
    review("81000000-0000-0000-0000-000000000004", projectId, "ad_group", adGroupIds[1], "approve", {}, { review_status: "approved" }, "Best first demo ad group.", metadata),
    review("81000000-0000-0000-0000-000000000005", projectId, "creative_variant", creativeIds[5], "edit", { description: "Show security proof." }, { description: creative_variants[5].description }, "Added Gmail permission context.", metadata),
    review("81000000-0000-0000-0000-000000000006", projectId, "creative_variant", creativeIds[2], "reject", { status: "draft" }, { status: "rejected", reason: "too generic" }, "Generic value proposition underperformed against constraint-aware copy.", metadata)
  ];

  return {
    project: {
      id: projectId,
      name: "AtlasDesk",
      brand_url: "https://demo.motive.local/atlasdesk",
      status: options.projectStatus ?? "deployed",
      extra_context: "Shared inbox CRM for founder-led B2B teams. Turn messy founder inboxes into CRM-ready follow-up without leaving Gmail.",
      demo_slug: "motive-demo",
      metadata: {
        ...metadata,
        category: "shared inbox CRM for founder-led B2B teams",
        icp: "founders, revenue leads, and customer-success managers at 10-75 person software companies"
      }
    },
    sources,
    extraction_runs,
    brand_features,
    conversations,
    landing_gaps,
    campaigns,
    product_feeds,
    product_feed_items,
    ad_groups,
    creative_variants,
    human_reviews,
    deployments,
    performance_snapshots
  };
}

export async function runDemoReset(
  input: DemoResetInput,
  deps: {
    repository: DemoResetRepository;
    sendReplayRequested: (event: DemoReplayRequestedEvent) => Promise<void>;
    now?: () => Date;
    randomUUID?: () => string;
  }
): Promise<DemoResetResult> {
  const demoRunId = deps.randomUUID?.() ?? crypto.randomUUID();
  const now = deps.now?.() ?? new Date();
  const dataset = buildSeededDemoDataset({
    demoProjectId: input.demoProjectId,
    seedVersion: input.seedVersion,
    demoRunId,
    now
  });

  await deps.repository.replaceWithCompleteDataset(dataset);

  if (!input.replay) {
    return {
      project_id: input.demoProjectId,
      demo_run_id: demoRunId,
      seed_version: input.seedVersion,
      replay_started: false
    };
  }

  try {
    await deps.sendReplayRequested({
      projectId: input.demoProjectId,
      demoRunId,
      seedVersion: input.seedVersion,
      requestedBy: input.requestedBy,
      mode: "seeded_fixture"
    });
    return {
      project_id: input.demoProjectId,
      demo_run_id: demoRunId,
      seed_version: input.seedVersion,
      replay_started: true
    };
  } catch (caught) {
    return {
      project_id: input.demoProjectId,
      demo_run_id: demoRunId,
      seed_version: input.seedVersion,
      replay_started: false,
      replay_error: caught instanceof Error ? caught.message : "Replay dispatch failed"
    };
  }
}

export async function runSeededDemoReplay(
  input: DemoReplayInput,
  deps: {
    repository: DemoReplayRepository;
    sleep: (delayMs: number) => Promise<void>;
    now?: () => Date;
  }
): Promise<DemoReplayResult> {
  const now = deps.now?.() ?? new Date();
  const completeDataset = buildSeededDemoDataset({
    demoProjectId: input.projectId,
    seedVersion: input.seedVersion,
    demoRunId: input.demoRunId,
    now
  });
  const replayDataset = {
    ...completeDataset,
    project: {
      ...completeDataset.project,
      status: "extracting" as const
    }
  };

  await deps.repository.prepareReplay(replayDataset);

  for (const phase of DEMO_REPLAY_PHASES) {
    const phaseRun = completeDataset.extraction_runs.find((run) => run.phase === phase);
    if (!phaseRun) throw new Error(`Missing seeded run for phase ${phase}`);
    await deps.repository.startPhase(phase, {
      ...phaseRun,
      status: "running",
      output_json: {},
      completed_at: null,
      duration_ms: null
    });
    await deps.sleep(delayForPhase(phase));
    await deps.repository.completePhase(phase, completeDataset);
  }

  return {
    status: "succeeded",
    project_id: input.projectId,
    demo_run_id: input.demoRunId,
    seed_version: input.seedVersion,
    phases: [...DEMO_REPLAY_PHASES]
  };
}

export function delayForPhase(phase: DemoReplayPhase): number {
  switch (phase) {
    case "source_recap":
      return 600;
    case "feature_map":
    case "conversation_map":
    case "ad_groups":
      return 900;
    case "intent_classification":
    case "creative_text":
    case "monitoring_synthesis":
      return 700;
    case "landing_gaps":
      return 800;
  }
}

function buildRun(input: {
  id: string;
  phase: DemoReplayPhase;
  projectId: string;
  seedVersion: string;
  demoRunId: string;
  startedAt: string;
  completedAt: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
}): DemoExtractionRunRow {
  return {
    id: input.id,
    project_id: input.projectId,
    phase: input.phase,
    status: "succeeded",
    model: "seeded-demo",
    provider: "seeded_fixture",
    prompt_version: `${input.phase}.${input.seedVersion}`,
    input_json: input.input_json,
    output_json: input.output_json,
    error: null,
    started_at: input.startedAt,
    completed_at: input.completedAt,
    duration_ms: 650,
    attempt: 0,
    metadata: input.metadata
  };
}

function outputForPhase(phase: DemoReplayPhase): Record<string, unknown> {
  switch (phase) {
    case "source_recap":
      return {
        brand_name: "AtlasDesk",
        category: "B2B SaaS",
        homepage_url: "https://demo.motive.local/atlasdesk",
        one_sentence_offer: "Turn messy founder inboxes into CRM-ready follow-up without leaving Gmail.",
        positioning_summary: "AtlasDesk is a Gmail-native CRM workflow for founder-led B2B teams with urgent setup, migration, pricing, and trust constraints.",
        source_quality: {
          coverage: "rich",
          missing_context: ["public pricing table", "SOC 2 report"]
        }
      };
    case "feature_map":
      return { feature_count: 10 };
    case "conversation_map":
      return { conversation_count: 8 };
    case "intent_classification":
      return { labels: ["workflow_pain", "migration_risk", "proof_request", "budget_validation", "trust_check"] };
    case "landing_gaps":
      return { gap_count: 5 };
    case "ad_groups":
      return { campaign_count: 1, ad_group_count: 4 };
    case "creative_text":
      return { creative_variant_count: 6 };
    case "monitoring_synthesis":
      return { snapshot_count: 6, basis: "seeded simulated demo" };
  }
}

const homepageSourceText = [
  "AtlasDesk turns founder Gmail inboxes into CRM-ready follow-up.",
  "Launch in Gmail before Friday, keep every buyer thread tied to a next step, and avoid a heavy CRM rollout.",
  "Designed for 10-75 person B2B software companies where founders, revenue leads, and customer success still sell from shared inboxes."
].join("\n");

const founderSourceText = [
  "Founder note: the ICP is founder-led revenue teams moving from spreadsheets and inbox labels.",
  "Repeated objections include importing existing inbox labels, preserving HubSpot sync, pricing under 500 USD/month, and a clear setup path.",
  "The strongest proof angle is a launch checklist that shows the workflow can be live before Friday."
].join("\n");

const quoteSourceText = [
  "Customer quote: We are Gmail-only and cannot ask reps to live in another CRM tab.",
  "Customer quote: Prove setup works before Friday and show that labels survive migration.",
  "Customer quote: Operations needs SOC 2 proof, Gmail permission details, and pricing clarity before approval."
].join("\n");

function feature(
  id: string,
  type: DemoBrandFeatureRow["type"],
  title: string,
  description: string,
  evidence: string,
  sourceRef: string,
  reviewStatus: DemoBrandFeatureRow["review_status"],
  metadata: Record<string, unknown>
): DemoBrandFeatureRow {
  return {
    id,
    project_id: String(metadata.demo_project_id ?? DEFAULT_DEMO_PROJECT_ID),
    extraction_run_id: "20000000-0000-0000-0000-000000000002",
    type,
    title,
    description,
    evidence,
    source_refs: [sourceRef],
    confidence: reviewStatus === "pending" ? 0.72 : 0.9,
    review_status: reviewStatus,
    metadata: { ...metadata, temp_id: title.toLowerCase().replace(/\W+/g, "_") }
  };
}

function conversation(
  id: string,
  runId: string,
  text: string,
  stage: string,
  intentType: string,
  buyerRole: string,
  constraints: DemoConversationRow["constraints_json"]["constraints"],
  sourceRef: string,
  reviewStatus: DemoConversationRow["review_status"],
  tempId: string,
  metadata: Record<string, unknown>
): DemoConversationRow {
  return {
    id,
    project_id: String(metadata.demo_project_id ?? DEFAULT_DEMO_PROJECT_ID),
    extraction_run_id: runId,
    text,
    stage,
    intent_type: intentType,
    buyer_role: buyerRole,
    constraints_json: { constraints },
    source_refs: [sourceRef],
    confidence: reviewStatus === "pending" ? 0.76 : 0.91,
    review_status: reviewStatus,
    metadata: { ...metadata, temp_id: tempId }
  };
}

function gap(
  id: string,
  conversationId: string,
  gapType: string,
  description: string,
  suggestedFix: string,
  severity: number,
  sourceRef: string,
  reviewStatus: DemoLandingGapRow["review_status"],
  tempId: string,
  metadata: Record<string, unknown>
): DemoLandingGapRow {
  return {
    id,
    project_id: String(metadata.demo_project_id ?? DEFAULT_DEMO_PROJECT_ID),
    extraction_run_id: "20000000-0000-0000-0000-000000000005",
    conversation_id: conversationId,
    gap_type: gapType,
    description,
    suggested_fix: suggestedFix,
    severity,
    source_refs: [sourceRef],
    review_status: reviewStatus,
    metadata: { ...metadata, temp_id: tempId }
  };
}

function product(
  id: string,
  projectId: string,
  feedId: string,
  itemId: string,
  title: string,
  description: string,
  price: string,
  reviewStatus: DemoProductFeedItemRow["review_status"],
  metadata: Record<string, unknown>
): DemoProductFeedItemRow {
  return {
    id,
    project_id: projectId,
    product_feed_id: feedId,
    item_id: itemId,
    title,
    description,
    link: "https://demo.motive.local/atlasdesk/pricing",
    image_link: "https://demo.motive.local/assets/atlasdesk-plan.jpg",
    availability: "in_stock",
    price,
    brand: "AtlasDesk",
    google_product_category: "Software > Business Software",
    product_type: "CRM software",
    condition: "new",
    raw_json: { sku: itemId },
    review_status: reviewStatus,
    metadata
  };
}

function adGroup(
  id: string,
  projectId: string,
  campaignId: string,
  runId: string,
  name: string,
  rationale: string,
  hints: string[],
  stage: string,
  intent: string,
  conversationIds: string[],
  featureIds: string[],
  gapIds: string[],
  productIds: string[],
  metadata: Record<string, unknown>
): DemoAdGroupRow {
  return {
    id,
    project_id: projectId,
    campaign_id: campaignId,
    extraction_run_id: runId,
    name,
    rationale,
    context_hints: hints,
    billing_event_type: "click",
    max_bid_micros: 3_000_000,
    target_stage: stage,
    target_intent: intent,
    conversation_ids: conversationIds,
    feature_ids: featureIds,
    landing_gap_ids: gapIds,
    product_feed_item_ids: productIds,
    status: "approved",
    review_status: "approved",
    metadata
  };
}

function creative(
  id: string,
  projectId: string,
  adGroupId: string,
  runId: string,
  title: string,
  description: string,
  angle: string,
  assetType: DemoCreativeVariantRow["asset_type"],
  assetPrompt: string | null,
  assetUrl: string | null,
  targetUrl: string,
  status: DemoCreativeVariantRow["status"],
  reviewStatus: DemoCreativeVariantRow["review_status"],
  metadata: Record<string, unknown>
): DemoCreativeVariantRow {
  return {
    id,
    project_id: projectId,
    ad_group_id: adGroupId,
    extraction_run_id: runId,
    title,
    description,
    creative_angle: angle,
    asset_type: assetType,
    asset_prompt: assetPrompt,
    asset_url: assetUrl,
    asset_generation_status: assetUrl ? "ready" : "skipped",
    asset_width: assetUrl ? 1024 : null,
    asset_height: assetUrl ? 1024 : null,
    asset_mime_type: assetUrl ? "image/jpeg" : null,
    target_url: targetUrl,
    provider: "seeded_fixture",
    provider_request_json: { provider_mode: "seeded_fixture", ad_group_id: adGroupId },
    provider_response_json: { title, description, creative_angle: angle },
    openai_validation_json: {
      exportable: Boolean(assetUrl),
      title_max_50: title.length <= 50,
      body_max_100: description.length <= 100,
      image_square: assetUrl ? true : null
    },
    status,
    review_status: reviewStatus,
    metadata
  };
}

function review(
  id: string,
  projectId: string,
  entityType: string,
  entityId: string,
  action: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  comment: string,
  metadata: Record<string, unknown>
): DemoHumanReviewRow {
  return {
    id,
    project_id: projectId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_json: before,
    after_json: after,
    comment,
    metadata
  };
}

function snapshot(
  id: string,
  projectId: string,
  deploymentId: string,
  adGroupId: string,
  creativeId: string,
  conversationId: string,
  periodStart: string,
  periodEnd: string,
  qualityScore: number,
  impressions: number,
  clicks: number,
  conversions: number,
  spend: number,
  insight: string,
  recommendedAction: string,
  drivers: string[],
  metadata: Record<string, unknown>
): DemoPerformanceSnapshotRow {
  return {
    id,
    project_id: projectId,
    deployment_id: deploymentId,
    ad_group_id: adGroupId,
    creative_variant_id: creativeId,
    conversation_id: conversationId,
    snapshot_kind: "simulated",
    period_start: periodStart,
    period_end: periodEnd,
    impressions,
    clicks,
    ctr: Number((clicks / impressions).toFixed(4)),
    conversions,
    cvr: Number((conversions / clicks).toFixed(4)),
    spend,
    quality_score: qualityScore,
    insight,
    recommended_action: recommendedAction,
    metric_basis_json: {
      drivers,
      simulated_for_hackathon: true
    },
    confidence: qualityScore >= 70 ? "high" : "medium",
    notes: "Seeded story KPI row for deterministic demo rehearsal.",
    provider_request_json: { phase: "monitoring_synthesis", provider_mode: "seeded_fixture" },
    provider_response_json: { quality_score: qualityScore, insight },
    metadata
  };
}

function buildDeploymentPayload(
  campaign: DemoCampaignRow,
  adGroups: DemoAdGroupRow[],
  creatives: DemoCreativeVariantRow[],
  deployedAt: string
) {
  const deployable = creatives.filter((creative) => creative.status === "approved" || creative.review_status === "edited");
  return {
    simulated_for_hackathon: true,
    provider_label: "simulated",
    deployed_at: deployedAt,
    campaign: {
      name: campaign.name,
      objective: campaign.objective,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget: {
        lifetime_spend_limit_micros: campaign.lifetime_spend_limit_micros
      },
      targeting: {
        locations: {
          countries: campaign.countries
        }
      },
      custom_instruction: campaign.custom_instruction
    },
    ad_groups: adGroups.map((group) => ({
      name: group.name,
      context_hints: group.context_hints,
      bidding_config: {
        billing_event_type: "click",
        max_bid_micros: group.max_bid_micros
      },
      motive_ad_group_id: group.id,
      rationale: group.rationale
    })),
    ads: deployable.map((creative) => ({
      ad_group_name: adGroups.find((group) => group.id === creative.ad_group_id)?.name ?? "Ad group",
      type: "chat_card",
      title: creative.title,
      body: creative.description,
      target_url: creative.target_url,
      image_url_for_bulk_upload: creative.asset_url ?? undefined,
      status: "paused",
      motive_creative_variant_id: creative.id,
      motive_ad_group_id: creative.ad_group_id,
      creative_angle: creative.creative_angle,
      asset_prompt: creative.asset_prompt
    }))
  };
}

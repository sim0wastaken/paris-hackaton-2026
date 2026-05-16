import { openAiAdsExportSchema, type AdGroup, type Campaign, type CreativeVariant, type Deployment, type PerformanceSnapshot } from "./types";
import type { ExtractionReviewData } from "./extraction";
import {
  buildPerformanceOutput,
  type PerformanceOutput,
  type PerformanceSnapshotInsert,
  type StructuredMonitoringProvider
} from "./performance";

export type DeployPackageInput = {
  project: ExtractionReviewData["project"];
  sources: ExtractionReviewData["sources"];
  campaign: Campaign | null;
  ad_groups: AdGroup[];
  creatives: CreativeVariant[];
  conversations: ExtractionReviewData["conversations"];
  brand_features: ExtractionReviewData["brand_features"];
  landing_gaps: ExtractionReviewData["landing_gaps"];
  product_feed_items: ExtractionReviewData["product_feed_items"];
  human_reviews: ExtractionReviewData["human_reviews"];
};

export type OpenAiCompatibilityIssue = {
  creative_variant_id?: string;
  ad_group_id?: string;
  code: string;
  message: string;
};

export type OpenAiDeployPayload = {
  simulated_for_hackathon: true;
  provider_label: "simulated";
  deployed_at: string;
  campaign: {
    name: string;
    objective: "Clicks" | "Views";
    start_date: string;
    end_date: string;
    budget: {
      lifetime_spend_limit_micros: number;
    };
    targeting: {
      locations: {
        countries: string[];
      };
    };
    custom_instruction?: string;
  };
  ad_groups: Array<{
    name: string;
    context_hints: string[];
    bidding_config: {
      billing_event_type: "click";
      max_bid_micros: number;
    };
    motive_ad_group_id: string;
    rationale: string;
  }>;
  ads: Array<{
    ad_group_name: string;
    type: "chat_card";
    title: string;
    body: string;
    target_url: string;
    file_id?: string;
    image_url_for_bulk_upload?: string;
    status: "paused";
    motive_creative_variant_id: string;
    motive_ad_group_id: string;
    creative_angle: string;
    asset_prompt: string | null;
  }>;
  product_feed_items: Array<{
    id: string;
    title: string;
    link: string | null;
    price: string | null;
    availability: string | null;
  }>;
  motive_context: {
    project_id: string;
    project_name: string;
    creative_variant_ids: string[];
    ad_group_ids: string[];
  };
  openai_compatibility: {
    compatible: boolean;
    issues: OpenAiCompatibilityIssue[];
  };
};

export type MonitoringData = ExtractionReviewData & {
  deployments: Deployment[];
  performance_snapshots: PerformanceSnapshot[];
};

export type FakeDeployRepository = {
  getReviewData(projectId: string): Promise<ExtractionReviewData | null>;
  createDeployment(input: {
    projectId: string;
    deployedAt: string;
    payload_json: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }): Promise<Deployment>;
  materializePerformanceSnapshots(rows: PerformanceSnapshotInsert[]): Promise<PerformanceSnapshot[]>;
  updateDeploymentAfterPerformance(
    deploymentId: string,
    patch: {
      payload_json: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }
  ): Promise<Deployment>;
  markPackageDeployed(input: {
    projectId: string;
    campaignIds: string[];
    adGroupIds: string[];
    creativeVariantIds: string[];
  }): Promise<void>;
};

export type RunFakeDeployInput = {
  projectId: string;
  requestId: string;
  creativeVariantIds?: string[];
  generatePerformance?: boolean;
  forceFallback?: boolean;
  now?: Date;
};

export type RunFakeDeployResult = {
  deployment_id: string;
  status: "fake_deployed";
  performance_snapshot_ids: string[];
  simulated: true;
  openai_compatible: boolean;
  deployment: Deployment;
  performance_snapshots: PerformanceSnapshot[];
  dashboard_summary: PerformanceOutput["dashboard_summary"] | null;
  source: PerformanceOutput["source"] | "not_requested";
};

export class FakeDeployError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "FakeDeployError";
  }
}

export function buildDeployPackageInput(
  data: ExtractionReviewData,
  options: {
    creativeVariantIds?: string[];
  } = {}
): DeployPackageInput {
  const requestedIds = new Set(options.creativeVariantIds ?? []);
  const knownCreativeIds = new Set(data.creative_variants.map((creative) => creative.id));
  for (const id of requestedIds) {
    if (!knownCreativeIds.has(id)) {
      throw new FakeDeployError("creative_not_found", `Creative variant does not belong to this project: ${id}`);
    }
  }

  const deployable = data.creative_variants.filter((creative) => {
    const selected = requestedIds.size === 0 || requestedIds.has(creative.id);
    return selected && isDeployableCreative(creative);
  });
  if (deployable.length === 0) {
    throw new FakeDeployError("no_approved_creatives", "Approve at least one creative before deploy.");
  }

  const adGroups = deployable.map((creative) => {
    const adGroup = data.ad_groups.find((group) => group.id === creative.ad_group_id);
    if (!adGroup) {
      throw new FakeDeployError("ad_group_not_found", `Creative ${creative.id} is missing its ad group.`);
    }
    return adGroup;
  });
  const uniqueAdGroups = uniqueById(adGroups);
  const campaign = selectCampaign(data.campaigns, uniqueAdGroups);

  return {
    project: data.project,
    sources: data.sources,
    campaign,
    ad_groups: uniqueAdGroups,
    creatives: deployable,
    conversations: data.conversations,
    brand_features: data.brand_features,
    landing_gaps: data.landing_gaps,
    product_feed_items: data.product_feed_items.filter((item) =>
      uniqueAdGroups.some((group) => group.product_feed_item_ids.includes(item.id))
    ),
    human_reviews: data.human_reviews
  };
}

export function buildOpenAiDeployPayload(
  input: DeployPackageInput,
  deployedAt: Date = new Date()
): OpenAiDeployPayload {
  const campaign = input.campaign ?? defaultCampaign(input, deployedAt);
  const campaignPayload = {
    name: campaign.name,
    objective: campaign.objective,
    start_date: campaign.start_date ?? formatDate(deployedAt),
    end_date: campaign.end_date ?? formatDate(addDays(deployedAt, 30)),
    budget: {
      lifetime_spend_limit_micros: campaign.lifetime_spend_limit_micros
    },
    targeting: {
      locations: {
        countries: campaign.countries.length > 0 ? campaign.countries : ["US"]
      }
    },
    ...(campaign.custom_instruction ? { custom_instruction: campaign.custom_instruction } : {})
  };
  const adGroupPayloads = input.ad_groups.map((group) => ({
    name: group.name,
    context_hints: group.context_hints.length > 0 ? group.context_hints : [group.name],
    bidding_config: {
      billing_event_type: "click" as const,
      max_bid_micros: group.max_bid_micros
    },
    motive_ad_group_id: group.id,
    rationale: group.rationale
  }));
  const ads = input.creatives.map((creative) => {
    const adGroup = input.ad_groups.find((group) => group.id === creative.ad_group_id);
    if (!adGroup) {
      throw new FakeDeployError("ad_group_not_found", `Creative ${creative.id} is missing its ad group.`);
    }
    return {
      ad_group_name: adGroup.name,
      type: "chat_card" as const,
      title: creative.title,
      body: creative.description,
      target_url: creative.target_url ?? input.project.brand_url,
      ...(creative.openai_file_id ? { file_id: creative.openai_file_id } : {}),
      ...(creative.asset_url ? { image_url_for_bulk_upload: creative.asset_url } : {}),
      status: "paused" as const,
      motive_creative_variant_id: creative.id,
      motive_ad_group_id: adGroup.id,
      creative_angle: creative.creative_angle,
      asset_prompt: creative.asset_prompt
    };
  });
  const issues = validateCompatibility(input, {
    campaign: campaignPayload,
    ad_groups: adGroupPayloads,
    ads
  });

  return {
    simulated_for_hackathon: true,
    provider_label: "simulated",
    deployed_at: deployedAt.toISOString(),
    campaign: campaignPayload,
    ad_groups: adGroupPayloads,
    ads,
    product_feed_items: input.product_feed_items.map((item) => ({
      id: item.id,
      title: item.title,
      link: item.link,
      price: item.price,
      availability: item.availability
    })),
    motive_context: {
      project_id: input.project.id,
      project_name: input.project.name,
      creative_variant_ids: input.creatives.map((creative) => creative.id),
      ad_group_ids: input.ad_groups.map((group) => group.id)
    },
    openai_compatibility: {
      compatible: issues.length === 0,
      issues
    }
  };
}

export async function runFakeDeploy(
  input: RunFakeDeployInput,
  deps: {
    repository: FakeDeployRepository;
    synthesisProvider: StructuredMonitoringProvider;
  }
): Promise<RunFakeDeployResult> {
  const reviewData = await deps.repository.getReviewData(input.projectId);
  if (!reviewData) {
    throw new FakeDeployError("project_not_found", `Project not found: ${input.projectId}`);
  }

  const deployInput = buildDeployPackageInput(reviewData, {
    creativeVariantIds: input.creativeVariantIds
  });
  const now = input.now ?? new Date();
  const payload = buildOpenAiDeployPayload(deployInput, now);
  const deployment = await deps.repository.createDeployment({
    projectId: input.projectId,
    deployedAt: now.toISOString(),
    payload_json: payload as unknown as Record<string, unknown>,
    metadata: {
      request_id: input.requestId,
      simulated: true,
      source: "spec_08",
      openai_compatible: payload.openai_compatibility.compatible
    }
  });

  let snapshots: PerformanceSnapshot[] = [];
  let performance: PerformanceOutput | null = null;
  if (input.generatePerformance !== false) {
    performance = await buildPerformanceOutput(
      deployInput,
      {
        deploymentId: deployment.id,
        requestId: input.requestId,
        forceFallback: input.forceFallback,
        now
      },
      deps.synthesisProvider
    );
    snapshots = await deps.repository.materializePerformanceSnapshots(performance.snapshots);
    await deps.repository.updateDeploymentAfterPerformance(deployment.id, {
      payload_json: {
        monitoring_summary: performance.dashboard_summary
      },
      metadata: {
        monitoring_source: performance.source,
        monitoring_model: performance.model,
        performance_snapshot_count: snapshots.length
      }
    });
  }

  await deps.repository.markPackageDeployed({
    projectId: input.projectId,
    campaignIds: deployInput.campaign ? [deployInput.campaign.id] : [],
    adGroupIds: deployInput.ad_groups.map((group) => group.id),
    creativeVariantIds: deployInput.creatives.map((creative) => creative.id)
  });

  return {
    deployment_id: deployment.id,
    status: "fake_deployed",
    performance_snapshot_ids: snapshots.map((snapshot) => snapshot.id),
    simulated: true,
    openai_compatible: payload.openai_compatibility.compatible,
    deployment,
    performance_snapshots: snapshots,
    dashboard_summary: performance?.dashboard_summary ?? null,
    source: performance?.source ?? "not_requested"
  };
}

function isDeployableCreative(creative: CreativeVariant): boolean {
  return creative.status === "approved" && ["approved", "edited"].includes(creative.review_status);
}

function selectCampaign(campaigns: Campaign[], adGroups: AdGroup[]): Campaign | null {
  const campaignIds = new Set(adGroups.map((group) => group.campaign_id).filter(Boolean));
  return campaigns.find((campaign) => campaignIds.has(campaign.id) && campaign.review_status !== "rejected")
    ?? campaigns.find((campaign) => campaign.review_status === "approved")
    ?? campaigns[0]
    ?? null;
}

function defaultCampaign(input: DeployPackageInput, deployedAt: Date): Campaign {
  const now = deployedAt.toISOString();
  return {
    id: "00000000-0000-0000-0000-000000000000",
    project_id: input.project.id,
    extraction_run_id: null,
    name: `${input.project.name} - simulated campaign`,
    objective: "Clicks",
    status: "approved",
    start_date: formatDate(deployedAt),
    end_date: formatDate(addDays(deployedAt, 30)),
    lifetime_spend_limit_micros: 5_000_000,
    countries: ["US"],
    custom_instruction: "Bias toward approved buyer conversations and review-backed creatives.",
    rationale: "Default fake deploy campaign generated by Spec 08.",
    review_status: "approved",
    metadata: { generated_default: true },
    created_at: now,
    updated_at: now
  };
}

function validateCompatibility(
  input: DeployPackageInput,
  payload: {
    campaign: OpenAiDeployPayload["campaign"];
    ad_groups: OpenAiDeployPayload["ad_groups"];
    ads: OpenAiDeployPayload["ads"];
  }
): OpenAiCompatibilityIssue[] {
  const issues: OpenAiCompatibilityIssue[] = [];
  const exportCheck = openAiAdsExportSchema.safeParse(payload);
  if (!exportCheck.success) {
    for (const issue of exportCheck.error.issues) {
      issues.push({
        code: "openai_export_shape_invalid",
        message: `${issue.path.join(".")}: ${issue.message}`
      });
    }
  }

  for (const group of input.ad_groups) {
    if (group.context_hints.length === 0) {
      issues.push({
        ad_group_id: group.id,
        code: "missing_context_hints",
        message: "OpenAI ad groups need at least one context hint."
      });
    }
  }

  for (const creative of input.creatives) {
    if (creative.asset_type === "video") {
      issues.push({
        creative_variant_id: creative.id,
        code: "video_asset_not_exportable",
        message: "OpenAI Ads export is image-only for this demo contract."
      });
    }
    if (!creative.asset_url) {
      issues.push({
        creative_variant_id: creative.id,
        code: "missing_image_asset",
        message: "Prompt-only creatives can fake deploy, but they are not OpenAI-compatible image ads."
      });
    }
    if (creative.asset_url && creative.asset_mime_type && !["image/jpeg", "image/png"].includes(creative.asset_mime_type)) {
      issues.push({
        creative_variant_id: creative.id,
        code: "unsupported_image_mime",
        message: "OpenAI-compatible image assets must be PNG or JPG."
      });
    }
    if (creative.asset_width && creative.asset_height && creative.asset_width !== creative.asset_height) {
      issues.push({
        creative_variant_id: creative.id,
        code: "non_square_image",
        message: "OpenAI-compatible image assets must be square."
      });
    }
    if ((creative.asset_width && creative.asset_width > 1200) || (creative.asset_height && creative.asset_height > 1200)) {
      issues.push({
        creative_variant_id: creative.id,
        code: "image_too_large",
        message: "OpenAI-compatible image assets must be at most 1200x1200."
      });
    }
    if (!isValidUrl(creative.target_url ?? input.project.brand_url)) {
      issues.push({
        creative_variant_id: creative.id,
        code: "invalid_target_url",
        message: "OpenAI-compatible ads need a valid target URL."
      });
    }
  }

  return issues;
}

function uniqueById<Row extends { id: string }>(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

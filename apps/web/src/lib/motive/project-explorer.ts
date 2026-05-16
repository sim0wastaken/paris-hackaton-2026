import type { MonitoringData } from "./deployments";
import type { ExtractionRunRecord } from "./extraction";
import type { ProjectRecord, SourceRecord } from "./projects";
import type {
  AdGroup,
  CreativeVariant,
  Deployment,
  HumanReview,
  PerformanceSnapshot
} from "./types";

export type ProjectExplorerCounts = {
  sources: number;
  processed_sources: number;
  extraction_runs: number;
  approved_review_rows: number;
  ad_groups: number;
  creatives: number;
  approved_creatives: number;
  deployments: number;
  performance_snapshots: number;
  review_actions: number;
};

export type ProjectExplorerSummary = {
  id: string;
  name: string;
  brand_url: string;
  status: ProjectRecord["status"];
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  latest_activity_at: string;
  display_stage: string;
  next_href: string;
  counts: ProjectExplorerCounts;
};

export type ProjectGenerationPreview = MonitoringData;

export type ProjectExplorerProject = ProjectRecord & {
  demo_slug?: string | null;
  owner_user_id?: string | null;
};

type TimestampedRow = {
  created_at?: string | null;
  updated_at?: string | null;
};

type ReviewableRow = TimestampedRow & {
  review_status?: string | null;
};

type StatusRow = TimestampedRow & {
  status?: string | null;
};

export type ProjectExplorerInput = {
  project: ProjectExplorerProject;
  sources: Array<Partial<Pick<SourceRecord, "status">> & TimestampedRow>;
  extraction_runs: Array<Partial<Pick<ExtractionRunRecord, "status">> & TimestampedRow>;
  brand_features: ReviewableRow[];
  conversations: ReviewableRow[];
  landing_gaps: ReviewableRow[];
  ad_groups: Array<Partial<Pick<AdGroup, "review_status">> & StatusRow>;
  creative_variants: Array<Partial<Pick<CreativeVariant, "review_status">> & StatusRow>;
  deployments: Array<Partial<Pick<Deployment, "status">> & TimestampedRow>;
  performance_snapshots: PerformanceSnapshot[] | TimestampedRow[];
  human_reviews: HumanReview[] | TimestampedRow[];
};

export function buildProjectExplorerSummary(input: ProjectExplorerInput): ProjectExplorerSummary {
  const counts = buildCounts(input);
  const latestActivityAt = latestTimestamp([
    input.project,
    ...input.sources,
    ...input.extraction_runs,
    ...input.brand_features,
    ...input.conversations,
    ...input.landing_gaps,
    ...input.ad_groups,
    ...input.creative_variants,
    ...input.deployments,
    ...input.performance_snapshots,
    ...input.human_reviews
  ]);

  return {
    id: input.project.id,
    name: input.project.name,
    brand_url: input.project.brand_url,
    status: input.project.status,
    is_demo: isDemoProject(input.project),
    created_at: input.project.created_at,
    updated_at: input.project.updated_at,
    latest_activity_at: latestActivityAt,
    display_stage: displayStage(input.project.status, counts),
    next_href: nextHref(input.project.id, input.project.status, counts),
    counts
  };
}

export function sortProjectExplorerSummaries(
  summaries: ProjectExplorerSummary[]
): ProjectExplorerSummary[] {
  return [...summaries].sort((a, b) => b.latest_activity_at.localeCompare(a.latest_activity_at));
}

function buildCounts(input: ProjectExplorerInput): ProjectExplorerCounts {
  return {
    sources: input.sources.length,
    processed_sources: input.sources.filter((source) => source.status === "processed").length,
    extraction_runs: input.extraction_runs.length,
    approved_review_rows: [
      ...input.brand_features,
      ...input.conversations,
      ...input.landing_gaps,
      ...input.ad_groups
    ].filter((row) => row.review_status === "approved" || row.review_status === "edited").length,
    ad_groups: input.ad_groups.length,
    creatives: input.creative_variants.length,
    approved_creatives: input.creative_variants.filter(
      (row) => row.review_status === "approved" || row.review_status === "edited"
    ).length,
    deployments: input.deployments.length,
    performance_snapshots: input.performance_snapshots.length,
    review_actions: input.human_reviews.length
  };
}

function nextHref(
  projectId: string,
  status: ProjectRecord["status"],
  counts: ProjectExplorerCounts
): string {
  if (status === "deployed" || counts.performance_snapshots > 0 || counts.deployments > 0) {
    return `/projects/${projectId}/monitoring`;
  }
  if (status === "creative_ready" || counts.creatives > 0) {
    return `/projects/${projectId}/creatives`;
  }
  if (status === "review" || status === "extracting" || counts.extraction_runs > 0) {
    return `/projects/${projectId}/review`;
  }
  return `/projects/${projectId}`;
}

function displayStage(status: ProjectRecord["status"], counts: ProjectExplorerCounts): string {
  if (status === "failed") return "Failed";
  if (status === "deployed" || counts.performance_snapshots > 0) return "Monitoring live";
  if (counts.deployments > 0) return "Deployed";
  if (status === "creative_ready" || counts.creatives > 0) return "Creatives ready";
  if (status === "review" || counts.approved_review_rows > 0) return "Review ready";
  if (status === "extracting" || counts.extraction_runs > 0) return "Extraction running";
  return "Draft";
}

function isDemoProject(project: ProjectExplorerProject): boolean {
  return Boolean(
    project.demo_slug
      || project.metadata.is_seeded_demo === true
      || project.metadata.demo === true
      || project.metadata.demo_seed_version
  );
}

function latestTimestamp(rows: TimestampedRow[]): string {
  const timestamps = rows.flatMap((row) => [row.updated_at, row.created_at]).filter(isString);
  return timestamps.sort((a, b) => b.localeCompare(a))[0] ?? new Date(0).toISOString();
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import type { ProjectGenerationPreview, ProjectExplorerInput, ProjectExplorerSummary } from "./project-explorer";
import { buildProjectExplorerSummary, sortProjectExplorerSummaries } from "./project-explorer";
import { createSupabaseDeploymentRepository } from "./supabase-deployments";

type SupabaseError = {
  code?: string;
  message?: string;
};

type SupabaseResult = {
  data: unknown;
  error: SupabaseError | null;
};

type SupabaseQuery = PromiseLike<SupabaseResult> & {
  eq(column: string, value: string | number): SupabaseQuery;
  in(column: string, values: string[]): SupabaseQuery;
  is(column: string, value: null): SupabaseQuery;
  limit(count: number): SupabaseQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery;
  select(columns?: string): SupabaseQuery;
};

type SupabaseAny = {
  from: (table: string) => SupabaseQuery;
};

const PROJECT_SCAN_LIMIT = 200;

export function createSupabaseProjectExplorerRepository() {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async listProjectSummaries(limit = 30): Promise<ProjectExplorerSummary[]> {
      const cappedLimit = Math.min(Math.max(limit, 1), 100);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("owner_user_id", null)
        .order("updated_at", { ascending: false })
        .limit(Math.max(cappedLimit, PROJECT_SCAN_LIMIT));

      if (error) throw error;

      const projects = (data ?? []) as ProjectExplorerInput["project"][];
      if (projects.length === 0) return [];

      const projectIds = projects.map((project) => project.id);
      const [
        sources,
        extractionRuns,
        brandFeatures,
        conversations,
        landingGaps,
        adGroups,
        creativeVariants,
        deployments,
        performanceSnapshots,
        humanReviews
      ] = await Promise.all([
        fetchProjectRows(supabase, "sources", projectIds),
        fetchProjectRows(supabase, "extraction_runs", projectIds),
        fetchProjectRows(supabase, "brand_features", projectIds),
        fetchProjectRows(supabase, "conversations", projectIds),
        fetchProjectRows(supabase, "landing_gaps", projectIds),
        fetchProjectRows(supabase, "ad_groups", projectIds),
        fetchProjectRows(supabase, "creative_variants", projectIds),
        fetchProjectRows(supabase, "deployments", projectIds),
        fetchProjectRows(supabase, "performance_snapshots", projectIds),
        fetchProjectRows(supabase, "human_reviews", projectIds)
      ]);

      return sortProjectExplorerSummaries(
        projects.map((project) =>
          buildProjectExplorerSummary({
            project,
            sources: rowsForProject(sources, project.id),
            extraction_runs: rowsForProject(extractionRuns, project.id),
            brand_features: rowsForProject(brandFeatures, project.id),
            conversations: rowsForProject(conversations, project.id),
            landing_gaps: rowsForProject(landingGaps, project.id),
            ad_groups: rowsForProject(adGroups, project.id),
            creative_variants: rowsForProject(creativeVariants, project.id),
            deployments: rowsForProject(deployments, project.id),
            performance_snapshots: rowsForProject(performanceSnapshots, project.id),
            human_reviews: rowsForProject(humanReviews, project.id)
          } as ProjectExplorerInput)
        )
      ).slice(0, cappedLimit);
    },
    async getProjectGeneration(projectId: string): Promise<ProjectGenerationPreview | null> {
      return createSupabaseDeploymentRepository().getMonitoringData(projectId);
    }
  };
}

async function fetchProjectRows(
  supabase: SupabaseAny,
  table: string,
  projectIds: string[]
): Promise<Array<Record<string, unknown>>> {
  if (projectIds.length === 0) return [];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .in("project_id", projectIds);
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

function rowsForProject<Row extends Record<string, unknown>>(rows: Row[], projectId: string): Row[] {
  return rows.filter((row) => row.project_id === projectId);
}

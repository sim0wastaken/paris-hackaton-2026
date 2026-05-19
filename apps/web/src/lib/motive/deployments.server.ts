import "server-only";

import type { FakeDeployRepository, MonitoringData } from "./deployments";
import type { Deployment, PerformanceSnapshot } from "./types";
import { getExtractionReviewData } from "./extraction.server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type SupabaseAny = {
  from: (table: string) => SupabaseQuery;
};

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
  insert(value: unknown): SupabaseQuery;
  limit(count: number): SupabaseQuery;
  maybeSingle(): Promise<SupabaseResult>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQuery;
  select(columns?: string): SupabaseQuery;
  single(): Promise<SupabaseResult>;
  update(value: unknown): SupabaseQuery;
};

export function createSupabaseDeploymentRepository(): FakeDeployRepository & {
  getMonitoringData(projectId: string): Promise<MonitoringData | null>;
} {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async getReviewData(projectId) {
      return getExtractionReviewData(supabase, projectId);
    },
    async getMonitoringData(projectId) {
      const reviewData = await getExtractionReviewData(supabase, projectId);
      if (!reviewData) return null;

      const [deployments, snapshots] = await Promise.all([
        supabase
          .from("deployments")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("performance_snapshots")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
      ]);
      if (deployments.error) throw deployments.error;
      if (snapshots.error) throw snapshots.error;

      return {
        ...reviewData,
        deployments: (deployments.data ?? []) as Deployment[],
        performance_snapshots: (snapshots.data ?? []) as PerformanceSnapshot[]
      };
    },
    async createDeployment(input) {
      const { data, error } = await supabase
        .from("deployments")
        .insert({
          project_id: input.projectId,
          status: "fake_deployed",
          deployed_at: input.deployedAt,
          payload_json: input.payload_json,
          metadata: input.metadata
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Deployment;
    },
    async materializePerformanceSnapshots(rows) {
      if (rows.length === 0) return [];
      const { data, error } = await supabase
        .from("performance_snapshots")
        .insert(rows)
        .select("*");
      if (error) throw error;
      return (data ?? []) as PerformanceSnapshot[];
    },
    async updateDeploymentAfterPerformance(deploymentId, patch) {
      const current = await getDeploymentById(supabase, deploymentId);
      const { data, error } = await supabase
        .from("deployments")
        .update({
          payload_json: {
            ...asRecord(current.payload_json),
            ...patch.payload_json
          },
          metadata: {
            ...asRecord(current.metadata),
            ...patch.metadata
          }
        })
        .eq("id", deploymentId)
        .select("*")
        .single();
      if (error) throw error;
      return data as Deployment;
    },
    async markPackageDeployed(input) {
      const updates: PromiseLike<SupabaseResult>[] = [
        supabase.from("projects").update({ status: "deployed" }).eq("id", input.projectId)
      ];
      if (input.campaignIds.length > 0) {
        updates.push(supabase.from("campaigns").update({ status: "deployed" }).in("id", input.campaignIds));
      }
      if (input.adGroupIds.length > 0) {
        updates.push(supabase.from("ad_groups").update({ status: "deployed" }).in("id", input.adGroupIds));
      }
      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    }
  };
}

async function getDeploymentById(supabase: SupabaseAny, deploymentId: string): Promise<Deployment> {
  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("id", deploymentId)
    .single();
  if (error) throw error;
  return data as Deployment;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

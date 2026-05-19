import { subscribeToProjectTables, type RealtimeRow } from "./realtime.client";

export type MonitoringTable =
  | "deployments"
  | "performance_snapshots"
  | "creative_variants"
  | "ad_groups"
  | "campaigns"
  | "human_reviews";

const MONITORING_TABLES = [
  "deployments",
  "performance_snapshots",
  "creative_variants",
  "ad_groups",
  "campaigns",
  "human_reviews"
] as const satisfies readonly MonitoringTable[];

export function subscribeToMonitoring(
  projectId: string,
  onRow: (table: MonitoringTable, row: RealtimeRow) => void,
  onStatus?: (status: "live" | "polling") => void
): () => void {
  return subscribeToProjectTables<MonitoringTable>({
    channel: `motive-monitoring-${projectId}`,
    projectId,
    tables: MONITORING_TABLES,
    onRow,
    onStatus
  });
}

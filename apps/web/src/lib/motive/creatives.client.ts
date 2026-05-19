import { subscribeToProjectTables, type RealtimeRow } from "./realtime.client";

export type CreativeTable = "extraction_runs" | "ad_groups" | "creative_variants" | "human_reviews";

const CREATIVE_TABLES = [
  "extraction_runs",
  "ad_groups",
  "creative_variants",
  "human_reviews"
] as const satisfies readonly CreativeTable[];

export function subscribeToCreatives(
  projectId: string,
  onRow: (table: CreativeTable, row: RealtimeRow) => void,
  onStatus?: (status: "live" | "polling") => void
): () => void {
  return subscribeToProjectTables<CreativeTable>({
    channel: `motive-creatives-${projectId}`,
    projectId,
    tables: CREATIVE_TABLES,
    onRow,
    onStatus
  });
}

import { subscribeToProjectTables, type RealtimeRow } from "./realtime.client";

export type ReviewTable =
  | "extraction_runs"
  | "brand_features"
  | "conversations"
  | "landing_gaps"
  | "campaigns"
  | "ad_groups"
  | "creative_variants"
  | "human_reviews";

const REVIEW_TABLES = [
  "extraction_runs",
  "brand_features",
  "conversations",
  "landing_gaps",
  "campaigns",
  "ad_groups",
  "creative_variants",
  "human_reviews"
] as const satisfies readonly ReviewTable[];

export function subscribeToReview(
  projectId: string,
  onRow: (table: ReviewTable, row: RealtimeRow) => void,
  onStatus?: (status: "live" | "polling") => void
): () => void {
  return subscribeToProjectTables<ReviewTable>({
    channel: `motive-review-${projectId}`,
    projectId,
    tables: REVIEW_TABLES,
    onRow,
    onStatus
  });
}

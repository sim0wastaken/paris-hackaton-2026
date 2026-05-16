import type { ReviewStatus } from "./types";

export function isAcceptedReviewStatus(status: ReviewStatus): boolean {
  return status === "approved" || status === "edited" || status === "enriched";
}

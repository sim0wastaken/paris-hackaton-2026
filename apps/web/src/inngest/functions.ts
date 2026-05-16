import "server-only";
import type { InngestFunction } from "inngest";

// Inngest functions are registered in their owning specs:
//   - Spec 03: source.ingest.requested
//   - Spec 04: extraction.requested
//   - Spec 07: creatives.requested
//   - Spec 08: deployment.fake_requested, monitoring.requested
// This array is the single registration list consumed by /api/inngest.
export const functions: InngestFunction.Any[] = [];

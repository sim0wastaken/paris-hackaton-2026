import "server-only";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "motive",
  name: "Motive",
  // In local dev the SDK talks to the Inngest Dev Server (`npx inngest-cli dev`)
  // instead of cloud, so we don't need INNGEST_SIGNING_KEY locally.
  isDev: process.env.NODE_ENV !== "production",
});

export type InngestEvents = {
  "motive/project.created": {
    data: { project_id: string };
  };
  "motive/source.ingest.requested": {
    data: { project_id: string; source_id: string };
  };
  "motive/extraction.requested": {
    data: { project_id: string; source_ids: string[]; demo_mode?: boolean };
  };
  "motive/creatives.requested": {
    data: { project_id: string; ad_group_ids: string[]; variant_count?: number; generate_assets?: boolean; regenerate?: boolean };
  };
  "motive/deployment.fake_requested": {
    data: { project_id: string; creative_variant_ids: string[] };
  };
  "motive/monitoring.requested": {
    data: { project_id: string; deployment_id: string };
  };
};

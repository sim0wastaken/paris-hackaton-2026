export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReviewStatus = "pending" | "approved" | "edited" | "rejected" | "enriched";

export type Project = {
  id: string;
  name: string;
  status: "draft" | "extracting" | "review" | "creative_ready" | "deployed" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type Source = {
  id: string;
  projectId: string;
  type: "url" | "pdf" | "markdown" | "text" | "screenshot" | "product_feed";
  status: "pending" | "processing" | "processed" | "failed" | "skipped" | "needs_manual_text";
};

export type ExtractionRun = {
  id: string;
  projectId: string;
  phase: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  inputJson: Json;
  outputJson: Json;
};

export type ReviewableEntity = {
  id: string;
  projectId: string;
  reviewStatus: ReviewStatus;
};

export type AdGroup = ReviewableEntity & {
  name: string;
  contextHints: string[];
};

export type CreativeVariant = ReviewableEntity & {
  adGroupId: string;
  title: string;
  description: string;
};

export type Deployment = {
  id: string;
  projectId: string;
  status: "fake_deployed" | "failed";
};

export type PerformanceSnapshot = {
  id: string;
  projectId: string;
  qualityScore: number;
  insight: string;
  recommendedAction: string;
};

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

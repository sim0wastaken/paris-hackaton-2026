import "server-only";

import type {
  DemoReplayPhase,
  DemoReplayRepository,
  DemoResetRepository,
  SeededDemoDataset
} from "./demo";
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
  delete(): SupabaseQuery;
  eq(column: string, value: string | number): SupabaseQuery;
  insert(value: unknown): SupabaseQuery;
  select(columns?: string): SupabaseQuery;
  update(value: unknown): SupabaseQuery;
};

export type SupabaseDemoRepository = DemoResetRepository & DemoReplayRepository;

export function createSupabaseDemoRepository(): SupabaseDemoRepository {
  const supabase = createSupabaseServiceRoleClient() as unknown as SupabaseAny;

  return {
    async replaceWithCompleteDataset(dataset) {
      await deleteDemoProject(supabase, dataset.project.id);
      await insertProjectAndSources(supabase, dataset);
      await insertRows(supabase, "extraction_runs", dataset.extraction_runs);
      await insertRows(supabase, "brand_features", dataset.brand_features);
      await insertRows(supabase, "conversations", dataset.conversations);
      await insertRows(supabase, "landing_gaps", dataset.landing_gaps);
      await insertRows(supabase, "campaigns", dataset.campaigns);
      await insertRows(supabase, "product_feeds", dataset.product_feeds);
      await insertRows(supabase, "product_feed_items", dataset.product_feed_items);
      await insertRows(supabase, "ad_groups", dataset.ad_groups);
      await insertRows(supabase, "creative_variants", dataset.creative_variants);
      await insertRows(supabase, "human_reviews", dataset.human_reviews);
      await insertRows(supabase, "deployments", dataset.deployments);
      await insertRows(supabase, "performance_snapshots", dataset.performance_snapshots);
    },
    async prepareReplay(dataset) {
      await deleteDemoProject(supabase, dataset.project.id);
      await insertProjectAndSources(supabase, dataset);
    },
    async startPhase(_phase, run) {
      await insertRows(supabase, "extraction_runs", [run]);
    },
    async completePhase(phase, dataset) {
      const run = runForPhase(dataset, phase);
      await updateRunSucceeded(supabase, run);

      switch (phase) {
        case "source_recap":
          return;
        case "feature_map":
          await insertRows(supabase, "brand_features", dataset.brand_features);
          return;
        case "conversation_map":
          await insertRows(
            supabase,
            "conversations",
            dataset.conversations.map((row) => ({
              ...row,
              extraction_run_id: runForPhase(dataset, "conversation_map").id
            }))
          );
          return;
        case "intent_classification":
          await updateConversationsRun(supabase, dataset.project.id, run.id);
          return;
        case "landing_gaps":
          await insertRows(supabase, "landing_gaps", dataset.landing_gaps);
          return;
        case "ad_groups":
          await insertRows(supabase, "campaigns", dataset.campaigns);
          await insertRows(supabase, "product_feeds", dataset.product_feeds);
          await insertRows(supabase, "product_feed_items", dataset.product_feed_items);
          await insertRows(supabase, "ad_groups", dataset.ad_groups);
          await updateProjectStatus(supabase, dataset.project.id, "review");
          return;
        case "creative_text":
          await insertRows(supabase, "creative_variants", dataset.creative_variants);
          await insertRows(supabase, "human_reviews", dataset.human_reviews);
          await updateProjectStatus(supabase, dataset.project.id, "creative_ready");
          return;
        case "monitoring_synthesis":
          await insertRows(supabase, "deployments", dataset.deployments);
          await insertRows(supabase, "performance_snapshots", dataset.performance_snapshots);
          await updateProjectStatus(supabase, dataset.project.id, "deployed");
          return;
      }
    }
  };
}

async function updateConversationsRun(
  supabase: SupabaseAny,
  projectId: string,
  runId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ extraction_run_id: runId })
    .eq("project_id", projectId);
  if (error) throw error;
}

async function deleteDemoProject(supabase: SupabaseAny, projectId: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) throw error;
}

async function insertProjectAndSources(
  supabase: SupabaseAny,
  dataset: SeededDemoDataset
): Promise<void> {
  await insertRows(supabase, "projects", [dataset.project]);
  await insertRows(supabase, "sources", dataset.sources);
}

async function insertRows(
  supabase: SupabaseAny,
  table: string,
  rows: readonly unknown[]
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

async function updateRunSucceeded(
  supabase: SupabaseAny,
  run: SeededDemoDataset["extraction_runs"][number]
): Promise<void> {
  const { error } = await supabase
    .from("extraction_runs")
    .update({
      status: "succeeded",
      output_json: run.output_json,
      completed_at: run.completed_at,
      duration_ms: run.duration_ms,
      metadata: run.metadata
    })
    .eq("id", run.id);
  if (error) throw error;
}

async function updateProjectStatus(
  supabase: SupabaseAny,
  projectId: string,
  status: SeededDemoDataset["project"]["status"]
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);
  if (error) throw error;
}

function runForPhase(
  dataset: SeededDemoDataset,
  phase: DemoReplayPhase
): SeededDemoDataset["extraction_runs"][number] {
  const run = dataset.extraction_runs.find((candidate) => candidate.phase === phase);
  if (!run) throw new Error(`Missing seeded extraction run for phase ${phase}`);
  return run;
}

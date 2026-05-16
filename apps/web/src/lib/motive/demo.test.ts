import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEMO_PROJECT_ID,
  DEFAULT_DEMO_SEED_VERSION,
  buildSeededDemoDataset,
  runDemoReset,
  runSeededDemoReplay,
  type DemoReplayRepository,
  type DemoResetRepository
} from "./demo";

describe("Spec 09 seeded demo resilience", () => {
  it("builds a deterministic AtlasDesk dataset that exercises the full demo workflow", () => {
    const dataset = buildSeededDemoDataset({
      demoRunId: "demo-run-1",
      now: new Date("2026-05-16T08:00:00Z")
    });

    expect(dataset.project).toMatchObject({
      id: DEFAULT_DEMO_PROJECT_ID,
      name: "AtlasDesk",
      brand_url: "https://demo.motive.local/atlasdesk",
      demo_slug: "motive-demo"
    });
    expect(dataset.project.metadata).toMatchObject({
      is_seeded_demo: true,
      demo_seed_version: DEFAULT_DEMO_SEED_VERSION
    });
    expect(dataset.sources).toHaveLength(3);
    expect(dataset.extraction_runs.map((run) => run.phase)).toEqual([
      "source_recap",
      "feature_map",
      "conversation_map",
      "intent_classification",
      "landing_gaps",
      "ad_groups",
      "creative_text",
      "monitoring_synthesis"
    ]);
    expect(dataset.brand_features).toHaveLength(10);
    expect(dataset.conversations.length).toBeGreaterThanOrEqual(8);
    expect(dataset.landing_gaps.length).toBeGreaterThanOrEqual(5);
    expect(dataset.ad_groups.map((group) => group.name)).toEqual([
      "Inbox chaos to CRM follow-up",
      "Friday setup promise",
      "Migration without losing labels",
      "Trust and pricing clarity"
    ]);
    expect(dataset.creative_variants.length).toBeGreaterThanOrEqual(6);
    expect(dataset.performance_snapshots).toHaveLength(6);
    expect(dataset.performance_snapshots.every((row) => row.quality_score >= 1 && row.quality_score <= 100)).toBe(true);
    expect(dataset.creative_variants.every((row) => row.title.length <= 50 && row.description.length <= 100)).toBe(true);

    expect(dataset.conversations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "problem_aware",
          intent_type: "workflow_pain",
          buyer_role: "founder",
          constraints_json: expect.objectContaining({
            constraints: expect.arrayContaining([
              expect.objectContaining({ type: "existing_tool", value: "Gmail only" })
            ])
          })
        }),
        expect.objectContaining({
          stage: "solution_compare",
          intent_type: "migration_risk",
          buyer_role: "revenue_lead"
        }),
        expect.objectContaining({
          stage: "vendor_evaluation",
          intent_type: "proof_request",
          buyer_role: "customer_success"
        }),
        expect.objectContaining({
          stage: "pricing_check",
          intent_type: "budget_validation",
          buyer_role: "operations"
        }),
        expect.objectContaining({
          stage: "security_review",
          intent_type: "trust_check",
          buyer_role: "operations"
        })
      ])
    );
  });

  it("resets only the configured demo project and starts a replay event", async () => {
    const operations: string[] = [];
    const repository: DemoResetRepository = {
      async replaceWithCompleteDataset(dataset) {
        operations.push(`reset:${dataset.project.id}:${dataset.sources.length}`);
      }
    };

    const result = await runDemoReset(
      {
        demoProjectId: DEFAULT_DEMO_PROJECT_ID,
        seedVersion: DEFAULT_DEMO_SEED_VERSION,
        replay: true,
        requestedBy: "demo_operator"
      },
      {
        repository,
        sendReplayRequested: async (event) => {
          operations.push(`send:${event.projectId}:${event.seedVersion}:${event.mode}`);
        },
        now: () => new Date("2026-05-16T08:00:00Z"),
        randomUUID: () => "demo-run-reset"
      }
    );

    expect(result).toEqual({
      project_id: DEFAULT_DEMO_PROJECT_ID,
      demo_run_id: "demo-run-reset",
      seed_version: DEFAULT_DEMO_SEED_VERSION,
      replay_started: true
    });
    expect(operations).toEqual([
      `reset:${DEFAULT_DEMO_PROJECT_ID}:3`,
      `send:${DEFAULT_DEMO_PROJECT_ID}:${DEFAULT_DEMO_SEED_VERSION}:seeded_fixture`
    ]);
  });

  it("falls back to a complete seeded dataset when replay dispatch is unavailable", async () => {
    const operations: string[] = [];
    const repository: DemoResetRepository = {
      async replaceWithCompleteDataset(dataset) {
        operations.push(`reset:${dataset.project.id}:${dataset.performance_snapshots.length}`);
      }
    };

    const result = await runDemoReset(
      {
        demoProjectId: DEFAULT_DEMO_PROJECT_ID,
        seedVersion: DEFAULT_DEMO_SEED_VERSION,
        replay: true,
        requestedBy: "demo_operator"
      },
      {
        repository,
        sendReplayRequested: async () => {
          throw new Error("Inngest Dev Server unavailable");
        },
        now: () => new Date("2026-05-16T08:00:00Z"),
        randomUUID: () => "demo-run-fallback"
      }
    );

    expect(result).toMatchObject({
      project_id: DEFAULT_DEMO_PROJECT_ID,
      demo_run_id: "demo-run-fallback",
      replay_started: false,
      replay_error: "Inngest Dev Server unavailable"
    });
    expect(operations).toEqual([`reset:${DEFAULT_DEMO_PROJECT_ID}:6`]);
  });

  it("replays all phases progressively with deterministic delays", async () => {
    const operations: string[] = [];
    const repository: DemoReplayRepository = {
      async prepareReplay(dataset) {
        operations.push(`prepare:${dataset.project.status}:${dataset.sources.length}`);
      },
      async startPhase(phase, run) {
        operations.push(`start:${phase}:${run.status}`);
      },
      async completePhase(phase, dataset) {
        const counts = {
          source_recap: dataset.extraction_runs.length,
          feature_map: dataset.brand_features.length,
          conversation_map: dataset.conversations.length,
          intent_classification: dataset.conversations.length,
          landing_gaps: dataset.landing_gaps.length,
          ad_groups: dataset.ad_groups.length,
          creative_text: dataset.creative_variants.length,
          monitoring_synthesis: dataset.performance_snapshots.length
        };
        operations.push(`complete:${phase}:${counts[phase]}`);
      }
    };

    const result = await runSeededDemoReplay(
      {
        projectId: DEFAULT_DEMO_PROJECT_ID,
        demoRunId: "demo-run-replay",
        seedVersion: DEFAULT_DEMO_SEED_VERSION,
        requestedBy: "demo_operator"
      },
      {
        repository,
        sleep: async (delayMs) => {
          operations.push(`sleep:${delayMs}`);
        },
        now: () => new Date("2026-05-16T08:00:00Z")
      }
    );

    expect(result.status).toBe("succeeded");
    expect(result.phases).toEqual([
      "source_recap",
      "feature_map",
      "conversation_map",
      "intent_classification",
      "landing_gaps",
      "ad_groups",
      "creative_text",
      "monitoring_synthesis"
    ]);
    expect(operations.slice(0, 4)).toEqual([
      "prepare:extracting:3",
      "start:source_recap:running",
      "sleep:600",
      "complete:source_recap:8"
    ]);
    expect(operations).toContain("complete:feature_map:10");
    expect(operations).toContain("complete:landing_gaps:5");
    expect(operations).toContain("complete:creative_text:6");
    expect(operations.at(-1)).toBe("complete:monitoring_synthesis:6");
  });
});

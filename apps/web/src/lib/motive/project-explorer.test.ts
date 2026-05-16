import { describe, expect, it } from "vitest";

import { buildProjectExplorerSummary, type ProjectExplorerInput } from "./project-explorer";

describe("project explorer summaries", () => {
  it("summarizes an empty project with zero counts and overview navigation", () => {
    const summary = buildProjectExplorerSummary(input({
      project: project({ status: "draft" })
    }));

    expect(summary.counts).toMatchObject({
      sources: 0,
      processed_sources: 0,
      extraction_runs: 0,
      approved_review_rows: 0,
      ad_groups: 0,
      creatives: 0,
      approved_creatives: 0,
      deployments: 0,
      performance_snapshots: 0,
      review_actions: 0
    });
    expect(summary.display_stage).toBe("Draft");
    expect(summary.next_href).toBe("/projects/project-1");
  });

  it("links review-ready projects to review", () => {
    const summary = buildProjectExplorerSummary(input({
      project: project({ status: "review" }),
      extraction_runs: [row({ status: "succeeded" })],
      brand_features: [row({ review_status: "approved" })]
    }));

    expect(summary.display_stage).toBe("Review ready");
    expect(summary.counts.approved_review_rows).toBe(1);
    expect(summary.next_href).toBe("/projects/project-1/review");
  });

  it("links creative-ready projects to creatives", () => {
    const summary = buildProjectExplorerSummary(input({
      project: project({ status: "creative_ready" }),
      creative_variants: [
        row({ review_status: "approved" }),
        row({ review_status: "pending" })
      ]
    }));

    expect(summary.display_stage).toBe("Creatives ready");
    expect(summary.counts.creatives).toBe(2);
    expect(summary.counts.approved_creatives).toBe(1);
    expect(summary.next_href).toBe("/projects/project-1/creatives");
  });

  it("links deployed projects with KPI rows to monitoring", () => {
    const summary = buildProjectExplorerSummary(input({
      project: project({ status: "deployed" }),
      deployments: [row()],
      performance_snapshots: [row()]
    }));

    expect(summary.display_stage).toBe("Monitoring live");
    expect(summary.next_href).toBe("/projects/project-1/monitoring");
  });

  it("uses the newest child timestamp as latest activity", () => {
    const summary = buildProjectExplorerSummary(input({
      project: project({ updated_at: "2026-05-16T08:00:00.000Z" }),
      creative_variants: [row({ updated_at: "2026-05-16T09:30:00.000Z" })]
    }));

    expect(summary.latest_activity_at).toBe("2026-05-16T09:30:00.000Z");
  });
});

function input(overrides: Partial<ProjectExplorerInput> = {}): ProjectExplorerInput {
  return {
    project: project(),
    sources: [],
    extraction_runs: [],
    brand_features: [],
    conversations: [],
    landing_gaps: [],
    ad_groups: [],
    creative_variants: [],
    deployments: [],
    performance_snapshots: [],
    human_reviews: [],
    ...overrides
  } as ProjectExplorerInput;
}

function project(
  overrides: Partial<ProjectExplorerInput["project"]> = {}
): ProjectExplorerInput["project"] {
  return {
    id: "project-1",
    name: "AtlasDesk",
    brand_url: "https://atlasdesk.example",
    status: "draft",
    extra_context: null,
    metadata: {},
    created_at: "2026-05-16T07:00:00.000Z",
    updated_at: "2026-05-16T08:00:00.000Z",
    ...overrides
  };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    created_at: "2026-05-16T07:15:00.000Z",
    updated_at: "2026-05-16T07:15:00.000Z",
    ...overrides
  };
}

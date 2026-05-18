import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PastProjectsExplorer } from "./past-projects-explorer";
import type { ProjectExplorerSummary } from "@/lib/motive/project-explorer";

describe("PastProjectsExplorer", () => {
  it("renders project list, filters, preview tabs, and deep links", () => {
    const html = renderToStaticMarkup(
      <PastProjectsExplorer initialProjects={[summary()]} />
    );

    expect(html).toContain("Past projects");
    expect(html).toContain("AtlasDesk");
    expect(html).toContain("All");
    expect(html).toContain("Overview");
    expect(html).toContain("Review");
    expect(html).toContain("Creatives");
    expect(html).toContain("Monitoring");
    expect(html).toContain("/projects/project-1/monitoring");
  });

  it("renders an empty state when no projects exist", () => {
    const html = renderToStaticMarkup(
      <PastProjectsExplorer initialProjects={[]} />
    );

    expect(html).toContain("No persisted projects yet");
    expect(html).toContain('href="/intake"');
  });
});

function summary(overrides: Partial<ProjectExplorerSummary> = {}): ProjectExplorerSummary {
  return {
    id: "project-1",
    name: "AtlasDesk",
    brand_url: "https://atlasdesk.example",
    status: "deployed",
    is_demo: true,
    created_at: "2026-05-16T07:00:00.000Z",
    updated_at: "2026-05-16T08:00:00.000Z",
    latest_activity_at: "2026-05-16T09:00:00.000Z",
    display_stage: "Monitoring live",
    next_href: "/projects/project-1/monitoring",
    counts: {
      sources: 3,
      processed_sources: 3,
      extraction_runs: 8,
      approved_review_rows: 18,
      ad_groups: 4,
      creatives: 6,
      approved_creatives: 5,
      deployments: 1,
      performance_snapshots: 6,
      review_actions: 4
    },
    ...overrides
  };
}

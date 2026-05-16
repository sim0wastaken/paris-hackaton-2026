import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createWorkflowItems, WorkflowNav } from "./workflow-nav";

describe("workflow navigation", () => {
  it("keeps all demo workflow steps visible", () => {
    const labels = createWorkflowItems({
      current: "review",
      projectId: "demo-project",
      completedSteps: ["intake"]
    }).map((item) => item.label);

    expect(labels).toEqual([
      "Intake",
      "Extraction / Review",
      "Creatives",
      "Monitoring"
    ]);
  });

  it("marks the current workflow item for screen readers", () => {
    const html = renderToStaticMarkup(
      <WorkflowNav
        current="review"
        projectId="demo-project"
        completedSteps={["intake"]}
      />
    );

    expect(html).toContain("Extraction / Review");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Blocked");
  });
});

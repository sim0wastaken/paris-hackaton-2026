import { describe, expect, it } from "vitest";

import { inngest } from "./client";
import { functions, MOTIVE_EVENTS } from "./functions";

describe("Inngest runtime contract", () => {
  it("exports the reserved Motive event names", () => {
    expect(MOTIVE_EVENTS).toMatchObject({
      projectCreated: "motive/project.created",
      extractionRequested: "motive/extraction.requested",
      creativesRequested: "motive/creatives.requested",
      fakeDeploymentRequested: "motive/deployment.fake_requested",
      monitoringRequested: "motive/monitoring.requested"
    });
  });

  it("registers placeholder functions against the shared client", () => {
    expect(inngest).toBeDefined();
    expect(functions.length).toBeGreaterThanOrEqual(1);
  });
});

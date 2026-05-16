import { inngest } from "./client";
import { MOTIVE_EVENTS } from "./events";

export const placeholderMonitoring = inngest.createFunction(
  {
    id: "placeholder-monitoring-dispatch",
    triggers: [{ event: MOTIVE_EVENTS.monitoringRequested }]
  },
  async ({ event, step }) => {
    return step.run("acknowledge-monitoring-request", async () => ({
      projectId: event.data.projectId,
      requestId: event.data.requestId,
      status: "reserved"
    }));
  }
);

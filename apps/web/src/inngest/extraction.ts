import { inngest } from "./client";
import { MOTIVE_EVENTS } from "./events";

export const placeholderExtraction = inngest.createFunction(
  {
    id: "placeholder-extraction-dispatch",
    triggers: [{ event: MOTIVE_EVENTS.extractionRequested }]
  },
  async ({ event, step }) => {
    return step.run("acknowledge-extraction-request", async () => ({
      projectId: event.data.projectId,
      requestId: event.data.requestId,
      status: "queued"
    }));
  }
);

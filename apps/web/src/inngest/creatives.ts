import { inngest } from "./client";
import { MOTIVE_EVENTS } from "./events";

export const placeholderCreatives = inngest.createFunction(
  {
    id: "placeholder-creative-dispatch",
    triggers: [{ event: MOTIVE_EVENTS.creativesRequested }]
  },
  async ({ event, step }) => {
    return step.run("acknowledge-creatives-request", async () => ({
      projectId: event.data.projectId,
      requestId: event.data.requestId,
      status: "reserved"
    }));
  }
);

import { inngest } from "./client";
import { MOTIVE_EVENTS } from "./events";

export const seededDemoReplay = inngest.createFunction(
  {
    id: "seeded-demo-extraction-replay",
    triggers: [{ event: MOTIVE_EVENTS.demoExtractionReplayRequested }],
    concurrency: {
      limit: 1,
      key: "event.data.projectId"
    },
    retries: 0
  },
  async ({ event, step }) => {
    const { runSeededDemoReplay } = await import("@/lib/motive/demo");
    const { createSupabaseDemoRepository } = await import("@/lib/motive/demo.server");
    let sleepIndex = 0;

    return runSeededDemoReplay(
      {
        projectId: String(event.data.projectId),
        demoRunId: String(event.data.demoRunId ?? crypto.randomUUID()),
        seedVersion: String(event.data.seedVersion ?? "2026-05-16.worker-e.v1"),
        requestedBy: String(event.data.requestedBy ?? "demo_operator")
      },
      {
        repository: createSupabaseDemoRepository(),
        sleep: (delayMs) => {
          sleepIndex += 1;
          return step.sleep(`demo-replay-${sleepIndex}-${delayMs}ms`, `${delayMs}ms`);
        }
      }
    );
  }
);

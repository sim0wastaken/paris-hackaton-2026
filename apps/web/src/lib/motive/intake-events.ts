import "server-only";

import { inngest } from "@/inngest/client";
import { MOTIVE_EVENTS } from "@/inngest/functions";

import type { IntakeEventSink } from "./projects";

export function createBestEffortIntakeEventSink(): IntakeEventSink {
  return {
    async sendSourceIngestRequested(projectId, sourceId) {
      await sendBestEffort({
        name: MOTIVE_EVENTS.sourceIngestRequested,
        data: {
          projectId,
          sourceId,
          requestId: crypto.randomUUID()
        }
      });
    },
    async sendExtractionRequested(projectId, sourceIds, demoMode = false) {
      await sendBestEffort({
        name: MOTIVE_EVENTS.extractionRequested,
        data: {
          projectId,
          sourceIds,
          demoMode: demoMode || shouldUseSeededExtraction(),
          requestId: crypto.randomUUID()
        }
      });
    }
  };
}

function shouldUseSeededExtraction(): boolean {
  return process.env.DEMO_MODE === "seeded"
    || (process.env.DEMO_MODE === "auto" && !process.env.OPENAI_API_KEY);
}

async function sendBestEffort(event: Parameters<typeof inngest.send>[0]) {
  try {
    await inngest.send(event);
  } catch (error) {
    console.warn("[motive] Inngest event was not delivered", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

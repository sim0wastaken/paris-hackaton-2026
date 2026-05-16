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
          demoMode,
          requestId: crypto.randomUUID()
        }
      });
    }
  };
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

import { MOTIVE_EVENTS } from "@/inngest/events";
import { inngest } from "@/inngest/client";
import { processSourceIngestion } from "@/lib/motive/source-ingestion";
import { extractUrlWithTavily } from "@/lib/providers/tavily";

export const sourceIngestion = inngest.createFunction(
  {
    id: "source-ingestion",
    triggers: [{ event: MOTIVE_EVENTS.sourceIngestRequested }]
  },
  async ({ event, step }) => {
    return step.run("process-source-ingestion", async () => {
      const { createSupabaseIntakeRepository } = await import("@/lib/motive/supabase-projects");
      const projectId = String(event.data.projectId);
      const sourceId = String(event.data.sourceId);
      return processSourceIngestion(
        { projectId, sourceId },
        {
          repository: createSupabaseIntakeRepository(),
          events: {
            async sendSourceIngestRequested() {},
            async sendExtractionRequested(projectId, sourceIds, demoMode = false) {
              await inngest.send({
                name: MOTIVE_EVENTS.extractionRequested,
                data: {
                  projectId,
                  sourceIds,
                  demoMode,
                  requestId: crypto.randomUUID()
                }
              });
            }
          },
          extractor: {
            isConfigured: () => Boolean(process.env.TAVILY_API_KEY),
            extractUrl: async (url) => {
              const result = await extractUrlWithTavily({
                url,
                requestId: String(event.data.requestId ?? crypto.randomUUID())
              });
              if (result.status !== "ready") {
                throw new Error(result.reason);
              }
              return {
                content: result.data.content,
                providerResponse: result.raw as Record<string, unknown>
              };
            }
          }
        }
      );
    });
  }
);

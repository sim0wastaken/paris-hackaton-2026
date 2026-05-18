import { MOTIVE_EVENTS } from "@/inngest/events";
import { inngest } from "@/inngest/client";
import { processSourceIngestion } from "@/lib/motive/source-ingestion";
import { extractTavilyFailureReason, extractUrlWithTavily } from "@/lib/providers/tavily";

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
              const requestId = String(event.data.requestId ?? crypto.randomUUID());
              const basic = await extractUrlWithTavily({ url, requestId, extractDepth: "basic" });
              if (basic.status !== "ready") {
                throw new Error(basic.reason);
              }
              if (basic.data.content.trim()) {
                return {
                  content: basic.data.content,
                  providerResponse: basic.raw as Record<string, unknown>
                };
              }
              // Basic depth returned empty (bot protection, JS-rendered, etc.) —
              // retry once with the advanced browser-based scraper.
              const advanced = await extractUrlWithTavily({ url, requestId, extractDepth: "advanced" });
              if (advanced.status !== "ready") {
                throw new Error(advanced.reason);
              }
              return {
                content: advanced.data.content,
                providerResponse: advanced.raw as Record<string, unknown>,
                failureReason: advanced.data.content.trim()
                  ? undefined
                  : extractTavilyFailureReason(advanced.raw)
                    ?? extractTavilyFailureReason(basic.raw)
                    ?? "advanced extract returned no content"
              };
            }
          }
        }
      );
    });
  }
);

import { inngest } from "./client";
import { MOTIVE_EVENTS } from "./events";

export const extractionPipeline = inngest.createFunction(
  {
    id: "motive-extraction-pipeline",
    triggers: [{ event: MOTIVE_EVENTS.extractionRequested }],
    concurrency: {
      limit: 1,
      key: "event.data.projectId"
    },
    retries: 3
  },
  async ({ event, step }) => {
    return step.run("run-spec-04-extraction-pipeline", async () => {
      const { runExtractionPipeline } = await import("@/lib/motive/extraction");
      const { createSupabaseExtractionRepository } = await import("@/lib/motive/supabase-extraction");
      const { generateOpenAIStructuredObject } = await import("@/lib/providers/openai");

      return runExtractionPipeline(
        {
          projectId: String(event.data.projectId),
          sourceIds: Array.isArray(event.data.sourceIds) ? event.data.sourceIds.map(String) : [],
          requestId: String(event.data.requestId ?? crypto.randomUUID()),
          demoMode: Boolean(event.data.demoMode)
        },
        {
          repository: createSupabaseExtractionRepository(),
          provider: {
            isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
            async generate(input) {
              const result = await generateOpenAIStructuredObject(
                {
                  requestId: input.requestId,
                  schemaName: input.schemaName,
                  schema: input.schema,
                  system: input.system,
                  prompt: input.prompt
                },
                {
                  model: input.model
                }
              );

              if (result.status !== "ready") {
                throw new Error(result.reason);
              }

              return {
                output: result.data.object,
                raw: result.raw,
                responseId: result.data.responseId,
                usage: result.data.usage,
                model: result.data.model
              };
            }
          }
        }
      );
    });
  }
);

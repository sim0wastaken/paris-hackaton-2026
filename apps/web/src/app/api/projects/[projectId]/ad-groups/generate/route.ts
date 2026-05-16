import { NextResponse } from "next/server";
import { z } from "zod";

import { runAdGroupGeneration, AdGroupGenerationError } from "@/lib/motive/ad-groups";
import { createSupabaseAdGroupGenerationRepository } from "@/lib/motive/supabase-ad-groups";
import { generateOpenAIStructuredObject } from "@/lib/providers/openai";

const generateAdGroupsRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  demoMode: z.boolean().optional(),
  forceFallback: z.boolean().optional(),
  campaignDefaults: z.object({
    objective: z.enum(["Clicks", "Views"]).optional(),
    lifetime_spend_limit_micros: z.number().int().min(1_000_000).optional(),
    countries: z.array(z.string().length(2)).min(1).optional(),
    custom_instruction: z.string().trim().min(1).optional()
  }).optional()
});

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = generateAdGroupsRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_ad_group_generation_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  try {
    const result = await runAdGroupGeneration(
      {
        projectId,
        requestId: parsed.data.requestId ?? crypto.randomUUID(),
        demoMode: parsed.data.demoMode ?? shouldUseDeterministicFallback(),
        forceFallback: parsed.data.forceFallback ?? shouldUseDeterministicFallback(),
        campaignDefaults: parsed.data.campaignDefaults
      },
      {
        repository: createSupabaseAdGroupGenerationRepository(),
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

    return NextResponse.json(result);
  } catch (caught) {
    const error = normalizeGenerationRouteError(caught);
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        retryable: error.retryable
      },
      { status: error.status }
    );
  }
}

function shouldUseDeterministicFallback(): boolean {
  return process.env.DEMO_MODE === "seeded"
    || (process.env.DEMO_MODE === "auto" && !process.env.OPENAI_API_KEY);
}

function normalizeGenerationRouteError(caught: unknown) {
  if (caught instanceof AdGroupGenerationError) {
    return {
      code: caught.code,
      message: caught.message,
      retryable: caught.retryable,
      status: caught.code === "project_not_found"
        ? 404
        : caught.code === "not_enough_approved_conversations"
          ? 409
          : 400
    };
  }

  return {
    code: "ad_group_generation_failed",
    message: caught instanceof Error ? caught.message : "Ad-group generation failed.",
    retryable: true,
    status: 500
  };
}

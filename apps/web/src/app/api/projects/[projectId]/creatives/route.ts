import { NextResponse } from "next/server";
import { z } from "zod";

import { CreativeGenerationError, runCreativeGeneration } from "@/lib/motive/creatives";
import { createSupabaseCreativeGenerationRepository } from "@/lib/motive/supabase-creatives";
import { generateFalImage } from "@/lib/providers/fal";
import { generateOpenAIStructuredObject } from "@/lib/providers/openai";

const generateCreativesRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  ad_group_ids: z.array(z.string().min(1)).optional(),
  variant_count: z.number().int().min(1).max(3).optional(),
  generate_assets: z.boolean().optional(),
  regenerate: z.boolean().optional(),
  demoMode: z.boolean().optional(),
  forceFallback: z.boolean().optional()
});

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = generateCreativesRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_creative_generation_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  try {
    const result = await runCreativeGeneration(
      {
        projectId,
        requestId: parsed.data.requestId ?? crypto.randomUUID(),
        adGroupIds: parsed.data.ad_group_ids,
        variantCount: parsed.data.variant_count,
        generateAssets: parsed.data.generate_assets ?? process.env.DEMO_MODE !== "seeded",
        regenerate: parsed.data.regenerate ?? false,
        demoMode: parsed.data.demoMode ?? shouldUseDeterministicFallback(),
        forceFallback: parsed.data.forceFallback ?? shouldUseDeterministicFallback()
      },
      {
        repository: createSupabaseCreativeGenerationRepository(),
        provider: {
          isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
          async generate(input) {
            const result = await generateOpenAIStructuredObject(
              {
                requestId: input.requestId,
                schemaName: input.schemaName,
                schema: input.schema,
                parseSchema: input.parseSchema,
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
        },
        assetProvider: {
          isConfigured: () => Boolean(process.env.FAL_KEY),
          generateImage: generateFalImage
        }
      }
    );

    return NextResponse.json(result);
  } catch (caught) {
    const error = normalizeCreativeRouteError(caught);
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

function normalizeCreativeRouteError(caught: unknown) {
  if (caught instanceof CreativeGenerationError) {
    return {
      code: caught.code,
      message: caught.message,
      retryable: caught.retryable,
      status: caught.code === "project_not_found"
        ? 404
        : caught.code === "no_approved_ad_groups" || caught.code === "missing_source_grounding"
          ? 409
          : caught.code === "openai_not_configured"
            ? 503
            : 400
    };
  }

  return {
    code: "creative_generation_failed",
    message: caught instanceof Error ? caught.message : "Creative generation failed.",
    retryable: true,
    status: 500
  };
}

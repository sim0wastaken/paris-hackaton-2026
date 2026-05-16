import { NextResponse } from "next/server";
import { z } from "zod";

import { FakeDeployError, runFakeDeploy } from "@/lib/motive/deployments";
import { createSupabaseDeploymentRepository } from "@/lib/motive/supabase-deployments";
import { generateOpenAIStructuredObject } from "@/lib/providers/openai";

const deployRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  creative_variant_ids: z.array(z.string().min(1)).optional(),
  generate_performance: z.boolean().optional(),
  export_format: z.literal("openai_ads_api").optional(),
  forceFallback: z.boolean().optional()
});

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const data = await createSupabaseDeploymentRepository().getMonitoringData(projectId);
  if (!data) {
    return NextResponse.json(
      {
        error: "project_not_found",
        message: `Project not found: ${projectId}`
      },
      { status: 404 }
    );
  }
  return NextResponse.json(data);
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = deployRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_deploy_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  try {
    const result = await runFakeDeploy(
      {
        projectId,
        requestId: parsed.data.requestId ?? crypto.randomUUID(),
        creativeVariantIds: parsed.data.creative_variant_ids,
        generatePerformance: parsed.data.generate_performance ?? true,
        forceFallback: parsed.data.forceFallback ?? shouldUseDeterministicFallback()
      },
      {
        repository: createSupabaseDeploymentRepository(),
        synthesisProvider: {
          isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
          async generate<T>(input: {
            requestId: string;
            model: string;
            schemaName: string;
            schema: z.ZodType<T>;
            system: string;
            prompt: string;
          }) {
            const result = await generateOpenAIStructuredObject<T>(
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
    const error = normalizeDeployRouteError(caught);
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

function normalizeDeployRouteError(caught: unknown) {
  if (caught instanceof FakeDeployError) {
    return {
      code: caught.code,
      message: caught.message,
      retryable: caught.retryable,
      status: caught.code === "project_not_found"
        ? 404
        : caught.code === "no_approved_creatives"
          ? 409
          : 400
    };
  }

  return {
    code: "fake_deploy_failed",
    message: caught instanceof Error ? caught.message : "Fake deploy failed.",
    retryable: true,
    status: 500
  };
}

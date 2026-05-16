import { NextResponse } from "next/server";
import { z } from "zod";

import { inngest } from "@/inngest/client";
import { MOTIVE_EVENTS } from "@/inngest/functions";
import { requireServerEnv } from "@/lib/env";
import { createSupabaseExtractionRepository } from "@/lib/motive/supabase-extraction";

const extractRequestSchema = z.object({
  requestId: z.string().min(1).optional(),
  sourceIds: z.array(z.string().uuid()).optional(),
  demoMode: z.boolean().optional()
});

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const env = requireServerEnv();
  const payload = await request.json().catch(() => ({}));
  const parsed = extractRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_extract_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const requestId = parsed.data.requestId ?? crypto.randomUUID();
  const sourceIds = parsed.data.sourceIds ?? [];
  const repository = createSupabaseExtractionRepository();
  const usableSources = await repository.getProcessedSources(projectId, sourceIds);

  if (usableSources.length === 0) {
    return NextResponse.json(
      {
        error: "no_processed_sources",
        message: "Extraction requires at least one processed source.",
        requestId
      },
      { status: 409 }
    );
  }

  try {
    await inngest.send({
      name: MOTIVE_EVENTS.extractionRequested,
      data: {
        projectId,
        requestId,
        sourceIds: usableSources.map((source) => source.id),
        demoMode: parsed.data.demoMode ?? shouldUseSeededExtraction(env)
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "extraction_job_not_started",
        message: error instanceof Error ? error.message : "Unknown Inngest error",
        requestId
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "queued",
    projectId,
    requestId
  });
}

function shouldUseSeededExtraction(env: ReturnType<typeof requireServerEnv>): boolean {
  return env.DEMO_MODE === "seeded" || (env.DEMO_MODE === "auto" && !env.OPENAI_API_KEY);
}

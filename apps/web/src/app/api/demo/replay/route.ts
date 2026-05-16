import { NextResponse } from "next/server";
import { z } from "zod";

import { inngest } from "@/inngest/client";
import { MOTIVE_EVENTS } from "@/inngest/functions";
import { requireServerEnv } from "@/lib/env";
import { demoResetGuard } from "../demo-guard";

const replayRequestSchema = z.object({
  project_id: z.string().uuid().optional(),
  requested_by: z.string().min(1).optional()
});

export async function POST(request: Request) {
  const env = requireServerEnv();
  const guard = demoResetGuard(env, request);
  if (!guard.allowed) {
    return NextResponse.json(
      {
        error: guard.code,
        message: guard.message
      },
      { status: guard.status }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = replayRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_demo_replay_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  if (parsed.data.project_id && parsed.data.project_id !== env.DEMO_PROJECT_ID) {
    return NextResponse.json(
      {
        error: "demo_project_mismatch",
        message: "Demo replay is scoped to the configured demo project only."
      },
      { status: 403 }
    );
  }

  const demoRunId = crypto.randomUUID();
  await inngest.send({
    name: MOTIVE_EVENTS.demoExtractionReplayRequested,
    data: {
      projectId: env.DEMO_PROJECT_ID,
      demoRunId,
      seedVersion: env.DEMO_SEED_VERSION,
      requestedBy: parsed.data.requested_by ?? "demo_operator",
      mode: "seeded_fixture"
    }
  });

  return NextResponse.json({
    status: "queued",
    project_id: env.DEMO_PROJECT_ID,
    demo_run_id: demoRunId,
    seed_version: env.DEMO_SEED_VERSION
  });
}

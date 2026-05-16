import { NextResponse } from "next/server";
import { z } from "zod";

import { inngest } from "@/inngest/client";
import { MOTIVE_EVENTS } from "@/inngest/functions";
import { requireServerEnv } from "@/lib/env";
import { runDemoReset } from "@/lib/motive/demo";
import { createSupabaseDemoRepository } from "@/lib/motive/supabase-demo";
import { demoResetGuard } from "../demo-guard";

const resetRequestSchema = z.object({
  replay: z.boolean().optional(),
  requested_by: z.string().min(1).optional(),
  project_id: z.string().uuid().optional()
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
  const parsed = resetRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_demo_reset_request",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  if (parsed.data.project_id && parsed.data.project_id !== env.DEMO_PROJECT_ID) {
    return NextResponse.json(
      {
        error: "demo_project_mismatch",
        message: "Demo reset is scoped to the configured demo project only."
      },
      { status: 403 }
    );
  }

  const result = await runDemoReset(
    {
      demoProjectId: env.DEMO_PROJECT_ID,
      seedVersion: env.DEMO_SEED_VERSION,
      replay: parsed.data.replay ?? true,
      requestedBy: parsed.data.requested_by ?? "demo_operator"
    },
    {
      repository: createSupabaseDemoRepository(),
      async sendReplayRequested(event) {
        await inngest.send({
          name: MOTIVE_EVENTS.demoExtractionReplayRequested,
          data: event
        });
      }
    }
  );

  return NextResponse.json(result);
}

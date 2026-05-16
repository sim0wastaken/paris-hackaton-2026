import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createBestEffortIntakeEventSink } from "@/lib/motive/intake-events";
import { createProjectIntake } from "@/lib/motive/projects";
import { createSupabaseProjectExplorerRepository } from "@/lib/motive/supabase-project-explorer";
import { createSupabaseIntakeRepository } from "@/lib/motive/supabase-projects";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const projects = await createSupabaseProjectExplorerRepository().listProjectSummaries(
    Number.isFinite(limit) ? limit : 30
  );

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  try {
    const result = await createProjectIntake(payload, {
      repository: createSupabaseIntakeRepository(),
      events: createBestEffortIntakeEventSink()
    });

    return NextResponse.json(
      {
        project_id: result.project.id,
        redirect_url: result.redirect_url,
        sources: result.sources
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "invalid_project_intake",
          issues: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "project_intake_failed",
        message: error instanceof Error ? error.message : "Unknown project intake failure"
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { createBestEffortIntakeEventSink } from "@/lib/motive/intake-events";
import { addSeededDemoSource } from "@/lib/motive/projects";
import { createSupabaseIntakeRepository } from "@/lib/motive/projects.server";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function POST(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const repository = createSupabaseIntakeRepository();
  const source = await addSeededDemoSource(projectId, {
    repository,
    events: createBestEffortIntakeEventSink()
  });

  return NextResponse.json({ source }, { status: 201 });
}

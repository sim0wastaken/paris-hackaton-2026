import { NextResponse } from "next/server";

import { createSupabaseIntakeRepository } from "@/lib/motive/projects.server";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const workspace = await createSupabaseIntakeRepository().getProjectWorkspace(projectId);

  if (!workspace) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

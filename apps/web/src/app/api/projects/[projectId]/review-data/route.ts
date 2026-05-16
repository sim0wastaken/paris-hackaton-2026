import { NextResponse } from "next/server";

import { createSupabaseExtractionRepository } from "@/lib/motive/supabase-extraction";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const data = await createSupabaseExtractionRepository().getReviewData(projectId);

  if (!data) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

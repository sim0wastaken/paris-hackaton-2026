import { NextResponse } from "next/server";

import { parseReviewActionInput, ReviewValidationError } from "@/lib/motive/reviews";
import { createSupabaseReviewRepository } from "@/lib/motive/reviews.server";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  try {
    const input = parseReviewActionInput(projectId, await request.json());
    const result = await createSupabaseReviewRepository().reviewEntity(input);
    return NextResponse.json(result);
  } catch (caught) {
    if (caught instanceof ReviewValidationError) {
      return NextResponse.json(
        { error: "invalid_review_action", issues: caught.issues },
        { status: 400 }
      );
    }

    const message = getErrorMessage(caught);
    if (message.includes("review_entity_not_found")) {
      return NextResponse.json({ error: "review_entity_not_found" }, { status: 404 });
    }
    if (message.includes("review_conflict")) {
      return NextResponse.json({ error: "review_conflict" }, { status: 409 });
    }
    if (message.includes("invalid_review_patch")) {
      return NextResponse.json({ error: "invalid_review_patch", message }, { status: 400 });
    }

    return NextResponse.json({ error: "review_action_failed", message }, { status: 500 });
  }
}

function getErrorMessage(value: unknown) {
  if (value && typeof value === "object" && "message" in value) {
    return String(value.message);
  }
  return "Review action failed";
}

import { EmptyState } from "@/components/empty-state";
import { LiveReviewWorkspace } from "@/components/live-review-workspace";
import { createSupabaseExtractionRepository } from "@/lib/motive/extraction.server";
import { createSupabaseIntakeRepository } from "@/lib/motive/projects.server";

export default async function ReviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [workspace, reviewData] = await Promise.all([
    createSupabaseIntakeRepository().getProjectWorkspace(projectId),
    createSupabaseExtractionRepository().getReviewData(projectId)
  ]);

  if (!workspace || !reviewData) {
    return (
      <EmptyState eyebrow="Project missing" title="No project workspace was found." />
    );
  }

  return <LiveReviewWorkspace initialData={reviewData} initialWorkspace={workspace} />;
}

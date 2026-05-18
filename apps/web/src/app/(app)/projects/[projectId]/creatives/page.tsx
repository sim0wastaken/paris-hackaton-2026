import { EmptyState } from "@/components/empty-state";
import { CreativeGrid } from "@/components/creative-grid";
import { createSupabaseExtractionRepository } from "@/lib/motive/supabase-extraction";

export default async function CreativesPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const reviewData = await createSupabaseExtractionRepository().getReviewData(projectId);

  if (!reviewData) {
    return (
      <EmptyState eyebrow="Project missing" title="No project workspace was found." />
    );
  }

  return <CreativeGrid initialData={reviewData} />;
}

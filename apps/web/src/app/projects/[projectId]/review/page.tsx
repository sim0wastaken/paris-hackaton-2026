import { Play } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ExtractionPhaseRail } from "@/components/extraction-phase-rail";
import { SourceStatusPanel } from "@/components/source-status-panel";
import { createSupabaseIntakeRepository } from "@/lib/motive/supabase-projects";

export default async function ReviewPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const workspace = await createSupabaseIntakeRepository().getProjectWorkspace(projectId);

  if (!workspace) {
    return (
      <EmptyState eyebrow="Project missing" title="No project workspace was found." />
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ExtractionPhaseRail />
      <div className="grid gap-4">
        <SourceStatusPanel initialWorkspace={workspace} />
        <EmptyState
          eyebrow="Extraction pending"
          title="Phase panels are ready for progressive rows."
        >
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-3)]">
            Source recap, features, conversations, landing gaps, and ad group
            drafts will appear here as background jobs complete.
          </p>
          <button
            className="btn btn-ghost mt-4"
            type="button"
          >
            <Play aria-hidden="true" size={16} />
            Extraction route ready
          </button>
        </EmptyState>
      </div>
    </section>
  );
}

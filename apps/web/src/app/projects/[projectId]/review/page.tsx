import { Play } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ExtractionPhaseRail } from "@/components/extraction-phase-rail";

export default function ReviewPage() {
  return (
    <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ExtractionPhaseRail />
      <div className="grid gap-4">
        <EmptyState
          eyebrow="Extraction pending"
          title="Phase panels are ready for progressive rows."
        >
          <p className="max-w-2xl text-sm leading-6 text-[#66706b]">
            Source recap, features, conversations, landing gaps, and ad group
            drafts will appear here as background jobs complete.
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#d9dfd8] px-3 py-2 text-sm font-medium text-[#17201c]"
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

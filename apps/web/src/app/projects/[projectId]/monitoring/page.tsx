import { EmptyState } from "@/components/empty-state";

export default function MonitoringPage() {
  return (
    <EmptyState eyebrow="Blocked" title="Monitoring unlocks after fake deploy.">
      <p className="max-w-2xl text-sm leading-6 text-[#66706b]">
        Spec 08 will persist story-driven KPI snapshots with quality score,
        insight, and recommended action.
      </p>
    </EmptyState>
  );
}

import { EmptyState } from "@/components/empty-state";
import { MonitoringDashboard } from "@/components/monitoring-dashboard";
import { createSupabaseDeploymentRepository } from "@/lib/motive/supabase-deployments";

export default async function MonitoringPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const monitoringData = await createSupabaseDeploymentRepository().getMonitoringData(projectId);

  if (!monitoringData) {
    return (
      <EmptyState eyebrow="Project missing" title="No project workspace was found." />
    );
  }

  return <MonitoringDashboard initialData={monitoringData} />;
}

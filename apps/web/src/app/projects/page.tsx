import { PastProjectsExplorer } from "@/components/past-projects-explorer";
import { createSupabaseProjectExplorerRepository } from "@/lib/motive/supabase-project-explorer";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await createSupabaseProjectExplorerRepository().listProjectSummaries(30);

  return (
    <main className="app-main">
      <PastProjectsExplorer initialProjects={projects} />
    </main>
  );
}

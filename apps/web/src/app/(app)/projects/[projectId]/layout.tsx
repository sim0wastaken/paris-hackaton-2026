import { ProjectWorkflowShell } from "@/components/project-workflow-shell";

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <ProjectWorkflowShell projectId={projectId}>
      {children}
    </ProjectWorkflowShell>
  );
}

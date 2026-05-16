"use client";

import { usePathname } from "next/navigation";

import { WorkflowNav, type WorkflowStepId } from "./workflow-nav";

export function ProjectWorkflowShell({
  children,
  projectId
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const pathname = usePathname();
  const current = getCurrentStep(pathname);

  return (
    <main className="app-main flex flex-col gap-5">
      <WorkflowNav
        completedSteps={["intake"]}
        current={current}
        projectId={projectId}
      />
      {children}
    </main>
  );
}

function getCurrentStep(pathname: string): WorkflowStepId {
  if (pathname.includes("/creatives")) return "creatives";
  if (pathname.includes("/monitoring")) return "monitoring";
  if (pathname.includes("/review")) return "review";
  return "review";
}

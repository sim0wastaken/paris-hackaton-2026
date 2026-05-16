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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
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

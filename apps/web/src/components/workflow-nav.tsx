import Link from "next/link";
import { Check, CircleDashed, Lock, Radio } from "lucide-react";

import { StatusBadge } from "./status-badge";

export type WorkflowStepId = "intake" | "review" | "creatives" | "monitoring";
export type WorkflowStepState = "available" | "blocked" | "complete" | "current" | "failed";

export type WorkflowItem = {
  id: WorkflowStepId;
  href: string;
  label: string;
  state: WorkflowStepState;
};

const workflowDefinition: Array<Omit<WorkflowItem, "href" | "state">> = [
  { id: "intake", label: "Intake" },
  { id: "review", label: "Extraction / Review" },
  { id: "creatives", label: "Creatives" },
  { id: "monitoring", label: "Monitoring" }
];

export function createWorkflowItems({
  completedSteps = [],
  current,
  failedSteps = [],
  projectId
}: {
  completedSteps?: WorkflowStepId[];
  current: WorkflowStepId;
  failedSteps?: WorkflowStepId[];
  projectId?: string;
}): WorkflowItem[] {
  return workflowDefinition.map((item) => {
    const href = item.id === "intake"
      ? "/"
      : `/projects/${projectId ?? "demo-project"}/${item.id === "review" ? "review" : item.id}`;

    let state: WorkflowStepState = "blocked";
    if (item.id === current) state = "current";
    else if (failedSteps.includes(item.id)) state = "failed";
    else if (completedSteps.includes(item.id)) state = "complete";
    else if (item.id === "intake" || item.id === "review") state = "available";

    return {
      ...item,
      href,
      state
    };
  });
}

export function WorkflowNav({
  completedSteps = [],
  current,
  failedSteps = [],
  projectId
}: {
  completedSteps?: WorkflowStepId[];
  current: WorkflowStepId;
  failedSteps?: WorkflowStepId[];
  projectId?: string;
}) {
  const items = createWorkflowItems({
    completedSteps,
    current,
    failedSteps,
    projectId
  });

  return (
    <nav aria-label="Workflow" className="grid gap-2 md:grid-cols-4">
      {items.map((item) => (
        <Link
          aria-current={item.state === "current" ? "page" : undefined}
          className={`workflow-item ${item.state === "current" ? "active" : ""}`}
          href={item.href}
          key={item.id}
        >
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">
              {item.label}
            </span>
            <span className="mt-2 block">
              <StatusBadge status={item.state}>
                {item.state === "blocked"
                  ? "Blocked"
                  : item.state === "current"
                    ? "Current"
                    : item.state === "complete"
                      ? "Complete"
                      : item.state === "failed"
                        ? "Failed"
                        : "Available"}
              </StatusBadge>
            </span>
          </span>
          <WorkflowIcon state={item.state} />
        </Link>
      ))}
    </nav>
  );
}

function WorkflowIcon({ state }: { state: WorkflowStepState }) {
  const className = "workflow-icon";
  if (state === "complete") return <Check aria-hidden="true" className={className} size={18} />;
  if (state === "blocked") return <Lock aria-hidden="true" className={className} size={18} />;
  if (state === "current") return <Radio aria-hidden="true" className={className} size={18} />;
  return <CircleDashed aria-hidden="true" className={className} size={18} />;
}

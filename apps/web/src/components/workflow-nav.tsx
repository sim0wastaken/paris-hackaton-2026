import Link from "next/link";
import { Check, CircleDashed, Lock, Radio } from "lucide-react";

import { StatusBadge } from "./status-badge";

export type WorkflowStepId = "intake" | "review" | "creatives" | "monitoring";
export type WorkflowStepState = "available" | "blocked" | "complete" | "current" | "failed";

export type WorkflowItem = {
  id: WorkflowStepId;
  href: string;
  label: string;
  shortLabel: string;
  state: WorkflowStepState;
};

const workflowDefinition: Array<Omit<WorkflowItem, "href" | "state">> = [
  { id: "intake", label: "Intake", shortLabel: "Intake" },
  { id: "review", label: "Extraction / Review", shortLabel: "Review" },
  { id: "creatives", label: "Creatives", shortLabel: "Creatives" },
  { id: "monitoring", label: "Monitoring", shortLabel: "Monitor" }
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
  const currentIndex = items.findIndex((item) => item.state === "current");

  return (
    <nav aria-label="Workflow" className="workflow-nav">
      <ol
        className="workflow-progress"
        aria-hidden="true"
        style={{ "--progress": `${(Math.max(currentIndex, 0) / (items.length - 1)) * 100}%` } as React.CSSProperties}
      >
        <li className="workflow-progress-bar" />
      </ol>
      <ul className="workflow-list">
        {items.map((item, index) => (
          <li className="workflow-list-item" key={item.id}>
            <Link
              aria-current={item.state === "current" ? "page" : undefined}
              className={`workflow-item state-${item.state}`}
              href={item.href}
            >
              <span className="workflow-item-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="workflow-item-body">
                <span className="workflow-item-label">
                  <span className="workflow-item-label-long">{item.label}</span>
                  <span className="workflow-item-label-short">{item.shortLabel}</span>
                </span>
                <span className="workflow-item-status">
                  <StatusBadge status={item.state}>
                    {statusLabel(item.state)}
                  </StatusBadge>
                </span>
              </span>
              <WorkflowIcon state={item.state} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function statusLabel(state: WorkflowStepState) {
  if (state === "blocked") return "Blocked";
  if (state === "current") return "Current";
  if (state === "complete") return "Complete";
  if (state === "failed") return "Failed";
  return "Available";
}

function WorkflowIcon({ state }: { state: WorkflowStepState }) {
  const className = "workflow-icon";
  if (state === "complete") return <Check aria-hidden="true" className={className} size={18} />;
  if (state === "blocked") return <Lock aria-hidden="true" className={className} size={18} />;
  if (state === "current") return <Radio aria-hidden="true" className={className} size={18} />;
  return <CircleDashed aria-hidden="true" className={className} size={18} />;
}

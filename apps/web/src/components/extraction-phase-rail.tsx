import { CircleDashed } from "lucide-react";

import { StatusBadge } from "./status-badge";

const phases = [
  "Source recap",
  "Feature map",
  "Conversation map",
  "Intent classification",
  "Landing gaps",
  "Ad groups"
];

export function ExtractionPhaseRail() {
  return (
    <aside className="card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Extraction phases</h2>
        <StatusBadge status="available">Idle</StatusBadge>
      </div>
      <ol className="mt-4 grid gap-3">
        {phases.map((phase) => (
          <li
            className="phase-row flex min-h-12 items-center justify-between gap-3 px-3 py-2"
            key={phase}
          >
            <span className="text-sm text-[var(--ink-2)]">{phase}</span>
            <CircleDashed aria-hidden="true" className="text-[var(--ink-4)]" size={16} />
          </li>
        ))}
      </ol>
    </aside>
  );
}

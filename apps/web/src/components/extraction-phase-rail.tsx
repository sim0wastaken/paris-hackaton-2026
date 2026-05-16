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
    <aside className="rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Extraction phases</h2>
        <StatusBadge status="available">Idle</StatusBadge>
      </div>
      <ol className="mt-4 grid gap-3">
        {phases.map((phase) => (
          <li
            className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#d9dfd8] bg-[#fbfcf8] px-3 py-2"
            key={phase}
          >
            <span className="text-sm text-[#17201c]">{phase}</span>
            <CircleDashed aria-hidden="true" className="text-[#66706b]" size={16} />
          </li>
        ))}
      </ol>
    </aside>
  );
}

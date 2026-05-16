import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

import { StatusBadge } from "./status-badge";
import type { ExtractionRunRecord, Spec04ExtractionPhase } from "@/lib/motive/extraction";

const phases: Array<{ id: Spec04ExtractionPhase; label: string }> = [
  { id: "source_recap", label: "Source recap" },
  { id: "feature_map", label: "Feature map" },
  { id: "conversation_map", label: "Conversation map" },
  { id: "intent_classification", label: "Intent classification" },
  { id: "landing_gaps", label: "Landing gaps" },
  { id: "ad_groups", label: "Ad groups" }
];

export function ExtractionPhaseRail({
  runs
}: {
  runs?: ExtractionRunRecord[];
}) {
  const runByPhase = new Map((runs ?? []).map((run) => [run.phase, run]));
  const current = phases.find((phase) => runByPhase.get(phase.id)?.status === "running");
  const failed = phases.find((phase) => runByPhase.get(phase.id)?.status === "failed");

  return (
    <aside className="rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Extraction phases</h2>
        <StatusBadge status={failed ? "failed" : current ? "current" : "available"}>
          {failed ? "Needs retry" : current ? current.label : "Idle"}
        </StatusBadge>
      </div>
      <ol className="mt-4 grid gap-3">
        {phases.map((phase) => (
          <PhaseItem key={phase.id} label={phase.label} run={runByPhase.get(phase.id)} />
        ))}
      </ol>
    </aside>
  );
}

function PhaseItem({
  label,
  run
}: {
  label: string;
  run?: ExtractionRunRecord;
}) {
  const status = run?.status ?? "queued";

  return (
    <li className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#d9dfd8] bg-[#fbfcf8] px-3 py-2">
      <div className="min-w-0">
        <span className="block text-sm text-[#17201c]">{label}</span>
        {run?.error ? (
          <span className="mt-1 block truncate text-xs text-[#a3382f]">{formatError(run.error)}</span>
        ) : null}
      </div>
      {status === "succeeded" ? (
        <CheckCircle2 aria-hidden="true" className="text-[#2c7a4b]" size={16} />
      ) : status === "running" ? (
        <Loader2 aria-hidden="true" className="animate-spin text-[#195b8f]" size={16} />
      ) : status === "failed" ? (
        <XCircle aria-hidden="true" className="text-[#a3382f]" size={16} />
      ) : (
        <CircleDashed aria-hidden="true" className="text-[#66706b]" size={16} />
      )}
    </li>
  );
}

function formatError(value: string) {
  try {
    const parsed = JSON.parse(value) as { code?: unknown };
    if (typeof parsed.code === "string") return parsed.code;
  } catch {
    return value;
  }
  return value;
}

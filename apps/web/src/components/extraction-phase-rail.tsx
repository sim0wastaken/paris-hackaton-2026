import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

import { StatusBadge } from "./status-badge";
import type { ExtractionRunRecord } from "@/lib/motive/extraction";

type PhaseRailId =
  | "source_recap"
  | "feature_map"
  | "conversation_map"
  | "intent_classification"
  | "landing_gaps"
  | "ad_groups"
  | "creative_text"
  | "monitoring_synthesis";

const phases: Array<{ id: PhaseRailId; label: string; disabled?: boolean }> = [
  { id: "source_recap", label: "Source recap" },
  { id: "feature_map", label: "Feature map" },
  { id: "conversation_map", label: "Conversation map" },
  { id: "intent_classification", label: "Intent classification" },
  { id: "landing_gaps", label: "Landing gaps" },
  { id: "ad_groups", label: "Ad groups" },
  { id: "creative_text", label: "Creative text" },
  { id: "monitoring_synthesis", label: "Monitoring", disabled: true }
];

export function ExtractionPhaseRail({
  counts,
  runs
}: {
  counts?: Partial<Record<PhaseRailId, number>>;
  runs?: ExtractionRunRecord[];
}) {
  const runByPhase = new Map<string, ExtractionRunRecord>((runs ?? []).map((run) => [run.phase, run]));
  const current = phases.find((phase) => runByPhase.get(phase.id)?.status === "running");
  const failed = phases.find((phase) => runByPhase.get(phase.id)?.status === "failed");

  return (
    <aside className="card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Extraction phases</h2>
        <StatusBadge status={failed ? "failed" : current ? "current" : "available"}>
          {failed ? "Needs retry" : current ? current.label : "Idle"}
        </StatusBadge>
      </div>
      <ol className="mt-4 grid gap-3">
        {phases.map((phase) => (
          <PhaseItem count={counts?.[phase.id] ?? 0} disabled={phase.disabled} key={phase.id} label={phase.label} run={runByPhase.get(phase.id as ExtractionRunRecord["phase"])} />
        ))}
      </ol>
    </aside>
  );
}

function PhaseItem({
  count,
  disabled,
  label,
  run
}: {
  count: number;
  disabled?: boolean;
  label: string;
  run?: ExtractionRunRecord;
}) {
  const status = disabled ? "next" : run?.status ?? "queued";

  return (
    <li className="phase-row flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <span className="block text-sm text-[var(--ink-2)]">{label}</span>
        <span className="mt-1 block text-xs text-[var(--ink-3)]">{count > 0 ? `${count} rows` : status}</span>
        {run?.error ? (
          <span className="mt-1 block truncate text-xs text-[var(--warn)]">{formatError(run.error)}</span>
        ) : null}
      </div>
      {status === "succeeded" ? (
        <CheckCircle2 aria-hidden="true" className="text-[var(--acid)]" size={16} />
      ) : status === "running" ? (
        <Loader2 aria-hidden="true" className="animate-spin text-[var(--acid-2)]" size={16} />
      ) : status === "failed" ? (
        <XCircle aria-hidden="true" className="text-[var(--warn)]" size={16} />
      ) : (
        <CircleDashed aria-hidden="true" className="text-[var(--ink-4)]" size={16} />
      )}
    </li>
  );
}

function formatError(value: string) {
  try {
    const parsed = JSON.parse(value) as { code?: unknown; message?: unknown };
    const code = typeof parsed.code === "string" ? parsed.code : null;
    const message = typeof parsed.message === "string" ? parsed.message : null;
    if (code && message) return `${code}: ${message}`;
    if (code) return code;
    if (message) return message;
  } catch {
    return value;
  }
  return value;
}

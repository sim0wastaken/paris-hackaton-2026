"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Layers3, RefreshCw, Sparkles } from "lucide-react";

import { ExtractionPhaseRail } from "./extraction-phase-rail";
import { SourceStatusPanel } from "./source-status-panel";
import { StatusBadge } from "./status-badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ExtractionReviewData } from "@/lib/motive/extraction";
import type { ProjectWorkspace } from "@/lib/motive/projects";

type ReviewTable =
  | "extraction_runs"
  | "brand_features"
  | "conversations"
  | "landing_gaps"
  | "ad_groups";

export function LiveReviewWorkspace({
  initialData,
  initialWorkspace
}: {
  initialData: ExtractionReviewData;
  initialWorkspace: ProjectWorkspace;
}) {
  const [data, setData] = useState(initialData);
  const [connection, setConnection] = useState<"connecting" | "live" | "polling">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const projectId = initialData.project.id;
  const sourceRecap = data.extraction_runs.find((run) => run.phase === "source_recap");
  const failedRun = data.extraction_runs.find((run) => run.status === "failed");
  const usableSourceIds = useMemo(
    () => data.sources
      .filter((source) => source.status === "processed" && (source.extracted_text ?? source.raw_text))
      .map((source) => source.id),
    [data.sources]
  );
  const demoMode = useMemo(
    () => data.sources.some((source) => source.metadata.demo === true || source.metadata.is_seeded_demo === true),
    [data.sources]
  );

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/projects/${projectId}/review-data`, {
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("Review refresh failed");
    setData(await response.json());
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    const interval = setInterval(() => {
      refresh(controller.signal).catch((caught) => {
        if (!controller.signal.aborted) {
          setConnection("polling");
          setError(caught instanceof Error ? caught.message : "Review refresh failed");
        }
      });
    }, 3_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const merge = (table: ReviewTable, row: unknown) => {
      if (!row || typeof row !== "object" || !("id" in row)) return;
      setData((current) => ({
        ...current,
        [table]: upsertById(current[table] as Array<Record<string, unknown>>, row as Record<string, unknown>)
      }));
    };

    const channel = supabase
      .channel(`motive-review-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "extraction_runs", filter: `project_id=eq.${projectId}` }, (payload) => merge("extraction_runs", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "brand_features", filter: `project_id=eq.${projectId}` }, (payload) => merge("brand_features", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `project_id=eq.${projectId}` }, (payload) => merge("conversations", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "landing_gaps", filter: `project_id=eq.${projectId}` }, (payload) => merge("landing_gaps", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_groups", filter: `project_id=eq.${projectId}` }, (payload) => merge("ad_groups", payload.new))
      .subscribe((status) => {
        setConnection(status === "SUBSCRIBED" ? "live" : "polling");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  async function retryExtraction() {
    setRetrying(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/extract`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          sourceIds: usableSourceIds,
          demoMode
        })
      });
      if (!response.ok) throw new Error("Extraction retry was not queued");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Extraction retry was not queued");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ExtractionPhaseRail runs={data.extraction_runs} />
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d9dfd8] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            {connection === "live" ? (
              <CheckCircle2 aria-hidden="true" className="text-[#2c7a4b]" size={16} />
            ) : (
              <RefreshCw aria-hidden="true" className="text-[#195b8f]" size={16} />
            )}
            <span className="text-sm font-medium text-[#17201c]">
              {connection === "live" ? "Realtime live" : "Polling updates"}
            </span>
          </div>
          {failedRun ? (
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={retrying || usableSourceIds.length === 0}
              onClick={retryExtraction}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              {retrying ? "Queueing..." : "Retry extraction"}
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-md border border-[#efc0bd] bg-[#fff0ee] px-3 py-2 text-sm text-[#a3382f]">
            {error}
          </p>
        ) : null}

        <SourceStatusPanel initialWorkspace={initialWorkspace} />
        <SourceRecapPanel run={sourceRecap} />
        <FeaturePanel data={data} />
        <ConversationPanel data={data} />
        <LandingGapPanel data={data} />
        <AdGroupPanel data={data} />
      </div>
    </section>
  );
}

function SourceRecapPanel({
  run
}: {
  run?: ExtractionReviewData["extraction_runs"][number];
}) {
  const output = asRecord(run?.output_json);
  const quality = asRecord(output.source_quality);

  return (
    <Panel
      count={run?.status === "succeeded" ? 1 : 0}
      eyebrow="Source recap"
      icon={<Sparkles aria-hidden="true" size={16} />}
      status={run?.status ?? "queued"}
      title={String(output.brand_name ?? "Waiting for source recap")}
    >
      <p className="text-sm leading-6 text-[#3f4944]">
        {String(output.one_sentence_offer ?? "The recap will summarize offer, ICP, proof, constraints, and source quality.")}
      </p>
      {output.positioning_summary ? (
        <p className="mt-3 text-sm leading-6 text-[#66706b]">{String(output.positioning_summary)}</p>
      ) : null}
      {quality.coverage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status="available">Coverage: {String(quality.coverage)}</StatusBadge>
          {Array.isArray(quality.missing_context)
            ? quality.missing_context.slice(0, 3).map((item) => (
                <span className="rounded-md border border-[#d9dfd8] px-2 py-1 text-xs text-[#66706b]" key={String(item)}>
                  Missing: {String(item)}
                </span>
              ))
            : null}
        </div>
      ) : null}
    </Panel>
  );
}

function FeaturePanel({ data }: { data: ExtractionReviewData }) {
  return (
    <Panel
      count={data.brand_features.length}
      eyebrow="Feature map"
      icon={<Layers3 aria-hidden="true" size={16} />}
      status={phaseStatus(data, "feature_map")}
      title="Campaign-relevant facts"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {data.brand_features.map((feature) => (
          <article className="rounded-md border border-[#d9dfd8] bg-[#fbfcf8] p-3" key={feature.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17201c]">{feature.title}</h3>
              <StatusBadge status="available">{feature.type}</StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#3f4944]">{feature.description}</p>
            {feature.evidence ? (
              <p className="mt-2 text-xs text-[#66706b]">{feature.evidence}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ConversationPanel({ data }: { data: ExtractionReviewData }) {
  return (
    <Panel
      count={data.conversations.length}
      eyebrow="Conversation map"
      icon={<Sparkles aria-hidden="true" size={16} />}
      status={phaseStatus(data, "conversation_map")}
      title="Buyer conversations"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="text-xs uppercase text-[#66706b]">
            <tr>
              <th className="border-b border-[#d9dfd8] py-2 pr-3 font-semibold">Conversation</th>
              <th className="border-b border-[#d9dfd8] px-3 py-2 font-semibold">Stage</th>
              <th className="border-b border-[#d9dfd8] px-3 py-2 font-semibold">Intent</th>
              <th className="border-b border-[#d9dfd8] pl-3 py-2 font-semibold">Buyer</th>
            </tr>
          </thead>
          <tbody>
            {data.conversations.map((conversation) => (
              <tr key={conversation.id}>
                <td className="max-w-xl border-b border-[#edf0e8] py-3 pr-3 text-[#17201c]">{conversation.text}</td>
                <td className="border-b border-[#edf0e8] px-3 py-3 text-[#3f4944]">{conversation.stage || "intent pending"}</td>
                <td className="border-b border-[#edf0e8] px-3 py-3 text-[#3f4944]">{conversation.intent_type || "intent pending"}</td>
                <td className="border-b border-[#edf0e8] pl-3 py-3 text-[#3f4944]">{conversation.buyer_role ?? "unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LandingGapPanel({ data }: { data: ExtractionReviewData }) {
  return (
    <Panel
      count={data.landing_gaps.length}
      eyebrow="Landing gaps"
      icon={<AlertCircle aria-hidden="true" size={16} />}
      status={phaseStatus(data, "landing_gaps")}
      title="Conversion proof gaps"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {data.landing_gaps.map((gap) => (
          <article className="rounded-md border border-[#d9dfd8] bg-[#fbfcf8] p-3" key={gap.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17201c]">{gap.gap_type}</h3>
              <StatusBadge status={gap.severity >= 5 ? "failed" : "current"}>Severity {gap.severity}</StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#3f4944]">{gap.description}</p>
            <p className="mt-2 text-xs text-[#66706b]">{gap.suggested_fix}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AdGroupPanel({ data }: { data: ExtractionReviewData }) {
  return (
    <Panel
      count={data.ad_groups.length}
      eyebrow="Draft ad groups"
      icon={<Sparkles aria-hidden="true" size={16} />}
      status={phaseStatus(data, "ad_groups")}
      title="Draft campaign angles"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {data.ad_groups.map((group) => (
          <article className="rounded-md border border-[#d9dfd8] bg-[#fbfcf8] p-3" key={group.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17201c]">{group.name}</h3>
              <StatusBadge status="available">{group.status}</StatusBadge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#3f4944]">{group.rationale}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.context_hints.slice(0, 4).map((hint) => (
                <span className="rounded-md border border-[#d9dfd8] px-2 py-1 text-xs text-[#66706b]" key={hint}>
                  {hint}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Panel({
  children,
  count,
  eyebrow,
  icon,
  status,
  title
}: {
  children: ReactNode;
  count: number;
  eyebrow: string;
  icon: ReactNode;
  status: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[#195b8f]">
            {icon}
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#17201c]">{title}</h2>
        </div>
        <StatusBadge status={badgeStatus(status)}>
          {count > 0 ? `${count} rows` : status.replaceAll("_", " ")}
        </StatusBadge>
      </div>
      {count > 0 || status === "succeeded" ? (
        children
      ) : (
        <p className="text-sm text-[#66706b]">Waiting for this phase.</p>
      )}
    </section>
  );
}

function phaseStatus(data: ExtractionReviewData, phase: string) {
  return data.extraction_runs.find((run) => run.phase === phase)?.status ?? "queued";
}

function badgeStatus(status: string) {
  if (status === "succeeded") return "complete";
  if (status === "running") return "current";
  if (status === "failed") return "failed";
  return "available";
}

function upsertById<Row extends Record<string, unknown>>(rows: Row[], next: Row) {
  const index = rows.findIndex((row) => row.id === next.id);
  if (index === -1) return [...rows, next];
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...next } : row));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

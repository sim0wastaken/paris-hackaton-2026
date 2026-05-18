"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, FileText, Play, RefreshCw } from "lucide-react";

import { StatusBadge } from "./status-badge";
import type { ProjectWorkspace, SourceRecord } from "@/lib/motive/projects";

export function SourceStatusPanel({
  initialWorkspace
}: {
  initialWorkspace: ProjectWorkspace;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [error, setError] = useState<string | null>(null);
  const [addingDemo, setAddingDemo] = useState(false);
  const summary = useMemo(() => summarize(workspace.sources), [workspace.sources]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/projects/${workspace.project.id}`, {
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("Project refresh failed");
    setWorkspace(await response.json());
  }, [workspace.project.id]);

  useEffect(() => {
    const controller = new AbortController();
    const interval = setInterval(() => {
      refresh(controller.signal).catch((caught) => {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Project refresh failed");
        }
      });
    }, 2_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [refresh]);

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">
            Sources
          </p>
          <h2 className="t-h4 mt-3">
            {workspace.project.name}
          </h2>
        </div>
        <StatusBadge status={summary.usable > 0 ? "complete" : "current"}>
          {summary.usable > 0 ? `${summary.usable} usable` : "Waiting"}
        </StatusBadge>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {workspace.sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>

      {error ? (
        <p className="error-callout mt-4">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => refresh().catch((caught) => setError(caught instanceof Error ? caught.message : "Project refresh failed"))}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          Refresh
        </button>
        {summary.usable === 0 ? (
          <button
            className="btn btn-primary btn-sm"
            disabled={addingDemo}
            onClick={async () => {
              setAddingDemo(true);
              setError(null);
              try {
                const response = await fetch(`/api/projects/${workspace.project.id}/demo-source`, {
                  method: "POST"
                });
                if (!response.ok) throw new Error("Demo source was not added");
                await refresh();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Demo source was not added");
              } finally {
                setAddingDemo(false);
              }
            }}
            type="button"
          >
            <Play aria-hidden="true" size={16} />
            {addingDemo ? "Adding..." : "Use demo source"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function SourceCard({ source }: { source: SourceRecord }) {
  const textLength = (source.extracted_text ?? source.raw_text ?? "").length;

  return (
    <article className="source-card grid gap-3 p-3 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {source.type === "product_feed" ? (
            <Database aria-hidden="true" className="text-[var(--acid-2)]" size={16} />
          ) : (
            <FileText aria-hidden="true" className="text-[var(--acid-2)]" size={16} />
          )}
          <h3 className="truncate text-sm font-semibold text-[var(--ink)]">
            {source.name}
          </h3>
        </div>
        <p className="mt-2 text-xs text-[var(--ink-3)]">
          {source.type} · {textLength.toLocaleString()} characters
          {source.error ? ` · ${source.error}` : ""}
        </p>
      </div>
      <StatusBadge status={badgeStatus(source.status)}>
        {source.status.replaceAll("_", " ")}
      </StatusBadge>
    </article>
  );
}

function summarize(sources: SourceRecord[]) {
  return {
    usable: sources.filter((source) => source.status === "processed" && (source.extracted_text ?? source.raw_text)).length
  };
}

function badgeStatus(status: SourceRecord["status"]) {
  if (status === "processed") return "complete";
  if (status === "failed" || status === "skipped" || status === "needs_manual_text") return "failed";
  if (status === "processing") return "current";
  return "available";
}

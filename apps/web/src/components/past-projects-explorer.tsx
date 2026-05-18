"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Sparkles
} from "lucide-react";

import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import type { ProjectGenerationPreview, ProjectExplorerSummary } from "@/lib/motive/project-explorer";

type ExplorerTab = "overview" | "review" | "creatives" | "monitoring";
type StatusFilter = "all" | ProjectExplorerSummary["status"];

const tabs: Array<{ id: ExplorerTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "review", label: "Review" },
  { id: "creatives", label: "Creatives" },
  { id: "monitoring", label: "Monitoring" }
];

const filters: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "extracting", label: "Extracting" },
  { id: "review", label: "Review" },
  { id: "creative_ready", label: "Creative ready" },
  { id: "deployed", label: "Deployed" },
  { id: "failed", label: "Failed" }
];

export function PastProjectsExplorer({
  initialProjects
}: {
  initialProjects: ProjectExplorerSummary[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<ExplorerTab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [previews, setPreviews] = useState<Record<string, ProjectGenerationPreview>>({});
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const matchesQuery = !normalizedQuery
        || project.name.toLowerCase().includes(normalizedQuery)
        || project.brand_url.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [projects, query, statusFilter]);

  const selectedProject = useMemo(
    () => filteredProjects.find((project) => project.id === selectedId)
      ?? filteredProjects[0]
      ?? projects.find((project) => project.id === selectedId)
      ?? projects[0],
    [filteredProjects, projects, selectedId]
  );
  const selectedPreview = selectedProject ? previews[selectedProject.id] : undefined;

  const refreshProjects = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/projects?limit=30", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Project refresh failed");
      setProjects(payload.projects ?? []);
      setSelectedId((current) => current || payload.projects?.[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadPreview = useCallback(async (projectId: string) => {
    if (previews[projectId] || loadingPreviewId === projectId) return;
    setLoadingPreviewId(projectId);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/generation`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Project preview failed");
      setPreviews((current) => ({
        ...current,
        [projectId]: payload
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project preview failed");
    } finally {
      setLoadingPreviewId(null);
    }
  }, [loadingPreviewId, previews]);

  if (projects.length === 0) {
    return (
      <EmptyState eyebrow="Past projects" title="No persisted projects yet">
        <Link className="btn btn-primary mt-4" href="/">
          Open intake
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </EmptyState>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker">Past projects</p>
          <h1 className="t-h2 mt-3">Generation explorer</h1>
        </div>
        <button
          className="btn btn-ghost"
          disabled={refreshing}
          onClick={() => void refreshProjects()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="workspace-split with-explorer">
        <aside className="card explorer-panel">
          <label className="field">
            <span className="field-label">Search</span>
            <span className="field-control">
              <Search aria-hidden="true" className="field-icon" size={17} />
              <input
                className="input has-icon"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Project or URL"
                type="search"
                value={query}
              />
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                className={`tag ${statusFilter === filter.id ? "tag-solid" : "tag-outline"}`}
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            {filteredProjects.length === 0 ? (
              <p className="t-small rounded-md border border-[var(--line)] p-4">
                No projects match the current filters.
              </p>
            ) : filteredProjects.map((project) => (
              <button
                className={`project-list-item ${project.id === selectedProject?.id ? "active" : ""}`}
                key={project.id}
                onClick={() => {
                  setSelectedId(project.id);
                  setActiveTab("overview");
                }}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                    {project.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--ink-3)]">
                    {project.brand_url}
                  </span>
                  <span className="t-mono mt-2 block">{formatDate(project.latest_activity_at)}</span>
                </span>
                <span className="flex flex-col items-end justify-start gap-2">
                  <StatusBadge status={badgeStatus(project.status)}>
                    {project.display_stage}
                  </StatusBadge>
                </span>
              </button>
            ))}
          </div>
        </aside>

        {selectedProject ? (
          <article className="card-feature">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="t-h3 truncate">{selectedProject.name}</h2>
                  {selectedProject.is_demo ? <span className="tag tag-cyan">Demo</span> : null}
                </div>
                <p className="mt-2 truncate text-sm text-[var(--ink-3)]">{selectedProject.brand_url}</p>
              </div>
              <Link className="btn btn-primary" href={selectedProject.next_href}>
                Open workflow
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Metric label="Sources" value={`${selectedProject.counts.processed_sources}/${selectedProject.counts.sources}`} />
              <Metric label="Runs" value={selectedProject.counts.extraction_runs} />
              <Metric label="Creatives" value={selectedProject.counts.creatives} />
              <Metric label="KPI rows" value={selectedProject.counts.performance_snapshots} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2" role="tablist">
              {tabs.map((tab) => (
                <button
                  aria-selected={activeTab === tab.id}
                  className={`explorer-tab ${activeTab === tab.id ? "active" : ""}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "overview") void loadPreview(selectedProject.id);
                  }}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error ? <p className="error-callout mt-4">{error}</p> : null}

            <div className="mt-5">
              {loadingPreviewId === selectedProject.id && !selectedPreview ? (
                <PreviewShell icon={<Eye aria-hidden="true" size={18} />} title="Loading preview" />
              ) : (
                <PreviewContent
                  activeTab={activeTab}
                  preview={selectedPreview}
                  project={selectedProject}
                />
              )}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function PreviewContent({
  activeTab,
  preview,
  project
}: {
  activeTab: ExplorerTab;
  preview?: ProjectGenerationPreview;
  project: ProjectExplorerSummary;
}) {
  if (activeTab === "overview") {
    return (
      <PreviewShell icon={<FileText aria-hidden="true" size={18} />} title="Overview">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Metric label="Review rows" value={project.counts.approved_review_rows} />
          <Metric label="Approved creatives" value={project.counts.approved_creatives} />
          <Metric label="Deployments" value={project.counts.deployments} />
        </div>
      </PreviewShell>
    );
  }

  if (!preview) {
    return (
      <PreviewShell icon={<Eye aria-hidden="true" size={18} />} title="Preview unavailable">
        <p className="t-small">Open the workflow for this project.</p>
      </PreviewShell>
    );
  }

  if (activeTab === "review") {
    return (
      <PreviewShell icon={<Eye aria-hidden="true" size={18} />} title="Review">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <PreviewList title="Features" rows={preview.brand_features.map((item) => item.title)} />
          <PreviewList title="Conversations" rows={preview.conversations.map((item) => item.text)} />
          <PreviewList title="Landing gaps" rows={preview.landing_gaps.map((item) => item.description)} />
        </div>
      </PreviewShell>
    );
  }

  if (activeTab === "creatives") {
    return (
      <PreviewShell icon={<Sparkles aria-hidden="true" size={18} />} title="Creatives">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {preview.creative_variants.slice(0, 6).map((creative) => (
            <div className="preview-row" key={creative.id}>
              <p className="font-semibold text-[var(--ink)]">{creative.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-3)]">{creative.description}</p>
              <p className="t-mono mt-3">{creative.review_status}</p>
            </div>
          ))}
        </div>
      </PreviewShell>
    );
  }

  return (
    <PreviewShell icon={<BarChart3 aria-hidden="true" size={18} />} title="Monitoring">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {preview.performance_snapshots.slice(0, 6).map((snapshot) => (
          <div className="preview-row" key={snapshot.id}>
            <p className="stat-num">{snapshot.quality_score}</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{snapshot.insight}</p>
            <p className="t-mono mt-3">{snapshot.clicks} clicks</p>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function PreviewShell({
  children,
  icon,
  title
}: {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="card-inset">
      <div className="mb-4 flex items-center gap-2 text-[var(--acid)]">
        {icon}
        <h3 className="t-h4">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PreviewList({ rows, title }: { rows: string[]; title: string }) {
  return (
    <div className="preview-row">
      <p className="t-mono">{title}</p>
      <div className="mt-3 grid gap-3">
        {rows.slice(0, 4).map((row) => (
          <p className="line-clamp-3 text-sm text-[var(--ink-2)]" key={row}>
            {row}
          </p>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-card">
      <p className="t-mono">{label}</p>
      <p className="stat-num mt-2">{value}</p>
    </div>
  );
}

function badgeStatus(status: ProjectExplorerSummary["status"]) {
  if (status === "failed") return "failed";
  if (status === "extracting") return "current";
  if (status === "draft") return "available";
  return "complete";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

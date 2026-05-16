import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getProjectShell } from "@/lib/motive/projects";
import { createSupabaseIntakeRepository } from "@/lib/motive/supabase-projects";

export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const workspace = await createSupabaseIntakeRepository().getProjectWorkspace(projectId);
  if (workspace) {
    const stats = [
      { label: "Sources", value: String(workspace.sources.length) },
      { label: "Usable sources", value: String(workspace.sources.filter((source) => source.status === "processed").length) },
      { label: "Product rows", value: String(workspace.product_feed_items.length) }
    ];

    return (
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card-feature">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker">
                Project
              </p>
              <h1 className="t-h2 mt-3">{workspace.project.name}</h1>
            </div>
            <StatusBadge status="current">{workspace.project.status}</StatusBadge>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                className="stat-card"
                key={stat.label}
              >
                <p className="t-mono">{stat.label}</p>
                <p className="stat-num mt-2">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="t-h4">Next action</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
            Source cards are visible in review while ingestion and extraction events run.
          </p>
          <Link
            className="btn btn-primary mt-5"
            href={`/projects/${projectId}/review`}
          >
            Open review
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
    );
  }

  const project = getProjectShell(projectId);

  if (!project) {
    return (
      <EmptyState eyebrow="Project missing" title="No project shell was found.">
        <Link
          className="btn btn-primary mt-4"
          href="/"
        >
          Back to intake
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </EmptyState>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="card-feature">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker">
              Project
            </p>
            <h1 className="t-h2 mt-3">{project.name}</h1>
          </div>
          <StatusBadge status="available">Ready</StatusBadge>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {project.stats.map((stat) => (
            <div
              className="stat-card"
              key={stat.label}
            >
              <p className="t-mono">{stat.label}</p>
              <p className="stat-num mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="t-h4">Next action</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
          The runtime shell is ready. Start extraction from the review workspace
          when source ingestion lands.
        </p>
        <Link
          className="btn btn-primary mt-5"
          href={`/projects/${projectId}/review`}
        >
          Open review
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
}

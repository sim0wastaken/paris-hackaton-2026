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
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[#195b8f]">
                Project
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{workspace.project.name}</h1>
            </div>
            <StatusBadge status="current">{workspace.project.status}</StatusBadge>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                className="rounded-md border border-[#d9dfd8] bg-[#fbfcf8] p-3"
                key={stat.label}
              >
                <p className="text-xs uppercase text-[#66706b]">{stat.label}</p>
                <p className="mt-2 text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Next action</h2>
          <p className="mt-3 text-sm leading-6 text-[#66706b]">
            Source cards are visible in review while ingestion and extraction events run.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white"
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
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white"
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
      <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#195b8f]">
              Project
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{project.name}</h1>
          </div>
          <StatusBadge status="available">Ready</StatusBadge>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {project.stats.map((stat) => (
            <div
              className="rounded-md border border-[#d9dfd8] bg-[#fbfcf8] p-3"
              key={stat.label}
            >
              <p className="text-xs uppercase text-[#66706b]">{stat.label}</p>
              <p className="mt-2 text-xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Next action</h2>
        <p className="mt-3 text-sm leading-6 text-[#66706b]">
          The runtime shell is ready. Start extraction from the review workspace
          when source ingestion lands.
        </p>
        <Link
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white"
          href={`/projects/${projectId}/review`}
        >
          Open review
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </section>
  );
}

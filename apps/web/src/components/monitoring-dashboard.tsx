"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BarChart3, Check, Rocket, RotateCcw, RotateCw } from "lucide-react";

import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import type { MonitoringData } from "@/lib/motive/deployments";
import { buildDemoResetHeaders, readBrowserDemoOperatorToken } from "@/lib/motive/demo-reset-client";
import type { CreativeVariant, PerformanceSnapshot } from "@/lib/motive/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MonitoringTable =
  | "deployments"
  | "performance_snapshots"
  | "creative_variants"
  | "ad_groups"
  | "campaigns"
  | "human_reviews";

type DeployResponse = {
  message?: string;
  error?: string;
  deployment_id?: string;
  performance_snapshot_ids?: string[];
};

export function MonitoringDashboard({ initialData }: { initialData: MonitoringData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialData.creative_variants.filter(isDeployableCreative).map((creative) => creative.id)
  );
  const [connection, setConnection] = useState<"connecting" | "live" | "polling">("connecting");
  const [deploying, setDeploying] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const projectId = initialData.project.id;

  const deployableCreatives = useMemo(
    () => data.creative_variants.filter(isDeployableCreative),
    [data.creative_variants]
  );
  const selectedDeployableIds = useMemo(() => {
    const allowed = new Set(deployableCreatives.map((creative) => creative.id));
    return selectedIds.filter((id) => allowed.has(id));
  }, [deployableCreatives, selectedIds]);
  const latestDeployment = useMemo(
    () => [...data.deployments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    [data.deployments]
  );
  const latestSnapshots = useMemo(() => {
    if (!latestDeployment) return [];
    return data.performance_snapshots
      .filter((snapshot) => snapshot.deployment_id === latestDeployment.id)
      .sort((a, b) => b.quality_score - a.quality_score);
  }, [data.performance_snapshots, latestDeployment]);
  const stats = useMemo(() => summarizeSnapshots(latestSnapshots), [latestSnapshots]);
  const summary = useMemo(() => dashboardSummary(latestDeployment?.payload_json, latestSnapshots), [
    latestDeployment,
    latestSnapshots
  ]);
  const isSeededDemo = data.project.metadata.is_seeded_demo === true;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/projects/${projectId}/deploy`, {
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("Monitoring refresh failed");
    setData(await response.json());
  }, [projectId]);

  useEffect(() => {
    if (connection === "live") return;
    const controller = new AbortController();
    const interval = setInterval(() => {
      refresh(controller.signal).catch((caught) => {
        if (!controller.signal.aborted) {
          setConnection("polling");
          setError(caught instanceof Error ? caught.message : "Monitoring refresh failed");
        }
      });
    }, 4_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [connection, refresh]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const merge = (table: MonitoringTable, row: unknown) => {
      if (!row || typeof row !== "object" || !("id" in row)) return;
      setData((current) => ({
        ...current,
        [table]: upsertById(current[table] as Array<Record<string, unknown>>, row as Record<string, unknown>)
      }));
    };

    const channel = supabase
      .channel(`motive-monitoring-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deployments", filter: `project_id=eq.${projectId}` }, (payload) => merge("deployments", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "performance_snapshots", filter: `project_id=eq.${projectId}` }, (payload) => merge("performance_snapshots", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "creative_variants", filter: `project_id=eq.${projectId}` }, (payload) => merge("creative_variants", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_groups", filter: `project_id=eq.${projectId}` }, (payload) => merge("ad_groups", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `project_id=eq.${projectId}` }, (payload) => merge("campaigns", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "human_reviews", filter: `project_id=eq.${projectId}` }, (payload) => merge("human_reviews", payload.new))
      .subscribe((status) => {
        setConnection(status === "SUBSCRIBED" ? "live" : "polling");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  async function fakeDeploy() {
    setDeploying(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          creative_variant_ids: selectedDeployableIds,
          generate_performance: true,
          export_format: "openai_ads_api"
        })
      });
      const payload = await response.json().catch(() => ({} as DeployResponse));
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Fake deploy failed");
      }
      await refresh();
      setAnnouncement(`Fake deployed ${payload.performance_snapshot_ids?.length ?? 0} monitoring rows.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Fake deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  async function resetDemo() {
    setResettingDemo(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: buildDemoResetHeaders(readBrowserDemoOperatorToken()),
        body: JSON.stringify({
          project_id: projectId,
          replay: true,
          requested_by: "monitoring"
        })
      });
      const payload = await response.json().catch(() => ({} as DeployResponse));
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Demo reset failed");
      }
      router.push(`/projects/${projectId}/review`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo reset failed");
    } finally {
      setResettingDemo(false);
    }
  }

  if (deployableCreatives.length === 0 && data.performance_snapshots.length === 0) {
    return (
      <EmptyState eyebrow="Monitoring" title="Approve at least one creative before deploy.">
        <p className="max-w-2xl text-sm leading-6 text-[var(--ink-3)]">
          The monitoring loop starts after reviewed creative variants become a simulated campaign package.
        </p>
      </EmptyState>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Activity aria-hidden="true" className="text-[var(--acid-2)]" size={18} />
              <h1 className="text-lg font-semibold text-[var(--ink)]">Monitoring</h1>
              <StatusBadge status={connection === "live" ? "available" : "current"}>
                {connection === "live" ? "Realtime live" : "Polling updates"}
              </StatusBadge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="available">{deployableCreatives.length} deployable creatives</StatusBadge>
              <StatusBadge status="available">{data.deployments.length} fake deploys</StatusBadge>
              <StatusBadge status="available">{latestSnapshots.length} KPI rows</StatusBadge>
            </div>
            <p className="text-sm font-medium text-[var(--warn)]">
              Simulated hackathon KPIs - not connected to an ad platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSeededDemo ? (
              <button
                className="btn btn-ghost btn-sm"
                disabled={resettingDemo}
                onClick={() => void resetDemo()}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                {resettingDemo ? "Resetting..." : "Reset demo"}
              </button>
            ) : null}
            <button
              className="btn btn-primary btn-sm"
              disabled={deploying || selectedDeployableIds.length === 0}
              onClick={() => void fakeDeploy()}
              type="button"
            >
              <Rocket aria-hidden="true" size={16} />
              {deploying ? "Deploying..." : "Fake deploy"}
            </button>
          </div>
        </div>
        {latestDeployment ? (
          <p className="mt-3 text-sm text-[var(--ink-3)]">
            Latest package deployed {formatDateTime(latestDeployment.deployed_at ?? latestDeployment.created_at)}.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-[var(--warn-line)] bg-[var(--warn-soft)] px-3 py-2 text-sm text-[var(--warn)]">
          {error}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">Deploy selection</h2>
            <p className="mt-1 text-sm text-[var(--ink-3)]">
              Approved and edited creatives are eligible. Pending and rejected variants stay out of the package.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => void refresh()}
            type="button"
          >
            <RotateCw aria-hidden="true" size={16} />
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),1fr))]">
          {deployableCreatives.map((creative) => {
            const adGroup = data.ad_groups.find((group) => group.id === creative.ad_group_id);
            const checked = selectedIds.includes(creative.id);
            return (
              <label
                className="flex min-h-28 items-start gap-3 rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3"
                key={creative.id}
              >
                <input
                  checked={checked}
                  className="mt-1 h-4 w-4 accent-[var(--acid)]"
                  onChange={(event) => {
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...new Set([...current, creative.id])]
                        : current.filter((id) => id !== creative.id)
                    );
                  }}
                  type="checkbox"
                />
                <span className="grid grid-cols-1 gap-1">
                  <span className="text-sm font-semibold text-[var(--ink)]">{creative.title}</span>
                  <span className="text-sm text-[var(--ink-2)]">{creative.description}</span>
                  <span className="flex flex-wrap gap-2 pt-1">
                    <StatusBadge status="available">{adGroup?.name ?? "Unknown group"}</StatusBadge>
                    <StatusBadge status="available">{creative.asset_url ? "Image ready" : "Prompt-only"}</StatusBadge>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <div className="kpi-grid">
        <KpiCard label="Impressions" value={integerFormat(stats.impressions)} />
        <KpiCard label="CTR" value={percentFormat(stats.ctr)} />
        <KpiCard label="CVR" value={percentFormat(stats.cvr)} />
        <KpiCard label="Spend" value={currencyFormat(stats.spend)} />
        <KpiCard label="Avg quality" value={stats.averageQuality ? String(stats.averageQuality) : "-"} />
      </div>

      <section className="grid gap-4 min-w-0 [grid-template-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr))]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="text-[var(--acid-2)]" size={18} />
            <h2 className="text-base font-semibold text-[var(--ink)]">CTR / CVR by creative</h2>
          </div>
          {latestSnapshots.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--line-3)] bg-[var(--bg-2)] px-3 py-4 text-sm text-[var(--ink-3)]">
              Fake deploy to generate simulated monitoring rows.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {latestSnapshots.map((snapshot) => {
                const creative = data.creative_variants.find((row) => row.id === snapshot.creative_variant_id);
                return (
                  <div className="grid grid-cols-1 gap-2" key={snapshot.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-[var(--ink)]">{creative?.title ?? "Creative"}</span>
                      <span className="text-[var(--ink-3)]">Q{snapshot.quality_score}</span>
                    </div>
                    <MetricBar label="CTR" tone="blue" value={Number(snapshot.ctr)} max={0.06} />
                    <MetricBar label="CVR" tone="green" value={Number(snapshot.cvr)} max={0.09} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--ink)]">{summary.headline}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-[var(--ink)]">What worked</dt>
              <dd className="mt-1 leading-6 text-[var(--ink-2)]">{summary.what_worked}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--ink)]">Blocked conversion</dt>
              <dd className="mt-1 leading-6 text-[var(--ink-2)]">{summary.what_blocked_conversion}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--ink)]">Pioneer signal</dt>
              <dd className="mt-1 leading-6 text-[var(--ink-2)]">{summary.pioneer_learning_signal}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">Simulated outcome rows</h2>
        </div>
        <div className="data-table-wrap">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--bg-2)] text-xs uppercase text-[var(--ink-3)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Ad group</th>
                <th className="px-4 py-3 font-semibold">Creative</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3 font-semibold">CTR</th>
                <th className="px-4 py-3 font-semibold">CVR</th>
                <th className="px-4 py-3 font-semibold">Insight</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {latestSnapshots.map((snapshot) => {
                const creative = data.creative_variants.find((row) => row.id === snapshot.creative_variant_id);
                const adGroup = data.ad_groups.find((row) => row.id === snapshot.ad_group_id);
                return (
                  <tr key={snapshot.id}>
                    <td className="px-4 py-3 text-[var(--ink)]">{adGroup?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{creative?.title ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-1 font-medium text-[var(--acid)]">
                        <Check aria-hidden="true" size={14} />
                        {snapshot.quality_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-2)]">{percentFormat(Number(snapshot.ctr))}</td>
                    <td className="px-4 py-3 text-[var(--ink-2)]">{percentFormat(Number(snapshot.cvr))}</td>
                    <td className="min-w-72 px-4 py-3 leading-6 text-[var(--ink-2)]">{snapshot.insight}</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{actionLabel(snapshot.recommended_action)}</td>
                  </tr>
                );
              })}
              {latestSnapshots.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-sm text-[var(--ink-3)]" colSpan={7}>
                    No simulated KPI rows for the latest fake deploy yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi-card">
      <p className="kpi-card-label">{label}</p>
      <p className="kpi-card-value">{value}</p>
    </div>
  );
}

function MetricBar({
  label,
  max,
  tone,
  value
}: {
  label: string;
  max: number;
  tone: "blue" | "green";
  value: number;
}) {
  const width = `${Math.min(100, Math.round((value / max) * 100))}%`;
  return (
    <div className="grid grid-cols-[3rem_1fr_4rem] items-center gap-2 text-xs text-[var(--ink-3)]">
      <span>{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <span
          className={`block h-full ${tone === "blue" ? "bg-[var(--acid-2)]" : "bg-[var(--acid)]"}`}
          style={{ width }}
        />
      </span>
      <span className="text-right tabular-nums">{percentFormat(value)}</span>
    </div>
  );
}

function isDeployableCreative(creative: CreativeVariant): boolean {
  return creative.status === "approved" && ["approved", "edited"].includes(creative.review_status);
}

function summarizeSnapshots(snapshots: PerformanceSnapshot[]) {
  const impressions = snapshots.reduce((total, snapshot) => total + Number(snapshot.impressions), 0);
  const clicks = snapshots.reduce((total, snapshot) => total + Number(snapshot.clicks), 0);
  const conversions = snapshots.reduce((total, snapshot) => total + Number(snapshot.conversions), 0);
  const spend = snapshots.reduce((total, snapshot) => total + Number(snapshot.spend), 0);
  const quality = snapshots.reduce((total, snapshot) => total + Number(snapshot.quality_score), 0);
  return {
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    cvr: clicks > 0 ? conversions / clicks : 0,
    spend,
    averageQuality: snapshots.length > 0 ? Math.round(quality / snapshots.length) : 0
  };
}

function dashboardSummary(payloadJson: unknown, snapshots: PerformanceSnapshot[]) {
  const payload = asRecord(payloadJson);
  const summary = asRecord(payload.monitoring_summary);
  return {
    headline: stringValue(summary.headline) || "Simulated KPIs are ready for review.",
    what_worked: stringValue(summary.what_worked) || bestSnapshotInsight(snapshots),
    what_blocked_conversion:
      stringValue(summary.what_blocked_conversion) ||
      "Review the lowest CVR rows for landing gaps, pricing clarity, or generic copy.",
    pioneer_learning_signal:
      stringValue(summary.pioneer_learning_signal) ||
      "These stored rows pair labels, review actions, creative choices, and outcome-like signals for a future Pioneer classifier."
  };
}

function bestSnapshotInsight(snapshots: PerformanceSnapshot[]): string {
  const best = [...snapshots].sort((a, b) => b.quality_score - a.quality_score)[0];
  return best?.insight ?? "Fake deploy approved creatives to generate the first simulated outcome rows.";
}

function upsertById<Row extends Record<string, unknown>>(rows: Row[], row: Row): Row[] {
  const index = rows.findIndex((item) => item.id === row.id);
  if (index === -1) return [row, ...rows];
  return rows.map((item, currentIndex) => (currentIndex === index ? { ...item, ...row } : item));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function percentFormat(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function integerFormat(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function currencyFormat(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function actionLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

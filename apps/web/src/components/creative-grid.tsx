"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Pencil,
  RotateCw,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react";

import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import type { ExtractionReviewData } from "@/lib/motive/extraction";
import type { ReviewActionResult } from "@/lib/motive/reviews";
import type { AdGroup, CreativeVariant, ReviewAction } from "@/lib/motive/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type CreativeTable = "extraction_runs" | "ad_groups" | "creative_variants" | "human_reviews";

type ReviewSubmitInput = {
  entityId: string;
  action: Extract<ReviewAction, "approve" | "edit" | "reject">;
  patch?: Record<string, unknown>;
  comment?: string | null;
  expectedUpdatedAt?: string | null;
};

export function CreativeGrid({ initialData }: { initialData: ExtractionReviewData }) {
  const [data, setData] = useState(initialData);
  const [connection, setConnection] = useState<"connecting" | "live" | "polling">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const projectId = initialData.project.id;

  const approvedAdGroups = useMemo(
    () => data.ad_groups.filter((group) =>
      group.review_status === "approved" && (group.status === "approved" || group.status === "creative_generated")
    ),
    [data.ad_groups]
  );
  const activeVariants = useMemo(
    () => data.creative_variants.filter((variant) => variant.status !== "rejected" && variant.status !== "archived"),
    [data.creative_variants]
  );
  const adGroupsNeedingVariants = useMemo(
    () => approvedAdGroups.filter((group) => !activeVariants.some((variant) => variant.ad_group_id === group.id)),
    [activeVariants, approvedAdGroups]
  );
  const visibleAdGroups = useMemo(() => {
    const withVariants = new Set(data.creative_variants.map((variant) => variant.ad_group_id));
    return data.ad_groups.filter((group) => approvedAdGroups.includes(group) || withVariants.has(group.id));
  }, [approvedAdGroups, data.ad_groups, data.creative_variants]);
  const demoMode = useMemo(
    () => data.sources.some((source) => source.metadata.demo === true || source.metadata.is_seeded_demo === true),
    [data.sources]
  );
  const creativeTextRun = [...data.extraction_runs].reverse().find((run) => run.phase === "creative_text");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/projects/${projectId}/review-data`, {
      cache: "no-store",
      signal
    });
    if (!response.ok) throw new Error("Creative refresh failed");
    setData(await response.json());
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    const interval = setInterval(() => {
      refresh(controller.signal).catch((caught) => {
        if (!controller.signal.aborted) {
          setConnection("polling");
          setError(caught instanceof Error ? caught.message : "Creative refresh failed");
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
    const merge = (table: CreativeTable, row: unknown) => {
      if (!row || typeof row !== "object" || !("id" in row)) return;
      setData((current) => ({
        ...current,
        [table]: upsertById(current[table] as Array<Record<string, unknown>>, row as Record<string, unknown>)
      }));
    };

    const channel = supabase
      .channel(`motive-creatives-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "extraction_runs", filter: `project_id=eq.${projectId}` }, (payload) => merge("extraction_runs", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_groups", filter: `project_id=eq.${projectId}` }, (payload) => merge("ad_groups", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "creative_variants", filter: `project_id=eq.${projectId}` }, (payload) => merge("creative_variants", payload.new))
      .on("postgres_changes", { event: "*", schema: "public", table: "human_reviews", filter: `project_id=eq.${projectId}` }, (payload) => merge("human_reviews", payload.new))
      .subscribe((status) => {
        setConnection(status === "SUBSCRIBED" ? "live" : "polling");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  async function generateCreatives(adGroupIds: string[], regenerate = false) {
    setGenerating(regenerate ? adGroupIds[0] ?? "regenerate" : "all");
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/creatives`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          ad_group_ids: adGroupIds,
          variant_count: 1,
          generate_assets: true,
          regenerate,
          demoMode
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Creative generation failed");
      }
      await refresh();
      setAnnouncement("Creatives generated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creative generation failed");
    } finally {
      setGenerating(null);
    }
  }

  async function submitReview(input: ReviewSubmitInput) {
    const actionKey = `creative_variant:${input.entityId}:${input.action}`;
    setPendingAction(actionKey);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entityType: "creative_variant",
          entityId: input.entityId,
          action: input.action,
          patch: input.patch ?? {},
          comment: input.comment ?? null,
          expectedUpdatedAt: input.expectedUpdatedAt ?? null
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : String(payload.error ?? "Review action failed"));
      }
      setData((current) => mergeReviewResult(current, payload as ReviewActionResult));
      setAnnouncement(`${input.action} saved.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review action failed");
      throw caught;
    } finally {
      setPendingAction(null);
    }
  }

  if (approvedAdGroups.length === 0 && data.creative_variants.length === 0) {
    return (
      <EmptyState eyebrow="Creatives" title="Approve an ad group first.">
        <p className="max-w-2xl text-sm leading-6 text-[#66706b]">
          Creative generation uses approved ad groups plus their linked conversations,
          proof points, landing gaps, and product feed rows.
        </p>
      </EmptyState>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-[#d9dfd8] bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles aria-hidden="true" className="text-[#195b8f]" size={18} />
              <h1 className="text-lg font-semibold text-[#17201c]">Creative variants</h1>
              <StatusBadge status={connection === "live" ? "available" : "current"}>
                {connection === "live" ? "Realtime live" : "Polling updates"}
              </StatusBadge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="available">{approvedAdGroups.length} approved ad groups</StatusBadge>
              <StatusBadge status="available">{data.creative_variants.length} variants</StatusBadge>
              <StatusBadge status="available">
                {data.creative_variants.filter((variant) => variant.asset_generation_status === "ready").length} assets ready
              </StatusBadge>
              {creativeTextRun ? (
                <StatusBadge status={creativeTextRun.status === "failed" ? "failed" : "available"}>
                  creative_text {creativeTextRun.status}
                </StatusBadge>
              ) : null}
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={adGroupsNeedingVariants.length === 0 || generating !== null}
            onClick={() => void generateCreatives(adGroupsNeedingVariants.map((group) => group.id))}
            type="button"
          >
            <WandSparkles aria-hidden="true" size={16} />
            {generating === "all" ? "Generating..." : "Generate missing"}
          </button>
        </div>
        {adGroupsNeedingVariants.length === 0 ? (
          <p className="mt-3 text-sm text-[#66706b]">
            Every approved ad group has an active creative. Regenerate from an individual group for another variant.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-[#efc0bd] bg-[#fff0ee] px-3 py-2 text-sm text-[#a3382f]">
          {error}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <div className="grid gap-4">
        {visibleAdGroups.map((group) => {
          const variants = data.creative_variants.filter((variant) => variant.ad_group_id === group.id);
          return (
            <section className="grid gap-3 rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-sm" key={group.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#17201c]">{group.name}</h2>
                    <StatusBadge status={reviewBadgeStatus(group.review_status)}>{group.review_status}</StatusBadge>
                    <StatusBadge status="available">{group.status}</StatusBadge>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-[#3f4944]">{group.rationale}</p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-[#d9dfd8] px-3 py-2 text-sm font-medium text-[#17201c] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={generating !== null}
                  onClick={() => void generateCreatives([group.id], true)}
                  type="button"
                >
                  <RotateCw aria-hidden="true" size={16} />
                  {generating === group.id ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#cbd5c8] px-3 py-4 text-sm text-[#66706b]">
                  No creative variants yet for this ad group.
                </p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {variants.map((variant) => (
                    <CreativeCard
                      adGroup={group}
                      key={variant.id}
                      onReview={submitReview}
                      pendingAction={pendingAction}
                      variant={variant}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function CreativeCard({
  adGroup,
  onReview,
  pendingAction,
  variant
}: {
  adGroup: AdGroup;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
  variant: CreativeVariant;
}) {
  const [editing, setEditing] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [draft, setDraft] = useState(() => creativeDraft(variant));
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = pendingAction?.startsWith(`creative_variant:${variant.id}:`) ?? false;
  const renderableAssetUrl = variant.asset_url && !imageFailed && isRenderableAssetUrl(variant.asset_url)
    ? variant.asset_url
    : null;

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submitDirect(action: Extract<ReviewAction, "approve" | "reject">) {
    setLocalError(null);
    try {
      await onReview({
        entityId: variant.id,
        action,
        expectedUpdatedAt: variant.updated_at
      });
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Review action failed");
    }
  }

  async function submitEdit() {
    setLocalError(null);
    try {
      await onReview({
        entityId: variant.id,
        action: "edit",
        patch: {
          title: draft.title,
          description: draft.description,
          creative_angle: draft.creative_angle,
          asset_prompt: draft.asset_prompt || null,
          target_url: draft.target_url
        },
        comment: "Edited creative variant.",
        expectedUpdatedAt: variant.updated_at
      });
      setEditing(false);
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Review action failed");
    }
  }

  async function copyPrompt() {
    if (!variant.asset_prompt) return;
    await navigator.clipboard.writeText(variant.asset_prompt);
  }

  return (
    <article className={cardClass(variant)}>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase text-[#66706b]">{adGroup.name}</p>
            <h3 className="mt-1 text-base font-semibold text-[#17201c]">{variant.title}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={reviewBadgeStatus(variant.review_status)}>{variant.review_status}</StatusBadge>
            <StatusBadge status={assetBadgeStatus(variant.asset_generation_status)}>
              {assetLabel(variant)}
            </StatusBadge>
          </div>
        </div>

        <div className="aspect-square overflow-hidden rounded-md border border-[#d9dfd8] bg-[#f6f8f3]">
          {renderableAssetUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} src={renderableAssetUrl} />
          ) : (
            <div className="flex h-full flex-col justify-between gap-4 p-4">
              <ImageIcon aria-hidden="true" className="text-[#195b8f]" size={24} />
              <p className="line-clamp-6 text-sm leading-6 text-[#3f4944]">
                {variant.asset_prompt ?? "No prompt stored for this creative."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <p className="text-sm leading-6 text-[#3f4944]">{variant.description}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="available">{variant.creative_angle}</StatusBadge>
            <StatusBadge status="available">{variant.openai_ad_type}</StatusBadge>
            <StatusBadge status="current">{variant.openai_ad_status}</StatusBadge>
          </div>
          {variant.error ? (
            <p className="rounded-md border border-[#efc0bd] bg-[#fff0ee] px-2 py-1 text-xs text-[#a3382f]">
              {variant.error}
            </p>
          ) : null}
        </div>

        {editing ? (
          <div className="grid gap-3 rounded-md border border-[#d9dfd8] bg-white p-3">
            <CreativeInput label="Title" maxLength={50} onChange={(value) => updateDraft("title", value)} value={draft.title} />
            <CreativeInput label="Description" maxLength={100} onChange={(value) => updateDraft("description", value)} value={draft.description} />
            <CreativeInput label="Angle" onChange={(value) => updateDraft("creative_angle", value)} value={draft.creative_angle} />
            <CreativeInput label="Target URL" onChange={(value) => updateDraft("target_url", value)} value={draft.target_url} />
            <label className="grid gap-1 text-xs font-semibold uppercase text-[#66706b]">
              Asset prompt
              <textarea
                className="min-h-24 rounded-md border border-[#d9dfd8] px-3 py-2 text-sm normal-case text-[#17201c] outline-none focus:border-[#195b8f]"
                onChange={(event) => updateDraft("asset_prompt", event.target.value)}
                value={draft.asset_prompt}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} icon={<Check size={14} />} label="Save" onClick={() => void submitEdit()} />
              <ActionButton disabled={busy} icon={<X size={14} />} label="Cancel" onClick={() => setEditing(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0e8] pt-3">
          <a className="max-w-full truncate text-xs text-[#195b8f] underline-offset-2 hover:underline" href={variant.target_url ?? "#"}>
            {variant.target_url ?? "Missing target URL"}
          </a>
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled={busy} icon={<Check size={14} />} label="Approve" onClick={() => void submitDirect("approve")} />
            <ActionButton disabled={busy} icon={<Pencil size={14} />} label="Edit" onClick={() => {
              setDraft(creativeDraft(variant));
              setEditing((current) => !current);
            }} />
            <ActionButton disabled={!variant.asset_prompt} icon={<Copy size={14} />} label="Prompt" onClick={() => void copyPrompt()} />
            <ActionButton disabled={busy} icon={<X size={14} />} label="Reject" onClick={() => void submitDirect("reject")} />
          </div>
        </div>
        {localError ? (
          <p className="text-xs text-[#a3382f]">{localError}</p>
        ) : null}
      </div>
    </article>
  );
}

function CreativeInput({
  label,
  maxLength,
  onChange,
  value
}: {
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase text-[#66706b]">
      {label}
      <input
        className="rounded-md border border-[#d9dfd8] px-3 py-2 text-sm normal-case text-[#17201c] outline-none focus:border-[#195b8f]"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onClick
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-[#d9dfd8] px-2.5 py-1.5 text-xs font-medium text-[#17201c] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function mergeReviewResult(current: ExtractionReviewData, result: ReviewActionResult): ExtractionReviewData {
  const table = result.entity_type === "creative_variant" ? "creative_variants" : null;
  if (!table) return current;
  return {
    ...current,
    [table]: upsertById(
      current[table] as unknown as Array<Record<string, unknown>>,
      result.entity
    ) as unknown as ExtractionReviewData[typeof table],
    human_reviews: upsertById(
      current.human_reviews as unknown as Array<Record<string, unknown>>,
      result.human_review as unknown as Record<string, unknown>
    ) as unknown as ExtractionReviewData["human_reviews"]
  };
}

function upsertById<T extends Record<string, unknown>>(rows: T[], row: T): T[] {
  const index = rows.findIndex((item) => item.id === row.id);
  if (index === -1) return [row, ...rows];
  return rows.map((item, itemIndex) => itemIndex === index ? { ...item, ...row } : item);
}

function creativeDraft(variant: CreativeVariant) {
  return {
    title: variant.title,
    description: variant.description,
    creative_angle: variant.creative_angle,
    asset_prompt: variant.asset_prompt ?? "",
    target_url: variant.target_url ?? ""
  };
}

function cardClass(variant: CreativeVariant): string {
  const base = "rounded-md border p-3";
  if (variant.review_status === "rejected" || variant.status === "rejected") {
    return `${base} border-[#efc0bd] bg-[#fff7f5] opacity-75`;
  }
  if (variant.review_status === "approved" || variant.status === "approved") {
    return `${base} border-[#b8d8bd] bg-[#f6fbf4]`;
  }
  return `${base} border-[#d9dfd8] bg-[#fbfcf8]`;
}

function reviewBadgeStatus(status: string) {
  if (status === "approved") return "available" as const;
  if (status === "rejected") return "failed" as const;
  if (status === "edited" || status === "enriched") return "complete" as const;
  return "current" as const;
}

function assetBadgeStatus(status: CreativeVariant["asset_generation_status"]) {
  if (status === "ready") return "available" as const;
  if (status === "failed") return "failed" as const;
  if (status === "pending") return "current" as const;
  return "blocked" as const;
}

function assetLabel(variant: CreativeVariant): string {
  if (variant.asset_generation_status === "ready") return "fal.ai asset";
  if (variant.asset_generation_status === "failed") return "asset failed";
  if (variant.asset_generation_status === "pending") return "asset pending";
  return variant.asset_type === "none" ? "asset skipped" : "prompt only";
}

function isRenderableAssetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return !url.hostname.endsWith(".example");
  } catch {
    return false;
  }
}

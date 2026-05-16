"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, CheckCheck, CheckCircle2, Layers3, Pencil, RefreshCw, Sparkles, WandSparkles, X } from "lucide-react";

import { ExtractionPhaseRail } from "./extraction-phase-rail";
import { SourceStatusPanel } from "./source-status-panel";
import { StatusBadge } from "./status-badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ExtractionReviewData } from "@/lib/motive/extraction";
import type { ProjectWorkspace } from "@/lib/motive/projects";
import type { ReviewActionResult, ReviewableEntityType } from "@/lib/motive/reviews";
import type { ReviewAction } from "@/lib/motive/types";

type ReviewTable =
  | "extraction_runs"
  | "brand_features"
  | "conversations"
  | "landing_gaps"
  | "campaigns"
  | "ad_groups"
  | "creative_variants"
  | "human_reviews";

type ReviewSubmitInput = {
  entityType: ReviewableEntityType;
  entityId: string;
  action: ReviewAction;
  patch?: Record<string, unknown>;
  comment?: string | null;
  expectedUpdatedAt?: string | null;
};

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
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [generatingAdGroups, setGeneratingAdGroups] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
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
  const bulkApprovalTargets = useMemo(() => {
    const targets: ReviewSubmitInput[] = [];
    const hasApprovedReview = (entityType: ReviewableEntityType, entityId: string) => data.human_reviews.some(
      (review) => review.entity_type === entityType && review.entity_id === entityId && review.action === "approve"
    );

    if (sourceRecap?.status === "succeeded" && !hasApprovedReview("extraction_run", sourceRecap.id)) {
      targets.push({
        entityType: "extraction_run",
        entityId: sourceRecap.id,
        action: "approve",
        expectedUpdatedAt: sourceRecap.updated_at
      });
    }

    data.brand_features
      .filter((row) => isBulkApprovable(row.review_status))
      .forEach((row) => targets.push({
        entityType: "brand_feature",
        entityId: row.id,
        action: "approve",
        expectedUpdatedAt: row.updated_at
      }));
    data.conversations
      .filter((row) => isBulkApprovable(row.review_status))
      .forEach((row) => targets.push({
        entityType: "conversation",
        entityId: row.id,
        action: "approve",
        expectedUpdatedAt: row.updated_at
      }));
    data.landing_gaps
      .filter((row) => isBulkApprovable(row.review_status))
      .forEach((row) => targets.push({
        entityType: "landing_gap",
        entityId: row.id,
        action: "approve",
        expectedUpdatedAt: row.updated_at
      }));
    data.ad_groups
      .filter((row) => isBulkApprovable(row.review_status))
      .forEach((row) => targets.push({
        entityType: "ad_group",
        entityId: row.id,
        action: "approve",
        expectedUpdatedAt: row.updated_at
      }));

    return targets;
  }, [data.ad_groups, data.brand_features, data.conversations, data.human_reviews, data.landing_gaps, sourceRecap]);
  const phaseCounts = useMemo(() => ({
    source_recap: sourceRecap?.status === "succeeded" ? 1 : 0,
    feature_map: data.brand_features.length,
    conversation_map: data.conversations.length,
    intent_classification: data.conversations.filter((row) => row.stage && row.intent_type).length,
    landing_gaps: data.landing_gaps.length,
    ad_groups: data.ad_groups.length,
    creative_text: data.creative_variants.length,
    monitoring_synthesis: 0
  }), [
    data.ad_groups.length,
    data.brand_features.length,
    data.conversations,
    data.creative_variants.length,
    data.landing_gaps.length,
    sourceRecap?.status
  ]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `project_id=eq.${projectId}` }, (payload) => merge("campaigns", payload.new))
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

  const submitReview = useCallback(async (input: ReviewSubmitInput) => {
    const actionKey = `${input.entityType}:${input.entityId}:${input.action}`;
    setPendingAction(actionKey);
    setReviewError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          requestId: crypto.randomUUID(),
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
      setAnnouncement(`${humanizeAction(input.action)} saved.`);
    } catch (caught) {
      setReviewError(caught instanceof Error ? caught.message : "Review action failed");
      throw caught;
    } finally {
      setPendingAction(null);
    }
  }, [projectId]);

  async function approveAll() {
    setApprovingAll(true);
    setReviewError(null);
    try {
      let approvedCount = 0;
      for (const target of bulkApprovalTargets) {
        await submitReview(target);
        approvedCount += 1;
      }
      await refresh();
      setAnnouncement(`Approved ${approvedCount} review rows.`);
    } catch (caught) {
      setReviewError(caught instanceof Error ? caught.message : "Approve all failed");
    } finally {
      setApprovingAll(false);
    }
  }

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

  async function generateAdGroups() {
    setGeneratingAdGroups(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/ad-groups/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          demoMode
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.message === "string" ? payload.message : "Ad-group generation failed");
      }
      await refresh();
      setAnnouncement("Ad groups generated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ad-group generation failed");
    } finally {
      setGeneratingAdGroups(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ExtractionPhaseRail counts={phaseCounts} runs={data.extraction_runs} />
      <div className="grid gap-4">
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {connection === "live" ? (
              <CheckCircle2 aria-hidden="true" className="text-[var(--acid)]" size={16} />
            ) : (
              <RefreshCw aria-hidden="true" className="text-[var(--acid-2)]" size={16} />
            )}
            <span className="text-sm font-medium text-[var(--ink)]">
              {connection === "live" ? "Realtime live" : "Polling updates"}
            </span>
            <span className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-3)]">
              {data.human_reviews.length} review events
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#2c7a4b] bg-[#2c7a4b] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={approvingAll || bulkApprovalTargets.length === 0}
              onClick={() => void approveAll()}
              type="button"
            >
              <CheckCheck aria-hidden="true" size={16} />
              {approvingAll ? "Approving..." : `Approve all${bulkApprovalTargets.length > 0 ? ` (${bulkApprovalTargets.length})` : ""}`}
            </button>
            {failedRun ? (
            <button
              className="btn btn-primary btn-sm"
              disabled={retrying || usableSourceIds.length === 0}
              onClick={retryExtraction}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              {retrying ? "Queueing..." : "Retry extraction"}
            </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="error-callout">
            {error}
          </p>
        ) : null}
        {reviewError ? (
          <p className="error-callout">
            {reviewError}
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">{announcement}</p>

        <SourceStatusPanel initialWorkspace={initialWorkspace} />
        <SourceRecapPanel onReview={submitReview} pendingAction={pendingAction} run={sourceRecap} />
        <FeaturePanel data={data} onReview={submitReview} pendingAction={pendingAction} />
        <ConversationPanel data={data} onReview={submitReview} pendingAction={pendingAction} />
        <LandingGapPanel data={data} onReview={submitReview} pendingAction={pendingAction} />
        <AdGroupPanel
          data={data}
          generating={generatingAdGroups}
          onGenerate={generateAdGroups}
          onReview={submitReview}
          pendingAction={pendingAction}
        />
      </div>
    </section>
  );
}

function SourceRecapPanel({
  onReview,
  pendingAction,
  run
}: {
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
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
      <p className="text-sm leading-6 text-[var(--ink-2)]">
        {String(output.one_sentence_offer ?? "The recap will summarize offer, ICP, proof, constraints, and source quality.")}
      </p>
      {output.positioning_summary ? (
        <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">{String(output.positioning_summary)}</p>
      ) : null}
      {quality.coverage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status="available">Coverage: {String(quality.coverage)}</StatusBadge>
          {Array.isArray(quality.missing_context)
            ? quality.missing_context.slice(0, 3).map((item) => (
                <span className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-3)]" key={String(item)}>
                  Missing: {String(item)}
                </span>
              ))
            : null}
        </div>
      ) : null}
      {run ? (
        <ReviewActionControls
          buildPatch={(draft) => ({
            output_json: {
              ...output,
              brand_name: draft.brand_name,
              one_sentence_offer: draft.one_sentence_offer,
              positioning_summary: draft.positioning_summary
            }
          })}
          entityId={run.id}
          entityType="extraction_run"
          fields={[
            { name: "brand_name", label: "Brand", type: "text" },
            { name: "one_sentence_offer", label: "Offer", type: "textarea" },
            { name: "positioning_summary", label: "Positioning", type: "textarea" }
          ]}
          initialValues={{
            brand_name: String(output.brand_name ?? ""),
            one_sentence_offer: String(output.one_sentence_offer ?? ""),
            positioning_summary: String(output.positioning_summary ?? "")
          }}
          onReview={onReview}
          pendingAction={pendingAction}
          statusLabel="recap"
          updatedAt={run.updated_at}
        />
      ) : null}
    </Panel>
  );
}

function FeaturePanel({
  data,
  onReview,
  pendingAction
}: {
  data: ExtractionReviewData;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
}) {
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
          <article className={rowCardClass(feature.review_status)} key={feature.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{feature.title}</h3>
              <div className="flex items-center gap-2">
                <StatusBadge status="available">{feature.type}</StatusBadge>
                <StatusBadge status={reviewBadgeStatus(feature.review_status)}>{feature.review_status}</StatusBadge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{feature.description}</p>
            {feature.evidence ? (
              <p className="mt-2 text-xs text-[var(--ink-3)]">{feature.evidence}</p>
            ) : null}
            <ReviewActionControls
              buildPatch={(draft) => ({
                type: draft.type,
                title: draft.title,
                description: draft.description,
                evidence: draft.evidence || null
              })}
              entityId={feature.id}
              entityType="brand_feature"
              fields={[
                { name: "type", label: "Type", type: "select", options: featureTypeOptions },
                { name: "title", label: "Title", type: "text" },
                { name: "description", label: "Description", type: "textarea" },
                { name: "evidence", label: "Evidence", type: "textarea" }
              ]}
              initialValues={{
                type: feature.type,
                title: feature.title,
                description: feature.description,
                evidence: feature.evidence ?? ""
              }}
              onReview={onReview}
              pendingAction={pendingAction}
              statusLabel={feature.review_status}
              updatedAt={feature.updated_at}
            />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ConversationPanel({
  data,
  onReview,
  pendingAction
}: {
  data: ExtractionReviewData;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
}) {
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
          <thead className="text-xs uppercase text-[var(--ink-3)]">
            <tr>
              <th className="border-b border-[var(--line)] py-2 pr-3 font-semibold">Conversation</th>
              <th className="border-b border-[var(--line)] px-3 py-2 font-semibold">Stage</th>
              <th className="border-b border-[var(--line)] px-3 py-2 font-semibold">Intent</th>
              <th className="border-b border-[var(--line)] px-3 py-2 font-semibold">Buyer</th>
              <th className="border-b border-[var(--line)] pl-3 py-2 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            {data.conversations.map((conversation) => (
              <tr className={conversation.review_status === "rejected" ? "opacity-60" : ""} key={conversation.id}>
                <td className="max-w-xl border-b border-[var(--line)] py-3 pr-3 text-[var(--ink)]">{conversation.text}</td>
                <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--ink-2)]">{conversation.stage || "intent pending"}</td>
                <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--ink-2)]">{conversation.intent_type || "intent pending"}</td>
                <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--ink-2)]">{conversation.buyer_role ?? "unknown"}</td>
                <td className="min-w-[260px] border-b border-[var(--line)] pl-3 py-3">
                  <ReviewActionControls
                    buildPatch={(draft) => ({
                      text: draft.text,
                      stage: draft.stage,
                      intent_type: draft.intent_type,
                      buyer_role: draft.buyer_role
                    })}
                    entityId={conversation.id}
                    entityType="conversation"
                    fields={[
                      { name: "text", label: "Conversation", type: "textarea" },
                      { name: "stage", label: "Stage", type: "select", options: stageOptions },
                      { name: "intent_type", label: "Intent", type: "select", options: intentOptions },
                      { name: "buyer_role", label: "Buyer", type: "select", options: buyerRoleOptions }
                    ]}
                    initialValues={{
                      text: conversation.text,
                      stage: conversation.stage || "problem_aware",
                      intent_type: conversation.intent_type || "workflow_pain",
                      buyer_role: conversation.buyer_role ?? "unknown"
                    }}
                    onReview={onReview}
                    pendingAction={pendingAction}
                    statusLabel={conversation.review_status}
                    updatedAt={conversation.updated_at}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LandingGapPanel({
  data,
  onReview,
  pendingAction
}: {
  data: ExtractionReviewData;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
}) {
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
          <article className={rowCardClass(gap.review_status)} key={gap.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{gap.gap_type}</h3>
              <div className="flex items-center gap-2">
                <StatusBadge status={gap.severity >= 5 ? "failed" : "current"}>Severity {gap.severity}</StatusBadge>
                <StatusBadge status={reviewBadgeStatus(gap.review_status)}>{gap.review_status}</StatusBadge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{gap.description}</p>
            <p className="mt-2 text-xs text-[var(--ink-3)]">{gap.suggested_fix}</p>
            <ReviewActionControls
              buildPatch={(draft) => ({
                gap_type: draft.gap_type,
                description: draft.description,
                suggested_fix: draft.suggested_fix,
                severity: Number(draft.severity || gap.severity)
              })}
              entityId={gap.id}
              entityType="landing_gap"
              fields={[
                { name: "gap_type", label: "Gap type", type: "select", options: gapTypeOptions },
                { name: "description", label: "Description", type: "textarea" },
                { name: "suggested_fix", label: "Suggested fix", type: "textarea" },
                { name: "severity", label: "Severity", type: "number" }
              ]}
              initialValues={{
                gap_type: gap.gap_type,
                description: gap.description,
                suggested_fix: gap.suggested_fix,
                severity: String(gap.severity)
              }}
              onReview={onReview}
              pendingAction={pendingAction}
              statusLabel={gap.review_status}
              updatedAt={gap.updated_at}
            />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AdGroupPanel({
  data,
  generating,
  onGenerate,
  onReview,
  pendingAction
}: {
  data: ExtractionReviewData;
  generating: boolean;
  onGenerate: () => Promise<void>;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
}) {
  const approvedConversations = data.conversations.filter((row) => row.review_status === "approved");
  const approvedFeatures = data.brand_features.filter((row) => row.review_status === "approved");
  const approvedGaps = data.landing_gaps.filter((row) => row.review_status === "approved");
  const latestCampaign = data.campaigns[data.campaigns.length - 1];
  const canGenerate = approvedConversations.length >= 2 && !generating;

  return (
    <Panel
      count={data.ad_groups.length}
      eyebrow="Ad groups"
      icon={<Sparkles aria-hidden="true" size={16} />}
      status={phaseStatus(data, "ad_groups")}
      title="Campaign structure"
    >
      <div className="mb-4 grid gap-3 rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={approvedConversations.length >= 2 ? "available" : "current"}>
              {approvedConversations.length} approved conversations
            </StatusBadge>
            <StatusBadge status="available">{approvedFeatures.length} approved facts</StatusBadge>
            <StatusBadge status="available">{approvedGaps.length} approved gaps</StatusBadge>
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={!canGenerate}
            onClick={() => void onGenerate()}
            type="button"
          >
            <WandSparkles aria-hidden="true" size={16} />
            {generating ? "Generating..." : "Generate ad groups"}
          </button>
        </div>
        {approvedConversations.length < 2 ? (
          <p className="text-sm text-[var(--ink-3)]">
            Approve at least two conversation rows to generate canonical OpenAI Ads ad groups.
          </p>
        ) : null}
        {latestCampaign ? (
          <div className="grid gap-1 border-t border-[var(--line)] pt-3 text-sm text-[var(--ink-2)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--ink)]">{latestCampaign.name}</span>
              <StatusBadge status="available">{latestCampaign.objective}</StatusBadge>
              <StatusBadge status={reviewBadgeStatus(latestCampaign.review_status)}>{latestCampaign.review_status}</StatusBadge>
            </div>
            <p>{latestCampaign.custom_instruction ?? "Campaign instructions will appear after generation."}</p>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {data.ad_groups.map((group) => (
          <article className={rowCardClass(group.review_status)} key={group.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">{group.name}</h3>
              <div className="flex items-center gap-2">
                <StatusBadge status="available">{group.status}</StatusBadge>
                <StatusBadge status={reviewBadgeStatus(group.review_status)}>{group.review_status}</StatusBadge>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{group.rationale}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.context_hints.slice(0, 4).map((hint) => (
                <span className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-3)]" key={hint}>
                  {hint}
                </span>
              ))}
            </div>
            {group.conversation_ids.length > 0 ? (
              <div className="mt-3 grid gap-2 text-xs text-[var(--ink-3)]">
                {group.conversation_ids.slice(0, 3).map((conversationId) => {
                  const conversation = data.conversations.find((row) => row.id === conversationId);
                  return conversation ? (
                    <p className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1" key={conversationId}>
                      {conversation.text}
                    </p>
                  ) : null;
                })}
              </div>
            ) : null}
            <ReviewActionControls
              buildPatch={(draft) => ({
                name: draft.name,
                rationale: draft.rationale,
                context_hints: splitLines(draft.context_hints)
              })}
              entityId={group.id}
              entityType="ad_group"
              fields={[
                { name: "name", label: "Name", type: "text" },
                { name: "rationale", label: "Rationale", type: "textarea" },
                { name: "context_hints", label: "Context hints", type: "textarea" }
              ]}
              initialValues={{
                name: group.name,
                rationale: group.rationale,
                context_hints: group.context_hints.join("\n")
              }}
              onReview={onReview}
              pendingAction={pendingAction}
              statusLabel={group.review_status}
              updatedAt={group.updated_at}
            />
          </article>
        ))}
      </div>
    </Panel>
  );
}

type ReviewField = {
  name: string;
  label: string;
  type: "number" | "select" | "text" | "textarea";
  options?: readonly string[];
};

function ReviewActionControls({
  buildPatch,
  entityId,
  entityType,
  fields,
  initialValues,
  onReview,
  pendingAction,
  statusLabel,
  updatedAt
}: {
  buildPatch: (draft: Record<string, string>) => Record<string, unknown>;
  entityId: string;
  entityType: ReviewableEntityType;
  fields: ReviewField[];
  initialValues: Record<string, string>;
  onReview: (input: ReviewSubmitInput) => Promise<void>;
  pendingAction: string | null;
  statusLabel: string;
  updatedAt: string;
}) {
  const [mode, setMode] = useState<"edit" | "enrich" | null>(null);
  const [draft, setDraft] = useState(initialValues);
  const [comment, setComment] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = pendingAction?.startsWith(`${entityType}:${entityId}:`) ?? false;

  async function submitDirect(action: Extract<ReviewAction, "approve" | "reject">) {
    setLocalError(null);
    try {
      await onReview({ entityType, entityId, action, expectedUpdatedAt: updatedAt });
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Review action failed");
    }
  }

  async function submitDraft() {
    if (!mode) return;
    setLocalError(null);
    try {
      await onReview({
        entityType,
        entityId,
        action: mode,
        patch: buildPatch(draft),
        comment: comment || null,
        expectedUpdatedAt: updatedAt
      });
      setMode(null);
      setComment("");
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : "Review action failed");
    }
  }

  function toggleMode(nextMode: "edit" | "enrich") {
    if (mode === nextMode) {
      setMode(null);
      return;
    }
    setDraft(initialValues);
    setComment("");
    setMode(nextMode);
  }

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={reviewBadgeStatus(statusLabel)}>{statusLabel}</StatusBadge>
        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={busy} icon={<Check size={14} />} label="Approve" onClick={() => void submitDirect("approve")} />
          <ActionButton disabled={busy} icon={<Pencil size={14} />} label="Edit" onClick={() => toggleMode("edit")} />
          <ActionButton disabled={busy} icon={<X size={14} />} label="Reject" onClick={() => void submitDirect("reject")} />
          <ActionButton disabled={busy} icon={<WandSparkles size={14} />} label="Enrich" onClick={() => toggleMode("enrich")} />
        </div>
      </div>
      {localError ? (
        <p className="mt-2 text-xs text-[var(--warn)]">{localError}</p>
      ) : null}
      {mode ? (
        <div className="mt-3 card-inset grid gap-3">
          {fields.map((field) => (
            <label className="field-label grid gap-1" key={field.name}>
              {field.label}
              <ReviewInput
                field={field}
                onChange={(value) => setDraft((current) => ({ ...current, [field.name]: value }))}
                value={draft[field.name] ?? ""}
              />
            </label>
          ))}
          <label className="field-label grid gap-1">
            Review note
            <textarea
              className="textarea min-h-16 normal-case"
              onChange={(event) => setComment(event.target.value)}
              placeholder={mode === "enrich" ? "What should be made sharper?" : "Optional audit note"}
              value={comment}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMode(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => void submitDraft()}
              type="button"
            >
              {busy ? "Saving..." : mode === "enrich" ? "Save enrich" : "Save edit"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewInput({
  field,
  onChange,
  value
}: {
  field: ReviewField;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputClass = "input normal-case";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${inputClass} min-h-20`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={inputClass}
      min={field.type === "number" ? 1 : undefined}
      max={field.type === "number" ? 5 : undefined}
      onChange={(event) => onChange(event.target.value)}
      type={field.type}
      value={value}
    />
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onClick
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
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
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--acid)]">
            {icon}
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">{title}</h2>
        </div>
        <StatusBadge status={badgeStatus(status)}>
          {count > 0 ? `${count} rows` : status.replaceAll("_", " ")}
        </StatusBadge>
      </div>
      {count > 0 || status === "succeeded" ? (
        children
      ) : (
        <p className="text-sm text-[var(--ink-3)]">Waiting for this phase.</p>
      )}
    </section>
  );
}

function phaseStatus(data: ExtractionReviewData, phase: string) {
  return data.extraction_runs.find((run) => run.phase === phase)?.status ?? "queued";
}

function mergeReviewResult(data: ExtractionReviewData, result: ReviewActionResult): ExtractionReviewData {
  const table = reviewTableForEntity(result.entity_type);
  return {
    ...data,
    [table]: upsertById(data[table] as Array<Record<string, unknown>>, result.entity),
    human_reviews: upsertById(data.human_reviews as Array<Record<string, unknown>>, result.human_review).sort(
      (left, right) => String(right.created_at).localeCompare(String(left.created_at))
    ) as ExtractionReviewData["human_reviews"]
  };
}

function reviewTableForEntity(entityType: ReviewableEntityType): Exclude<ReviewTable, "human_reviews"> {
  if (entityType === "extraction_run") return "extraction_runs";
  if (entityType === "brand_feature") return "brand_features";
  if (entityType === "conversation") return "conversations";
  if (entityType === "landing_gap") return "landing_gaps";
  if (entityType === "creative_variant") return "creative_variants";
  return "ad_groups";
}

function badgeStatus(status: string) {
  if (status === "succeeded") return "complete";
  if (status === "running") return "current";
  if (status === "failed") return "failed";
  return "available";
}

function reviewBadgeStatus(status: string) {
  if (status === "approved") return "complete";
  if (status === "rejected") return "failed";
  if (status === "edited" || status === "enriched") return "current";
  return "available";
}

function isBulkApprovable(status: string) {
  return status !== "approved" && status !== "rejected";
}

function rowCardClass(status: string) {
  const base = "rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3";
  return status === "rejected" ? `${base} opacity-60` : base;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function humanizeAction(action: ReviewAction) {
  if (action === "approve") return "Approval";
  if (action === "reject") return "Rejection";
  if (action === "enrich") return "Enrichment";
  return "Edit";
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

const featureTypeOptions = ["feature", "value_prop", "usp", "use_case", "proof_point", "objection"] as const;
const stageOptions = ["problem_aware", "solution_compare", "vendor_evaluation", "pricing_check", "security_review", "ready_to_buy", "post_purchase"] as const;
const intentOptions = ["workflow_pain", "migration_risk", "proof_request", "budget_validation", "trust_check", "integration_check", "urgency_timeline", "competitive_switch"] as const;
const buyerRoleOptions = ["founder", "revenue_lead", "marketing_lead", "customer_success", "operations", "security", "finance", "unknown"] as const;
const gapTypeOptions = ["proof", "comparison", "setup_path", "pricing_clarity", "trust_compliance", "integration_depth", "security", "performance", "other"] as const;

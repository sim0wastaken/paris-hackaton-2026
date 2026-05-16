"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon, Sparkles } from "lucide-react";

import { MAX_EXTRA_CONTEXT_CHARS, normalizeBrandUrl } from "@/lib/motive/projects";

export function IntakeWorkbench() {
  const router = useRouter();
  const [brandUrl, setBrandUrl] = useState("");
  const [context, setContext] = useState("");
  const [productFeed, setProductFeed] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openingDemo, setOpeningDemo] = useState(false);
  const canSubmit = useMemo(() => {
    try {
      normalizeBrandUrl(brandUrl);
      return context.length <= MAX_EXTRA_CONTEXT_CHARS;
    } catch {
      return false;
    }
  }, [brandUrl, context.length]);

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setError(null);

        try {
          const response = await fetch("/api/projects", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              brand_url: brandUrl,
              extra_context: context,
              product_feed_sample: productFeed,
              demo_mode: demoMode
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.message ?? payload.error ?? "Project intake failed");
          }
          router.push(payload.redirect_url);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Project intake failed");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label className="field">
        <span className="field-label">Brand URL</span>
        <span className="field-control">
          <LinkIcon
            aria-hidden="true"
            className="field-icon"
            size={17}
          />
          <input
            className="input has-icon"
            onChange={(event) => setBrandUrl(event.target.value)}
            placeholder="example.com"
            type="text"
            value={brandUrl}
          />
        </span>
      </label>

      <label className="field">
        <span className="field-label">
          Optional context
        </span>
        <textarea
          className="textarea min-h-36"
          onChange={(event) => setContext(event.target.value)}
          placeholder="Paste product notes, positioning, markdown, or audience constraints."
          value={context}
        />
      </label>

      <label className="field">
        <span className="field-label">
          Product feed sample
        </span>
        <textarea
          className="textarea min-h-24 font-mono text-xs leading-5"
          onChange={(event) => setProductFeed(event.target.value)}
          placeholder="id,title,price"
          value={productFeed}
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-[var(--ink-2)]">
        <span className="switch">
          <input
            checked={demoMode}
            onChange={(event) => setDemoMode(event.target.checked)}
            type="checkbox"
          />
          <span className="switch-slider" />
        </span>
        <span>Seed demo source</span>
      </label>

      <div className="rounded-md border border-[#d9dfd8] bg-[#f6f8f5] p-3">
        <button
          className="inline-flex items-center gap-2 rounded-md border border-[#195b8f] bg-white px-3 py-2 text-sm font-medium text-[#195b8f] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={openingDemo || submitting}
          onClick={async () => {
            setOpeningDemo(true);
            setError(null);
            try {
              const response = await fetch("/api/demo/reset", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  replay: true,
                  requested_by: "intake"
                })
              });
              const payload = await response.json();
              if (!response.ok) {
                throw new Error(payload.message ?? payload.error ?? "Demo reset failed");
              }
              router.push(`/projects/${payload.project_id}/review`);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Demo reset failed");
            } finally {
              setOpeningDemo(false);
            }
          }}
          type="button"
        >
          <Sparkles aria-hidden="true" size={16} />
          {openingDemo ? "Opening..." : "Use demo project"}
        </button>
      </div>

      {error ? (
        <p className="error-callout">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t-caption">
          {context.length > 0 ? `${context.length} context characters` : "No context added"}
        </p>
        <button
          className="btn btn-primary"
          disabled={!canSubmit || submitting}
          type="submit"
        >
          {submitting ? "Creating..." : "Open workspace"}
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    </form>
  );
}

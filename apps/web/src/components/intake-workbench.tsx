"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon } from "lucide-react";

import { MAX_EXTRA_CONTEXT_CHARS, normalizeBrandUrl } from "@/lib/motive/projects";

export function IntakeWorkbench() {
  const router = useRouter();
  const [brandUrl, setBrandUrl] = useState("");
  const [context, setContext] = useState("");
  const [productFeed, setProductFeed] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      className="grid gap-4"
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
      <label className="grid gap-2">
        <span className="text-sm font-medium text-[#17201c]">Brand URL</span>
        <span className="relative">
          <LinkIcon
            aria-hidden="true"
            className="absolute left-3 top-3 text-[#66706b]"
            size={17}
          />
          <input
            className="h-11 w-full rounded-md border border-[#cfd7cf] bg-[#fbfcf8] pl-10 pr-3 text-sm outline-none focus:border-[#195b8f] focus:ring-2 focus:ring-[#195b8f]/15"
            onChange={(event) => setBrandUrl(event.target.value)}
            placeholder="example.com"
            type="text"
            value={brandUrl}
          />
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[#17201c]">
          Optional context
        </span>
        <textarea
          className="min-h-36 resize-y rounded-md border border-[#cfd7cf] bg-[#fbfcf8] p-3 text-sm leading-6 outline-none focus:border-[#195b8f] focus:ring-2 focus:ring-[#195b8f]/15"
          onChange={(event) => setContext(event.target.value)}
          placeholder="Paste product notes, positioning, markdown, or audience constraints."
          value={context}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[#17201c]">
          Product feed sample
        </span>
        <textarea
          className="min-h-24 resize-y rounded-md border border-[#cfd7cf] bg-[#fbfcf8] p-3 font-mono text-xs leading-5 outline-none focus:border-[#195b8f] focus:ring-2 focus:ring-[#195b8f]/15"
          onChange={(event) => setProductFeed(event.target.value)}
          placeholder="id,title,price"
          value={productFeed}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-[#17201c]">
        <input
          checked={demoMode}
          className="h-4 w-4 rounded border-[#cfd7cf]"
          onChange={(event) => setDemoMode(event.target.checked)}
          type="checkbox"
        />
        Seed demo source
      </label>

      {error ? (
        <p className="rounded-md border border-[#efc0bd] bg-[#fff0ee] px-3 py-2 text-sm text-[#a3382f]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#66706b]">
          {context.length > 0 ? `${context.length} context characters` : "No context added"}
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:border-[#cfd7cf] disabled:bg-[#e5e9e2] disabled:text-[#66706b]"
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

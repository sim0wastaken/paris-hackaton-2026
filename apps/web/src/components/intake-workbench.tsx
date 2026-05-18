"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon, Sparkles } from "lucide-react";

import {
  Button,
  Callout,
  Cluster,
  Input,
  Switch,
  Text,
  Textarea,
} from "@motive/ds/primitives";

import { buildDemoResetHeaders, readBrowserDemoOperatorToken } from "@/lib/motive/demo-reset-client";
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
      className="grid grid-cols-1 gap-5"
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
          <LinkIcon aria-hidden="true" className="field-icon" size={17} />
          <Input
            hasIcon
            onChange={(event) => setBrandUrl(event.target.value)}
            placeholder="example.com"
            type="text"
            value={brandUrl}
          />
        </span>
      </label>

      <label className="field">
        <span className="field-label">Optional context</span>
        <Textarea
          className="min-h-36"
          onChange={(event) => setContext(event.target.value)}
          placeholder="Paste product notes, positioning, markdown, or audience constraints."
          value={context}
        />
      </label>

      <label className="field">
        <span className="field-label">Product feed sample</span>
        <Textarea
          className="min-h-24 font-mono text-xs leading-5"
          onChange={(event) => setProductFeed(event.target.value)}
          placeholder="id,title,price"
          value={productFeed}
        />
      </label>

      <Switch
        isSelected={demoMode}
        label="Seed demo source"
        onChange={setDemoMode}
      />

      <Callout>
        <Button
          disabled={openingDemo || submitting}
          iconLeft={<Sparkles aria-hidden="true" size={16} />}
          loading={openingDemo}
          onClick={async () => {
            setOpeningDemo(true);
            setError(null);
            try {
              const response = await fetch("/api/demo/reset", {
                method: "POST",
                headers: buildDemoResetHeaders(readBrowserDemoOperatorToken()),
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
          size="sm"
          type="button"
          variant="ghost"
        >
          {openingDemo ? "Opening…" : "Use demo project"}
        </Button>
      </Callout>

      {error ? <p className="error-callout">{error}</p> : null}

      <Cluster justify="between" wrap>
        <Text variant="caption">
          {context.length > 0 ? `${context.length} context characters` : "No context added"}
        </Text>
        <Button
          disabled={!canSubmit || submitting}
          iconRight={<ArrowRight aria-hidden="true" size={16} />}
          loading={submitting}
          type="submit"
        >
          {submitting ? "Creating…" : "Open workspace"}
        </Button>
      </Cluster>
    </form>
  );
}

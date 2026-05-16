"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon } from "lucide-react";

export function IntakeWorkbench() {
  const router = useRouter();
  const [brandUrl, setBrandUrl] = useState("");
  const [context, setContext] = useState("");
  const canSubmit = useMemo(() => {
    try {
      const parsed = new URL(brandUrl);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, [brandUrl]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          router.push(`/projects/demo-project?source=${encodeURIComponent(brandUrl)}`);
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
            placeholder="https://example.com"
            type="url"
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#66706b]">
          {context.length > 0 ? `${context.length} context characters` : "No context added"}
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:border-[#cfd7cf] disabled:bg-[#e5e9e2] disabled:text-[#66706b]"
          disabled={!canSubmit}
          type="submit"
        >
          Open workspace
          <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
    </form>
  );
}

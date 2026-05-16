"use client";

import { RotateCcw } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <EmptyState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[#17201c] bg-[#17201c] px-3 py-2 text-sm font-medium text-white"
            onClick={reset}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Retry
          </button>
        }
        eyebrow="Runtime error"
        title="The workbench could not render this view."
      >
        <p className="text-sm text-[#66706b]">{error.message}</p>
      </EmptyState>
    </main>
  );
}

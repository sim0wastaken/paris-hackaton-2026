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
    <main className="app-main max-w-4xl">
      <EmptyState
        action={
          <button
            className="btn btn-primary"
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
        <p className="text-sm text-[var(--ink-3)]">{error.message}</p>
      </EmptyState>
    </main>
  );
}

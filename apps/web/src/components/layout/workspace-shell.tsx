"use client";

import * as React from "react";
import { cn } from "@motive/ds";

export interface WorkspaceShellProps {
  /** Left rail content (collapsible/sticky on desktop). */
  rail?: React.ReactNode;
  /** Right aside content. */
  aside?: React.ReactNode;
  /** Wider master/explorer column. Use rail OR explorer, not both. */
  explorer?: React.ReactNode;
  /** Side to place the rail/explorer on (default left). */
  railPlacement?: "left" | "right";
  children?: React.ReactNode;
  className?: string;
  /** Label for the rail accordion on mobile (default: "Details"). */
  railLabel?: string;
  /** Label for the aside accordion on mobile (default: "More"). */
  asideLabel?: string;
}

/**
 * WorkspaceShell — three-column workspace that collapses to a single
 * stacked column under container width 64rem. Rail/aside become inline
 * sections on mobile (no <Accordion> coupling — sections render inline so
 * scroll position is preserved when the layout flips).
 */
export function WorkspaceShell({
  rail,
  aside,
  explorer,
  railPlacement = "left",
  children,
  className,
  railLabel = "Details",
  asideLabel = "More",
}: WorkspaceShellProps) {
  const main = (
    <div className="workspace-split-main" role="region">
      {children}
    </div>
  );

  const railNode = rail ?? explorer;
  const variantClass = explorer ? "with-explorer" : rail ? "with-rail" : aside ? "with-aside" : "";

  return (
    <div className={cn("workspace-split", variantClass, className)}>
      {railNode && railPlacement === "left" ? (
        <section
          className="workspace-split-rail"
          aria-label={explorer ? "Projects" : railLabel}
        >
          {railNode}
        </section>
      ) : null}
      {main}
      {railNode && railPlacement === "right" ? (
        <section
          className="workspace-split-rail"
          aria-label={explorer ? "Projects" : railLabel}
        >
          {railNode}
        </section>
      ) : null}
      {aside ? (
        <section className="workspace-split-aside" aria-label={asideLabel}>
          {aside}
        </section>
      ) : null}
    </div>
  );
}

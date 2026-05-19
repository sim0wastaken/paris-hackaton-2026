"use client";

import * as React from "react";
import { cn } from "@motive/ds";

export interface StickyActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable mobile stickiness — render inline at all widths. */
  inline?: boolean;
}

/**
 * StickyActionBar — inline on desktop, stickied to viewport bottom on phones
 * with safe-area inset padding. The mobile sticky behavior triggers inside a
 * container query (set on a parent element with container-type: inline-size).
 */
export const StickyActionBar = React.forwardRef<HTMLDivElement, StickyActionBarProps>(
  ({ inline, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-sticky-mobile={inline ? undefined : ""}
      className={cn("sticky-actions", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
StickyActionBar.displayName = "StickyActionBar";

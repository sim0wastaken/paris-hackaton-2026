"use client";

import * as React from "react";
import {
  Dialog as RACDialog,
  DialogTrigger as RACDialogTrigger,
  OverlayArrow as RACArrow,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from "react-aria-components";
import { cn } from "../cn";

export const PopoverTrigger = RACDialogTrigger;

export interface PopoverProps
  extends Omit<RACPopoverProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
  /** Render a dialog-role wrapper inside (RAC requires it for focus management). */
  asDialog?: boolean;
  arrow?: boolean;
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  ({ className, children, asDialog = true, arrow = false, ...props }, ref) => (
    <RACPopover
      ref={ref}
      className={cn("motive-popover", className)}
      offset={10}
      {...props}
    >
      {arrow ? (
        <RACArrow>
          <svg width={14} height={8} viewBox="0 0 14 8">
            <path
              d="M0 0 L7 8 L14 0 Z"
              fill="var(--surface)"
              stroke="var(--line-3)"
              strokeWidth={1}
            />
          </svg>
        </RACArrow>
      ) : null}
      {asDialog ? <RACDialog className="outline-none">{children}</RACDialog> : children}
    </RACPopover>
  ),
);
Popover.displayName = "Popover";

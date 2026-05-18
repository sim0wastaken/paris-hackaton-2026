"use client";

import * as React from "react";
import {
  Tooltip as RACTooltip,
  TooltipTrigger as RACTooltipTrigger,
  type TooltipProps as RACTooltipProps,
  type TooltipTriggerComponentProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface TooltipTriggerProps extends TooltipTriggerComponentProps {
  /** Defaults to 350ms which feels responsive but non-twitchy. */
  delay?: number;
  /** ms to keep the tooltip open after the trigger loses focus. */
  closeDelay?: number;
}

export const TooltipTrigger = ({ delay = 350, closeDelay = 80, ...rest }: TooltipTriggerProps) => (
  <RACTooltipTrigger delay={delay} closeDelay={closeDelay} {...rest} />
);

export interface TooltipProps extends Omit<RACTooltipProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, children, offset = 8, ...props }, ref) => (
    <RACTooltip
      ref={ref}
      offset={offset}
      className={cn("motive-tooltip", className)}
      {...props}
    >
      {children}
    </RACTooltip>
  ),
);
Tooltip.displayName = "Tooltip";

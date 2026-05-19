import * as React from "react";
import { cn } from "../cn";

type BadgeTone = "neutral" | "acid" | "cyan" | "warn" | "success" | "info";
type BadgeSize = "xs" | "sm";

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  acid: "badge-acid",
  cyan: "badge-cyan",
  warn: "badge-warn",
  success: "badge-cyan",
  info: "badge-cyan",
};

const sizeClass: Record<BadgeSize, string> = {
  xs: "badge-xs",
  sm: "",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = "neutral", size = "sm", leading, trailing, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("badge", toneClass[tone], sizeClass[size], className)}
      {...props}
    >
      {leading ? <span className="badge-leading">{leading}</span> : null}
      {children}
      {trailing ? <span className="badge-trailing">{trailing}</span> : null}
    </span>
  ),
);
Badge.displayName = "Badge";

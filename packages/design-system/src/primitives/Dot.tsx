import * as React from "react";
import { cn } from "../cn";

type Tone = "acid" | "cyan" | "warn" | "muted";

const toneClass: Record<Tone, string> = {
  acid: "",
  cyan: "dot-cyan",
  warn: "dot-warn",
  muted: "dot-muted",
};

export interface DotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  pulse?: boolean;
}

export const Dot = React.forwardRef<HTMLSpanElement, DotProps>(
  ({ tone = "acid", pulse = false, className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("dot", toneClass[tone], pulse && "pulse", className)}
      {...props}
    />
  ),
);
Dot.displayName = "Dot";

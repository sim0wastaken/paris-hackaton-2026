import * as React from "react";
import { cn } from "../cn";

type Tone = "neutral" | "success" | "warn";

const toneClass: Record<Tone, string> = {
  neutral: "callout",
  success: "callout callout-success",
  warn: "callout callout-warn",
};

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ tone = "neutral", className, ...props }, ref) => (
    <div ref={ref} className={cn(toneClass[tone], className)} {...props} />
  ),
);
Callout.displayName = "Callout";

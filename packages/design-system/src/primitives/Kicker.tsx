import * as React from "react";
import { cn } from "../cn";

type Tone = "acid" | "muted";
type As = "p" | "span" | "div";

export interface KickerProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  as?: As;
}

export const Kicker = React.forwardRef<HTMLElement, KickerProps>(
  ({ tone = "acid", as = "span", className, ...props }, ref) => {
    const Tag = as as As;
    return React.createElement(Tag, {
      ref,
      className: cn("kicker", tone === "muted" && "kicker-muted", className),
      ...props,
    });
  },
);
Kicker.displayName = "Kicker";

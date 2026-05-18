import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";
import { Dot } from "./Dot";

type Tone = "neutral" | "acid" | "cyan" | "warn" | "solid" | "outline";

const toneClass: Record<Tone, string> = {
  neutral: "tag",
  acid: "tag tag-acid",
  cyan: "tag tag-cyan",
  warn: "tag tag-warn",
  solid: "tag tag-solid",
  outline: "tag tag-outline",
};

const dotToneFor = (tone: Tone): "acid" | "cyan" | "warn" | "muted" => {
  if (tone === "cyan") return "cyan";
  if (tone === "warn") return "warn";
  if (tone === "outline" || tone === "neutral") return "muted";
  return "acid";
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean | "pulse";
  asChild?: boolean;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ tone = "neutral", dot, asChild, className, children, ...props }, ref) => {
    const classes = cn(toneClass[tone], className);

    // asChild + Slot requires a single React element child — skip the dot in that mode.
    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children as React.ReactElement}
        </Slot>
      );
    }

    return (
      <span ref={ref} className={classes} {...props}>
        {dot ? <Dot tone={dotToneFor(tone)} pulse={dot === "pulse"} /> : null}
        {children}
      </span>
    );
  },
);
Tag.displayName = "Tag";

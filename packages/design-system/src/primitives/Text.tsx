import * as React from "react";
import { cn } from "../cn";

type Variant = "body" | "lede" | "small" | "caption" | "mono";
type Tone = "default" | "muted" | "subtle" | "acid" | "cyan" | "warn";
type As = "p" | "span" | "div";

const variantClass: Record<Variant, string> = {
  body: "",
  lede: "t-lede",
  small: "t-small",
  caption: "t-caption",
  mono: "t-mono",
};

const toneClass: Record<Tone, string> = {
  default: "text-[var(--ink)]",
  muted: "text-[var(--ink-3)]",
  subtle: "text-[var(--ink-4)]",
  acid: "text-[var(--acid)]",
  cyan: "text-[var(--acid-2)]",
  warn: "text-[var(--warn)]",
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: Variant;
  tone?: Tone;
  as?: As;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ variant = "body", tone, as = "p", className, ...props }, ref) => {
    const Tag = as as As;
    return React.createElement(Tag, {
      ref,
      className: cn(variantClass[variant], tone && toneClass[tone], className),
      ...props,
    });
  },
);
Text.displayName = "Text";

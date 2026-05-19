import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";

type Variant = "default" | "feature" | "inset" | "elevated" | "glass" | "gradient";
type As = "section" | "article" | "div" | "aside";

const variantClass: Record<Variant, string> = {
  default: "card",
  feature: "card-feature",
  inset: "card-inset",
  elevated: "card-elevated",
  glass: "card-glass",
  gradient: "card-gradient",
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: Variant;
  as?: As;
  padding?: "default" | "none";
  interactive?: boolean;
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      variant = "default",
      as = "div",
      padding = "default",
      interactive,
      asChild,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : (as as As);
    return React.createElement(Comp as React.ElementType, {
      ref,
      className: cn(
        variantClass[variant],
        padding === "none" && "card-padless",
        interactive && "card-interactive",
        className,
      ),
      ...props,
    });
  },
);
Card.displayName = "Card";

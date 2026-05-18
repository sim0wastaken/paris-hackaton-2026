import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";

type Variant = "default" | "feature" | "inset";
type As = "section" | "article" | "div" | "aside";

const variantClass: Record<Variant, string> = {
  default: "card",
  feature: "card-feature",
  inset: "card-inset",
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: Variant;
  as?: As;
  padding?: "default" | "none";
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    { variant = "default", as = "div", padding = "default", asChild, className, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : (as as As);
    return React.createElement(Comp as React.ElementType, {
      ref,
      className: cn(variantClass[variant], padding === "none" && "card-padless", className),
      ...props,
    });
  },
);
Card.displayName = "Card";

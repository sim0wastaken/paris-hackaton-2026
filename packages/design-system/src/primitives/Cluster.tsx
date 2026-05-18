import * as React from "react";
import { cn } from "../cn";
import { tokens, type SpaceToken } from "../tokens";

type Align = "start" | "center" | "end" | "baseline" | "stretch";
type Justify = "start" | "center" | "end" | "between" | "around";

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  as?: React.ElementType;
}

const alignClass: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const justifyClass: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  (
    { gap = 3, align = "center", justify, wrap, as: Tag = "div", className, style, ...props },
    ref,
  ) => (
    <Tag
      ref={ref}
      className={cn(
        "flex",
        wrap && "flex-wrap",
        alignClass[align],
        justify && justifyClass[justify],
        className,
      )}
      style={{ gap: tokens.space[gap as keyof typeof tokens.space], ...style }}
      {...props}
    />
  ),
);
Cluster.displayName = "Cluster";

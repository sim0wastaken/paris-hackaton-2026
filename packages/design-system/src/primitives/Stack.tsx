import * as React from "react";
import { cn } from "../cn";
import { tokens, type SpaceToken } from "../tokens";

type Align = "start" | "center" | "end" | "stretch";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken;
  align?: Align;
  as?: React.ElementType;
}

const alignClass: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap = 4, align, as: Tag = "div", className, style, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("flex flex-col", align && alignClass[align], className)}
      style={{ gap: tokens.space[gap as keyof typeof tokens.space], ...style }}
      {...props}
    />
  ),
);
Stack.displayName = "Stack";

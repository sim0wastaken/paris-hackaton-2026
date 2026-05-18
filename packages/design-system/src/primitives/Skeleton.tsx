import * as React from "react";
import { cn } from "../cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tailwind sizing strings (e.g. "h-4 w-24"). */
  className?: string;
  /** `circle` flips radius to full + makes width = height when only one is set. */
  shape?: "rect" | "circle";
  /** Inline width/height shorthand. */
  width?: number | string;
  height?: number | string;
}

export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ className, shape = "rect", width, height, style, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("motive-skeleton", shape === "circle" && "rounded-full", className)}
      style={{ width, height, ...style }}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

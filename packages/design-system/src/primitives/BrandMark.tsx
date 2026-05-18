import * as React from "react";
import { cn } from "../cn";

type Size = "default" | "sm";

export interface BrandMarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: Size;
}

export const BrandMark = React.forwardRef<HTMLSpanElement, BrandMarkProps>(
  ({ size = "default", className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("brand-mark", size === "sm" && "brand-mark-sm", className)}
      {...props}
    />
  ),
);
BrandMark.displayName = "BrandMark";

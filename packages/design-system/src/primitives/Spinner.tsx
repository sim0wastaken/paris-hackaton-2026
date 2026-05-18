import * as React from "react";
import { cn } from "../cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "lg";
  label?: string;
}

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "sm", label, ...props }, ref) => (
    <span
      ref={ref}
      role={label ? "status" : undefined}
      aria-label={label}
      className={cn("motive-spinner", size === "lg" && "motive-spinner-lg", className)}
      {...props}
    />
  ),
);
Spinner.displayName = "Spinner";

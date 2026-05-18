"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./Button";
import { cn } from "../cn";

export interface IconButtonProps extends Omit<ButtonProps, "shape" | "iconLeft" | "iconRight"> {
  /** Required visible-tooltip / screen-reader label — icon-only buttons need a name. */
  "aria-label": string;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => (
    <Button ref={ref} shape="icon" className={cn(className)} {...props}>
      {icon}
    </Button>
  ),
);
IconButton.displayName = "IconButton";

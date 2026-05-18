"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ProgressBar as RACProgressBar,
  Label as RACLabel,
  type ProgressBarProps as RACProgressBarProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface ProgressProps extends Omit<RACProgressBarProps, "className" | "children"> {
  label?: React.ReactNode;
  className?: string;
  showValue?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ label, className, showValue = true, value, isIndeterminate, ...props }, ref) => (
    <RACProgressBar
      ref={ref}
      value={value}
      isIndeterminate={isIndeterminate}
      className={cn("motive-progress", className)}
      data-indeterminate={isIndeterminate || undefined}
      {...props}
    >
      {({ percentage, valueText }) => (
        <>
          {(label || showValue) && (
            <div className="motive-progress-meta">
              {label ? <RACLabel className="motive-progress-label">{label}</RACLabel> : <span />}
              {showValue ? <span>{isIndeterminate ? "…" : valueText}</span> : null}
            </div>
          )}
          <div className="motive-progress-track">
            <motion.span
              className="motive-progress-fill"
              initial={false}
              animate={{ width: isIndeterminate ? "38%" : `${percentage ?? 0}%` }}
              transition={{ type: "spring", stiffness: 220, damping: 32, mass: 0.8 }}
              style={{ display: "block" }}
            />
          </div>
        </>
      )}
    </RACProgressBar>
  ),
);
Progress.displayName = "Progress";

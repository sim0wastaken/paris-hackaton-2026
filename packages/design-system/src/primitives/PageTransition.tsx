"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../cn";

export interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Key that triggers the transition; defaults to children identity. */
  transitionKey?: React.Key;
}

/**
 * PageTransition — gentle fade + scale enter for top-of-page content.
 * Respects prefers-reduced-motion via motion's useReducedMotion hook.
 */
export const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, transitionKey, ...props }, ref) => {
    const reduce = useReducedMotion();
    return (
      <motion.div
        ref={ref}
        key={transitionKey}
        initial={reduce ? false : { opacity: 0, scale: 0.99, y: 4 }}
        animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={cn(className)}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </motion.div>
    );
  },
);
PageTransition.displayName = "PageTransition";

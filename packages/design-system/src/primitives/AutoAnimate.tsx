"use client";

import * as React from "react";
import autoAnimate, { type AutoAnimateOptions } from "@formkit/auto-animate";
import { cn } from "../cn";

export interface AutoAnimateProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements;
  duration?: number;
  easing?: string;
  options?: Partial<AutoAnimateOptions>;
  children?: React.ReactNode;
}

/**
 * AutoAnimate — drop-in container that smoothly animates child add/remove/move.
 * Built on @formkit/auto-animate; FLIP transitions at near-zero perf cost.
 */
export const AutoAnimate = React.forwardRef<HTMLElement, AutoAnimateProps>(
  ({ as = "div", duration = 280, easing, options, className, children, ...props }, ref) => {
    const localRef = React.useRef<HTMLElement | null>(null);

    React.useImperativeHandle(ref, () => localRef.current as HTMLElement);

    React.useEffect(() => {
      if (!localRef.current) return;
      const animateOptions: Partial<AutoAnimateOptions> = {
        duration,
        easing: easing ?? "cubic-bezier(0.2, 0.7, 0.2, 1)",
        ...options,
      };
      const ctl = autoAnimate(localRef.current, animateOptions);
      return () => {
        ctl?.destroy?.();
      };
    }, [duration, easing, options]);

    return React.createElement(
      as as string,
      {
        ref: (node: HTMLElement | null) => {
          localRef.current = node;
        },
        className: cn(className),
        ...props,
      },
      children,
    );
  },
);
AutoAnimate.displayName = "AutoAnimate";

/** Hook for callers who want to attach auto-animate to an existing ref. */
export function useAutoAnimate<T extends HTMLElement>(
  options?: Partial<AutoAnimateOptions>,
): React.RefObject<T | null> {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    const ctl = autoAnimate(ref.current, {
      duration: 280,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      ...options,
    });
    return () => ctl?.destroy?.();
  }, [options]);
  return ref;
}

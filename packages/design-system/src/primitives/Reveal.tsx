"use client";

import * as React from "react";
import { motion, useInView, type HTMLMotionProps, type Transition } from "motion/react";

export interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "ref"> {
  /** ms delay before this element animates. */
  delay?: number;
  /** Re-runs every time the element enters viewport (default: false → once only). */
  repeat?: boolean;
  /** Distance to translate from along Y (px). */
  distance?: number;
  /** Override the spring. */
  transition?: Transition;
  /** Animate immediately on mount and skip the viewport observer. */
  immediate?: boolean;
  children?: React.ReactNode;
}

/**
 * Reveal — fade + translate + blur in when the element enters the viewport.
 * Degrades gracefully: if the document is hidden (background tab, headless
 * runner) the entry animation is skipped so content is never stuck invisible.
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(
  (
    { delay = 0, repeat = false, distance = 14, transition, immediate, children, style, ...props },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
    const inView = useInView(innerRef, { once: !repeat, amount: 0 });

    // If the tab can't animate (hidden), render the end state immediately.
    const [skipAnimation, setSkipAnimation] = React.useState(false);
    React.useEffect(() => {
      const check = () => setSkipAnimation(document.hidden);
      check();
      document.addEventListener("visibilitychange", check);
      return () => document.removeEventListener("visibilitychange", check);
    }, []);

    const visible = immediate || inView || skipAnimation;

    return (
      <motion.div
        ref={innerRef}
        initial={
          skipAnimation
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: distance, filter: "blur(6px)" }
        }
        animate={
          visible
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: distance, filter: "blur(6px)" }
        }
        transition={
          skipAnimation
            ? { duration: 0 }
            : transition ?? { duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: delay / 1000 }
        }
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Reveal.displayName = "Reveal";

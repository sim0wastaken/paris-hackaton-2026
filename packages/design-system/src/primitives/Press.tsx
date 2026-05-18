"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "motion/react";

export interface PressProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Scale factor on press (default 0.97). */
  scale?: number;
  /** Disables the spring physics (still scales via CSS). */
  noSpring?: boolean;
  /** Adds a subtle hover lift. */
  hoverLift?: boolean;
  children?: React.ReactNode;
}

/**
 * Press — wrap any element in spring-physics tap feedback. Use for non-button
 * interactive surfaces (cards, list rows, tiles). For real buttons, use the
 * Button primitive which already handles RAC press states.
 */
export const Press = React.forwardRef<HTMLDivElement, PressProps>(
  ({ scale = 0.97, noSpring, hoverLift, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileTap={{ scale }}
      whileHover={hoverLift ? { y: -2 } : undefined}
      transition={
        noSpring
          ? { duration: 0.15, ease: [0.5, 0, 0, 1.2] }
          : { type: "spring", stiffness: 500, damping: 28, mass: 0.6 }
      }
      style={{ display: "inline-block", ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  ),
);
Press.displayName = "Press";

export interface MagneticProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Strength of the pull toward cursor (0-1). */
  strength?: number;
  /** Disable on touch — magnetic feels weird without a real cursor. */
  disableOnTouch?: boolean;
  children?: React.ReactNode;
}

/**
 * Magnetic — pulls content toward the cursor on hover. Best on hero CTAs and
 * single-focus icon buttons. Subtle by default (strength = 0.25).
 */
export const Magnetic = React.forwardRef<HTMLDivElement, MagneticProps>(
  ({ strength = 0.25, disableOnTouch = true, children, style, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.6 });
    const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.6 });

    return (
      <motion.div
        ref={localRef}
        onPointerMove={(event) => {
          if (disableOnTouch && event.pointerType === "touch") return;
          const target = localRef.current;
          if (!target) return;
          const rect = target.getBoundingClientRect();
          const px = event.clientX - rect.left - rect.width / 2;
          const py = event.clientY - rect.top - rect.height / 2;
          x.set(px * strength);
          y.set(py * strength);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
        style={{ x: sx, y: sy, display: "inline-flex", ...style }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Magnetic.displayName = "Magnetic";

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

/* ─── Skeleton variants ───────────────────────────────────────────────── */

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render. */
  lines?: number;
  /** Width of the last line (defaults to 60%). */
  lastWidth?: string;
}

export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, lastWidth = "60%", className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("flex flex-col gap-[var(--s-2)]", className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? lastWidth : "100%"}
          style={{ borderRadius: "var(--r-xs)" }}
        />
      ))}
    </div>
  ),
);
SkeletonText.displayName = "SkeletonText";

export interface SkeletonHeadingProps extends React.HTMLAttributes<HTMLSpanElement> {
  level?: 1 | 2 | 3 | 4;
}

const headingSizes: Record<NonNullable<SkeletonHeadingProps["level"]>, [number, string]> = {
  1: [44, "70%"],
  2: [32, "60%"],
  3: [24, "55%"],
  4: [20, "45%"],
};

export const SkeletonHeading = React.forwardRef<HTMLSpanElement, SkeletonHeadingProps>(
  ({ level = 2, className, style, ...props }, ref) => {
    const [h, w] = headingSizes[level];
    return (
      <Skeleton
        ref={ref}
        height={h}
        width={w}
        style={{ borderRadius: "var(--r-sm)", ...style }}
        className={className}
        {...props}
      />
    );
  },
);
SkeletonHeading.displayName = "SkeletonHeading";

export interface SkeletonButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const buttonHeights: Record<NonNullable<SkeletonButtonProps["size"]>, number> = {
  sm: 36,
  md: 42,
  lg: 48,
};

export const SkeletonButton = React.forwardRef<HTMLSpanElement, SkeletonButtonProps>(
  ({ size = "md", fullWidth, className, style, ...props }, ref) => (
    <Skeleton
      ref={ref}
      height={buttonHeights[size]}
      width={fullWidth ? "100%" : 140}
      style={{ borderRadius: "var(--r-pill)", ...style }}
      className={className}
      {...props}
    />
  ),
);
SkeletonButton.displayName = "SkeletonButton";

export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const avatarSizes: Record<NonNullable<SkeletonAvatarProps["size"]>, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
};

export const SkeletonAvatar = React.forwardRef<HTMLSpanElement, SkeletonAvatarProps>(
  ({ size = "md", className, ...props }, ref) => (
    <Skeleton
      ref={ref}
      shape="circle"
      height={avatarSizes[size]}
      width={avatarSizes[size]}
      className={className}
      {...props}
    />
  ),
);
SkeletonAvatar.displayName = "SkeletonAvatar";

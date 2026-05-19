"use client";

import * as React from "react";
import { cn } from "../cn";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClass: Record<AvatarSize, string> = {
  xs: "avatar-xs",
  sm: "avatar-sm",
  md: "",
  lg: "avatar-lg",
  xl: "avatar-xl",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  name?: string;
  fallback?: React.ReactNode;
}

function initialsOf(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] : "")).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ size = "md", src, alt, name, fallback, className, ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    const showImage = src && !errored;
    return (
      <span ref={ref} className={cn("avatar", sizeClass[size], className)} {...props}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? name ?? ""}
            onError={() => setErrored(true)}
            className="avatar-img"
          />
        ) : (
          <span className="avatar-fallback" aria-hidden={!name}>
            {fallback ?? initialsOf(name)}
          </span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max, className, children, ...props }, ref) => {
    const kids = React.Children.toArray(children);
    const shown = typeof max === "number" ? kids.slice(0, max) : kids;
    const overflow = typeof max === "number" ? kids.length - max : 0;
    return (
      <div ref={ref} className={cn("avatar-group", className)} {...props}>
        {shown}
        {overflow > 0 ? (
          <span className="avatar avatar-overflow">
            <span className="avatar-fallback">+{overflow}</span>
          </span>
        ) : null}
      </div>
    );
  },
);
AvatarGroup.displayName = "AvatarGroup";

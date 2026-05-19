"use client";

import * as React from "react";
import { cn } from "@motive/ds";

export interface MobileTabItem {
  id: string;
  label: React.ReactNode;
  shortLabel?: React.ReactNode;
  href?: string;
  current?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MobileTabBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MobileTabItem[];
  ariaLabel?: string;
}

/**
 * MobileTabBar — iOS-style segmented control. Use as a horizontal nav at
 * narrow widths where a multi-step horizontal flow would otherwise wrap.
 */
export const MobileTabBar = React.forwardRef<HTMLDivElement, MobileTabBarProps>(
  ({ items, className, ariaLabel = "Sections", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        data-count={items.length}
        className={cn("motive-mobile-tabs", className)}
        {...props}
      >
        {items.map((item) =>
          item.href ? (
            <a
              key={item.id}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              data-active={item.current || undefined}
              aria-disabled={item.disabled || undefined}
              className="motive-mobile-tab"
              role="tab"
              tabIndex={item.disabled ? -1 : 0}
            >
              {item.shortLabel ?? item.label}
            </a>
          ) : (
            <button
              key={item.id}
              type="button"
              data-active={item.current || undefined}
              disabled={item.disabled}
              onClick={item.onSelect}
              className="motive-mobile-tab"
              role="tab"
              aria-selected={item.current || undefined}
            >
              {item.shortLabel ?? item.label}
            </button>
          ),
        )}
      </div>
    );
  },
);
MobileTabBar.displayName = "MobileTabBar";

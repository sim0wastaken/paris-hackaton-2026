"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../cn";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Items above this count collapse to first / ellipsis / last 2. */
  maxItems?: number;
  separator?: React.ReactNode;
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, maxItems = 4, separator, className, ...props }, ref) => {
    const collapsed = items.length > maxItems;
    const visible: (BreadcrumbItem | { ellipsis: true; hidden: BreadcrumbItem[] })[] = collapsed
      ? [
          items[0]!,
          { ellipsis: true as const, hidden: items.slice(1, items.length - 2) },
          ...items.slice(-2),
        ]
      : items;
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("motive-breadcrumb", className)}
        {...props}
      >
        <ol className="motive-breadcrumb-list">
          {visible.map((node, idx) => {
            const isLast = idx === visible.length - 1;
            if ("ellipsis" in node) {
              return (
                <React.Fragment key={`ellipsis-${idx}`}>
                  <li className="motive-breadcrumb-item motive-breadcrumb-ellipsis">
                    <span aria-label={`${node.hidden.length} hidden items`}>
                      <MoreHorizontal size={14} />
                    </span>
                  </li>
                  <li className="motive-breadcrumb-sep" aria-hidden="true">
                    {separator ?? <ChevronRight size={12} strokeWidth={2} />}
                  </li>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={`${idx}-${typeof node.label === "string" ? node.label : idx}`}>
                <li
                  className={cn(
                    "motive-breadcrumb-item",
                    node.current && "motive-breadcrumb-current",
                  )}
                  aria-current={node.current ? "page" : undefined}
                >
                  {node.href && !node.current ? (
                    <a href={node.href}>{node.label}</a>
                  ) : (
                    <span>{node.label}</span>
                  )}
                </li>
                {!isLast && (
                  <li className="motive-breadcrumb-sep" aria-hidden="true">
                    {separator ?? <ChevronRight size={12} strokeWidth={2} />}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  },
);
Breadcrumb.displayName = "Breadcrumb";

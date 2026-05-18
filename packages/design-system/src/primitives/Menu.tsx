"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuTrigger as RACMenuTrigger,
  Popover as RACPopover,
  Separator as RACSeparator,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps as RACMenuProps,
} from "react-aria-components";
import { cn } from "../cn";

export const MenuTrigger = RACMenuTrigger;

export interface MenuProps<T extends object>
  extends Omit<RACMenuProps<T>, "className" | "children"> {
  children?: React.ReactNode;
  className?: string;
  popoverClassName?: string;
}

export function Menu<T extends object>({
  className,
  popoverClassName,
  children,
  ...props
}: MenuProps<T>) {
  return (
    <RACPopover offset={6} className={cn("motive-popover", popoverClassName)}>
      <RACMenu className={cn("outline-none", className)} {...props}>
        {children as React.ReactNode}
      </RACMenu>
    </RACPopover>
  );
}

export interface MenuItemProps extends Omit<RACMenuItemProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
  /** Optional leading glyph. */
  icon?: React.ReactNode;
  /** Optional keyboard shortcut shown right-aligned. */
  shortcut?: string;
  tone?: "default" | "danger";
}

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
  ({ className, children, icon, shortcut, tone = "default", ...props }, ref) => (
    <RACMenuItem
      ref={ref}
      className={cn(
        "motive-menu-item",
        tone === "danger" && "text-[var(--warn)]",
        className,
      )}
      {...props}
    >
      {({ isSelected }) => (
        <>
          {isSelected ? <Check aria-hidden="true" size={14} /> : icon ?? null}
          <span className="flex-1 truncate">{children as React.ReactNode}</span>
          {shortcut ? <kbd className="motive-menu-kbd">{shortcut}</kbd> : null}
        </>
      )}
    </RACMenuItem>
  ),
);
MenuItem.displayName = "MenuItem";

export const MenuSeparator = (props: React.ComponentProps<typeof RACSeparator>) => (
  <RACSeparator {...props} className={cn("h-px bg-[var(--line)] my-1", props.className as string)} />
);

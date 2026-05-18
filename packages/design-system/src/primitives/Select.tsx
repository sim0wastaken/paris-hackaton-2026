"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  Button as RACButton,
  Label as RACLabel,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  Popover as RACPopover,
  Select as RACSelect,
  SelectValue as RACSelectValue,
  type ListBoxItemProps,
  type SelectProps as RACSelectProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface SelectProps<T extends object>
  extends Omit<RACSelectProps<T>, "className" | "children" | "placeholder"> {
  label?: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function Select<T extends object>({
  label,
  placeholder = "Select…",
  className,
  children,
  ...props
}: SelectProps<T>) {
  return (
    <RACSelect className={cn("field", className)} {...props}>
      {label ? <RACLabel className="field-label">{label}</RACLabel> : null}
      <RACButton className="motive-select-trigger">
        <RACSelectValue className="motive-select-value">
          {({ defaultChildren, isPlaceholder }) =>
            isPlaceholder ? <span className="motive-select-placeholder">{placeholder}</span> : defaultChildren
          }
        </RACSelectValue>
        <ChevronDown aria-hidden="true" size={16} className="motive-select-chevron" />
      </RACButton>
      <RACPopover offset={6} className="motive-popover motive-select-popover">
        <RACListBox className="motive-listbox">
          {children as React.ReactNode}
        </RACListBox>
      </RACPopover>
    </RACSelect>
  );
}

export interface SelectItemProps extends Omit<ListBoxItemProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <RACListBoxItem
      ref={ref}
      className={cn("motive-menu-item motive-listbox-item", className)}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span className="flex-1 truncate">{children as React.ReactNode}</span>
          {isSelected ? <Check aria-hidden="true" size={14} className="text-[var(--acid)]" /> : null}
        </>
      )}
    </RACListBoxItem>
  ),
);
SelectItem.displayName = "SelectItem";

"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Button as RACButton,
  ComboBox as RACComboBox,
  Group as RACGroup,
  Input as RACInput,
  Label as RACLabel,
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  Popover as RACPopover,
  type ComboBoxProps as RACComboBoxProps,
  type ListBoxItemProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface ComboboxProps<T extends object>
  extends Omit<RACComboBoxProps<T>, "className" | "children"> {
  label?: React.ReactNode;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Combobox<T extends object>({
  label,
  placeholder,
  className,
  children,
  ...props
}: ComboboxProps<T>) {
  return (
    <RACComboBox className={cn("field", className)} {...props}>
      {label ? <RACLabel className="field-label">{label}</RACLabel> : null}
      <RACGroup className="motive-combobox-group">
        <RACInput className="input motive-combobox-input" placeholder={placeholder} />
        <RACButton className="motive-combobox-button">
          <ChevronDown aria-hidden="true" size={16} />
        </RACButton>
      </RACGroup>
      <RACPopover offset={6} className="motive-popover motive-select-popover">
        <RACListBox className="motive-listbox">{children as React.ReactNode}</RACListBox>
      </RACPopover>
    </RACComboBox>
  );
}

export interface ComboboxItemProps extends Omit<ListBoxItemProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(
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
ComboboxItem.displayName = "ComboboxItem";

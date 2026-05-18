import * as React from "react";
import { Switch as RACSwitch, type SwitchProps as RACSwitchProps } from "react-aria-components";
import { cn } from "../cn";

export interface SwitchProps extends Omit<RACSwitchProps, "children" | "className"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

/**
 * Switch wraps React Aria's Switch primitive — keyboard activation, focus-visible
 * styling, and aria semantics handled by RAC. Visual state is driven by
 * `data-[selected]`, `data-[focus-visible]`, and `data-[hovered]` attributes.
 */
export const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  ({ className, label, description, ...props }, ref) => (
    <RACSwitch ref={ref} className={cn("motive-switch", className)} {...props}>
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      {label || description ? (
        <span className="motive-switch-text">
          {label ? <span className="motive-switch-label">{label}</span> : null}
          {description ? (
            <span className="motive-switch-description">{description}</span>
          ) : null}
        </span>
      ) : null}
    </RACSwitch>
  ),
);
Switch.displayName = "Switch";

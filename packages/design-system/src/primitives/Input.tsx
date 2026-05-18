import * as React from "react";
import { Input as RACInput, type InputProps as RACInputProps } from "react-aria-components";
import { cn } from "../cn";

export interface InputProps extends RACInputProps {
  invalid?: boolean;
  hasIcon?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, hasIcon, ...props }, ref) => (
    <RACInput
      ref={ref}
      className={cn(
        "input",
        hasIcon && "has-icon",
        invalid && "input-invalid",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

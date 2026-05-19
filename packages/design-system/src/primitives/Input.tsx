import * as React from "react";
import { Check } from "lucide-react";
import { Input as RACInput, type InputProps as RACInputProps } from "react-aria-components";
import { cn } from "../cn";
import { Spinner } from "./Spinner";

type InputState = "idle" | "loading" | "success" | "error";

export interface InputProps extends Omit<RACInputProps, "readOnly"> {
  invalid?: boolean;
  hasIcon?: boolean;
  state?: InputState;
  readOnly?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, hasIcon, state = "idle", readOnly, ...props }, ref) => {
    const showTrailing = state === "loading" || state === "success";
    return (
      <span className="input-wrap" data-state={state !== "idle" ? state : undefined}>
        <RACInput
          ref={ref}
          readOnly={readOnly}
          aria-invalid={invalid || state === "error" || undefined}
          data-readonly={readOnly || undefined}
          data-state={state !== "idle" ? state : undefined}
          className={cn(
            "input",
            hasIcon && "has-icon",
            showTrailing && "input-has-trailing",
            invalid && "input-invalid",
            typeof className === "string" ? className : undefined,
          )}
          {...props}
        />
        {showTrailing ? (
          <span className="input-trailing" aria-hidden="true">
            {state === "loading" ? <Spinner /> : <Check size={16} strokeWidth={2.5} />}
          </span>
        ) : null}
      </span>
    );
  },
);
Input.displayName = "Input";

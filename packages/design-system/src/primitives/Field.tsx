import * as React from "react";
import {
  FieldError,
  Label,
  Text as RACText,
  TextField,
  type TextFieldProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface FieldProps extends Omit<TextFieldProps, "children" | "className"> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Field wraps React Aria's TextField — Label, Input (or Textarea), description,
 * and error message are wired together with aria-describedby + aria-errormessage
 * automatically. Use with the design-system `Input` or `Textarea` primitives.
 */
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ label, hint, error, required, className, children, ...props }, ref) => (
    <TextField
      ref={ref}
      className={cn("field", className)}
      isRequired={required}
      isInvalid={!!error}
      {...props}
    >
      <Label className="field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {children}
      {hint ? (
        <RACText slot="description" className="field-hint">
          {hint}
        </RACText>
      ) : null}
      {error ? <FieldError className="field-error">{error}</FieldError> : null}
    </TextField>
  ),
);
Field.displayName = "Field";

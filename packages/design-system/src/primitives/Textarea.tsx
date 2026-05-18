import * as React from "react";
import { TextArea as RACTextArea, type TextAreaProps } from "react-aria-components";
import { cn } from "../cn";

export interface TextareaProps extends TextAreaProps {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <RACTextArea
      ref={ref}
      className={cn(
        "textarea",
        invalid && "textarea-invalid",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

import * as React from "react";
import { Card } from "./Card";
import { Heading } from "./Heading";
import { Kicker } from "./Kicker";
import { Stack } from "./Stack";
import { cn } from "../cn";

export interface EmptyStateProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "inset" | "glass";
}

export const EmptyState = React.forwardRef<HTMLElement, EmptyStateProps>(
  (
    {
      eyebrow,
      title,
      description,
      illustration,
      action,
      children,
      className,
      variant = "default",
    },
    ref,
  ) => (
    <Card
      ref={ref}
      as="section"
      variant={variant === "glass" ? "glass" : variant === "inset" ? "inset" : "default"}
      className={cn("empty-state text-center mx-auto max-w-prose", className)}
    >
      <Stack gap={4} align="center">
        {illustration ? <div className="empty-state-illustration">{illustration}</div> : null}
        {eyebrow ? <Kicker tone="muted">{eyebrow}</Kicker> : null}
        <Heading level={4}>{title}</Heading>
        {description ? <p className="t-small">{description}</p> : null}
        {children ? <div>{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </Stack>
    </Card>
  ),
);
EmptyState.displayName = "EmptyState";

import * as React from "react";
import { cn } from "../cn";
import { Kicker } from "./Kicker";
import { Heading } from "./Heading";
import { Text } from "./Text";

type Align = "start" | "center";

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: Align;
  actions?: React.ReactNode;
  level?: 1 | 2 | 3;
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    { kicker, title, lede, align = "start", actions, level = 2, className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
      {...props}
    >
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <Heading level={level} balance>
        {title}
      </Heading>
      {lede ? (
        <Text variant="lede" tone="muted" className="max-w-[680px]">
          {lede}
        </Text>
      ) : null}
      {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
    </div>
  ),
);
SectionHeader.displayName = "SectionHeader";

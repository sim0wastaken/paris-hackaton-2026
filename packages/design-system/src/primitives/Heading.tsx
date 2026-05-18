import * as React from "react";
import { cn } from "../cn";

type Level = 1 | 2 | 3 | 4;

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: Level;
  as?: Level;
  balance?: boolean;
}

const tagFor = (level: Level) =>
  (`h${level}` as "h1" | "h2" | "h3" | "h4");

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level, as, balance, className, style, ...props }, ref) => {
    const Tag = tagFor(as ?? level);
    return (
      <Tag
        ref={ref}
        className={cn(`t-h${level}`, className)}
        style={balance ? { textWrap: "balance", ...style } : style}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

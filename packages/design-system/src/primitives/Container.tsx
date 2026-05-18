import * as React from "react";
import { cn } from "../cn";

type Size = "narrow" | "default" | "wide" | "full";

const sizeStyle: Record<Size, React.CSSProperties> = {
  narrow: { maxWidth: "760px" },
  default: { maxWidth: "var(--maxw)" },
  wide: { maxWidth: "1440px" },
  full: { maxWidth: "100%" },
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Size;
  padded?: boolean;
  as?: React.ElementType;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "default", padded = true, as: Tag = "div", className, style, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("mx-auto w-full", className)}
      style={{
        ...sizeStyle[size],
        ...(padded ? { paddingLeft: "var(--pad)", paddingRight: "var(--pad)" } : null),
        ...style,
      }}
      {...props}
    />
  ),
);
Container.displayName = "Container";

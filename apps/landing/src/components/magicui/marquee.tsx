import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean;
  reverse?: boolean;
  repeat?: number;
  duration?: string;
}

export function Marquee({
  className,
  pauseOnHover = false,
  reverse = false,
  repeat = 2,
  duration = "40s",
  children,
  style,
  ...props
}: MarqueeProps) {
  return (
    <div
      className={cn("marquee", pauseOnHover && "marquee--pause-hover", className)}
      style={{ ...style, ["--duration" as string]: duration }}
      {...props}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className="marquee-track"
          aria-hidden={i > 0 ? "true" : undefined}
          style={reverse ? { animationDirection: "reverse" } : undefined}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Button as RACButton, type ButtonProps as RACButtonProps } from "react-aria-components";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";
import { Dot } from "./Dot";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      acid: "btn-primary",
      ghost: "btn-ghost",
      ghostDark: "btn-ghost-dark",
      quiet: "btn-quiet",
    },
    size: {
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends Omit<RACButtonProps, "className" | "children" | "onClick">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  /** Convenience alias for `onPress` so existing onClick handlers keep working. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Equivalent to native `disabled` — translated to RAC's `isDisabled`. */
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      onClick,
      onPress,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const isDisabled = disabled || loading;
    const leading = loading ? <Dot pulse /> : iconLeft;

    // asChild routes through Radix Slot so links / NextLink can be rendered as buttons.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          aria-disabled={isDisabled || undefined}
          data-loading={loading || undefined}
        >
          {React.isValidElement(children)
            ? React.cloneElement(
                children as React.ReactElement<{ children?: React.ReactNode }>,
                undefined,
                <>
                  {leading}
                  {(children as React.ReactElement<{ children?: React.ReactNode }>).props.children}
                  {iconRight}
                </>,
              )
            : children}
        </Slot>
      );
    }

    // Normalize legacy onClick into RAC's onPress so consumers don't need to migrate.
    const handlePress =
      onPress ??
      (onClick
        ? () => {
            (onClick as unknown as () => void)();
          }
        : undefined);

    return (
      <RACButton
        ref={ref}
        className={classes}
        isDisabled={isDisabled}
        onPress={handlePress}
        data-loading={loading || undefined}
        {...props}
      >
        {leading}
        {children}
        {iconRight}
      </RACButton>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

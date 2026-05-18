"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";
import { Spinner } from "./Spinner";

const buttonVariants = cva("btn motive-focus-ring", {
  variants: {
    variant: {
      primary: "btn-primary",
      acid: "btn-primary",
      ghost: "btn-ghost",
      ghostDark: "btn-ghost-dark",
      quiet: "btn-quiet",
      danger: "btn-danger",
      success: "btn-success",
    },
    size: {
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
      xl: "btn-xl",
    },
    shape: {
      pill: "",
      icon: "btn-icon",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    shape: "pill",
  },
});

type ButtonState = "idle" | "loading" | "success" | "error";

export interface ButtonProps
  extends Omit<RACButtonProps, "className" | "children" | "onClick" | "onPress">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** When set, drives a one-shot animation (success pulse / error shake). */
  state?: ButtonState;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  /** Convenience alias — translates to RAC's onPress under the hood. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Native disabled — forwarded as RAC's isDisabled. */
  disabled?: boolean;
  onPress?: RACButtonProps["onPress"];
  /** Optional async handler. While pending, Button shows loading; on resolve
   *  shows success state for ~700ms; on reject shows error shake. */
  onPressAsync?: () => Promise<unknown>;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      asChild = false,
      loading: loadingProp = false,
      state: stateProp,
      disabled,
      iconLeft,
      iconRight,
      onClick,
      onPress,
      onPressAsync,
      children,
      ...props
    },
    ref,
  ) => {
    const [asyncState, setAsyncState] = React.useState<ButtonState>("idle");
    const stateClearRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(
      () => () => {
        if (stateClearRef.current) clearTimeout(stateClearRef.current);
      },
      [],
    );

    const effectiveState: ButtonState = stateProp ?? asyncState;
    const loading = loadingProp || effectiveState === "loading";
    const classes = cn(
      buttonVariants({ variant, size, shape }),
      shape === "icon" && !iconRight && !iconLeft && children ? "btn-icon" : null,
      className,
    );
    const isDisabled = disabled || loading;

    const leading = loading ? <Spinner aria-hidden="true" /> : iconLeft;

    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={classes}
          aria-disabled={isDisabled || undefined}
          data-loading={loading || undefined}
          data-state={effectiveState !== "idle" ? effectiveState : undefined}
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

    const handlePress: RACButtonProps["onPress"] = async (event) => {
      if (onPress) onPress(event);
      if (onClick) (onClick as unknown as () => void)();
      if (!onPressAsync) return;
      if (stateClearRef.current) clearTimeout(stateClearRef.current);
      setAsyncState("loading");
      try {
        await onPressAsync();
        setAsyncState("success");
        stateClearRef.current = setTimeout(() => setAsyncState("idle"), 1100);
      } catch {
        setAsyncState("error");
        stateClearRef.current = setTimeout(() => setAsyncState("idle"), 800);
      }
    };

    return (
      <RACButton
        ref={ref}
        className={classes}
        isDisabled={isDisabled}
        onPress={handlePress}
        data-loading={loading || undefined}
        data-state={effectiveState !== "idle" ? effectiveState : undefined}
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

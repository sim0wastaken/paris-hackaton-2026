"use client";

import * as React from "react";

export type AsyncActionState = "idle" | "loading" | "success" | "error";

export interface UseAsyncActionOptions {
  successHoldMs?: number;
  errorHoldMs?: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export interface AsyncActionApi<Args extends unknown[], R> {
  state: AsyncActionState;
  error: unknown;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
  run: (...args: Args) => Promise<R | undefined>;
}

/**
 * useAsyncAction — small wrapper around an async function that exposes the
 * idle/loading/success/error machine the Button (and other primitives) consume
 * via `data-state` for one-shot success pulses and error shakes.
 */
export function useAsyncAction<Args extends unknown[], R>(
  action: (...args: Args) => Promise<R>,
  { successHoldMs = 900, errorHoldMs = 700, onSuccess, onError }: UseAsyncActionOptions = {},
): AsyncActionApi<Args, R> {
  const [state, setState] = React.useState<AsyncActionState>("idle");
  const [error, setError] = React.useState<unknown>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const reset = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState("idle");
    setError(null);
  }, []);

  const run = React.useCallback(
    async (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      setState("loading");
      setError(null);
      try {
        const result = await action(...args);
        setState("success");
        onSuccess?.();
        timer.current = setTimeout(() => setState("idle"), successHoldMs);
        return result;
      } catch (caught) {
        setState("error");
        setError(caught);
        onError?.(caught);
        timer.current = setTimeout(() => setState("idle"), errorHoldMs);
        return undefined;
      }
    },
    [action, errorHoldMs, onError, onSuccess, successHoldMs],
  );

  return {
    state,
    error,
    isLoading: state === "loading",
    isSuccess: state === "success",
    isError: state === "error",
    reset,
    run,
  };
}

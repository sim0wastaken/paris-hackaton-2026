"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast, type ToasterProps } from "sonner";

export type ToastProviderProps = ToasterProps;

/**
 * ToastProvider — Motive-themed Sonner Toaster. Drop once near the root of the app.
 * Use the `toast` export below from anywhere ("client" only) to dispatch.
 */
export function ToastProvider({
  theme = "dark",
  richColors = false,
  closeButton = true,
  duration = 4500,
  position = "bottom-right",
  ...props
}: ToastProviderProps) {
  return (
    <SonnerToaster
      theme={theme}
      richColors={richColors}
      closeButton={closeButton}
      duration={duration}
      position={position}
      visibleToasts={4}
      gap={10}
      offset={20}
      {...props}
    />
  );
}

export const toast = sonnerToast;

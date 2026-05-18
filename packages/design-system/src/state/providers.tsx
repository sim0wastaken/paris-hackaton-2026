"use client";

import * as React from "react";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { QueryProvider } from "./query";
import { ToastProvider } from "../primitives/Toast";

export interface MotiveProvidersProps {
  locale?: string;
  /** Pass when integrating with Next.js so RAC Links go through the router. */
  navigate?: (path: string, opts?: { replace?: boolean }) => void;
  /** Skip the bottom-right Sonner mount (e.g. if a parent already mounts one). */
  noToaster?: boolean;
  /** Hide the floating React Query devtools button. */
  noDevtools?: boolean;
  children: React.ReactNode;
}

/**
 * MotiveProviders — single-import shell that wires up:
 *   • TanStack Query (server state + cache)
 *   • RAC RouterProvider (so RAC <Link>s route via Next)
 *   • RAC I18nProvider (locale + dir for date/number formatting)
 *   • Sonner Toaster (toasts via toast() from "@motive/ds")
 *
 * Drop once at the root of every Motive app. Cross-cutting client UI state
 * lives in `useMotiveUI` (zustand) which does not need a provider.
 */
export function MotiveProviders({
  locale = "en-US",
  navigate,
  noToaster,
  noDevtools,
  children,
}: MotiveProvidersProps) {
  const inner = (
    <I18nProvider locale={locale}>
      <QueryProvider devtools={!noDevtools}>
        {children}
        {!noToaster ? <ToastProvider /> : null}
      </QueryProvider>
    </I18nProvider>
  );

  if (!navigate) return inner;
  return <RouterProvider navigate={navigate}>{inner}</RouterProvider>;
}

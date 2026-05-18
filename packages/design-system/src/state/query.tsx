"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export interface QueryProviderProps {
  /** Pass a pre-built client if you need to share it across boundaries. */
  client?: QueryClient;
  /** Show the devtools floating button (defaults to NODE_ENV !== "production"). */
  devtools?: boolean;
  children: React.ReactNode;
}

function buildClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep server state fresh enough for the streaming HITL flows but avoid
        // hammering routes on every focus event.
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: unknown) => {
          // Don't retry 4xx (it's our fault), do retry transient 5xx up to 3x.
          const status = (error as { status?: number } | null)?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ client, devtools, children }: QueryProviderProps) {
  const [internal] = React.useState(() => client ?? buildClient());
  const showDevtools = devtools ?? process.env.NODE_ENV !== "production";

  return (
    <QueryClientProvider client={internal}>
      {children}
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}

export { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export type ProviderName = "openai" | "tavily" | "fal";

export type ProviderResult<T> =
  | {
      provider: ProviderName;
      status: "ready";
      data: T;
      raw: unknown;
      requestId: string;
    }
  | {
      provider: ProviderName;
      status: "skipped";
      reason: string;
      requestId: string;
    }
  | {
      provider: ProviderName;
      status: "failed";
      reason: string;
      raw?: unknown;
      requestId: string;
    };

import type { TavilyClient } from "@tavily/core";

export type ProviderOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
  tavilyClient?: TavilyClient;
};

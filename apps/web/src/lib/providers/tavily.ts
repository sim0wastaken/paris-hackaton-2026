import {
  tavily,
  type TavilyClient,
  type TavilyCrawlResponse,
  type TavilyExtractResponse,
  type TavilySearchResponse
} from "@tavily/core";

import type { ProviderOptions, ProviderResult } from "./types";

export type TavilyExtractDepth = "basic" | "advanced";
export type TavilyCrawlPage = TavilyCrawlResponse["results"][number];
export type { TavilyClient, TavilyCrawlResponse, TavilyExtractResponse, TavilySearchResponse };

function resolveClient(options: ProviderOptions): TavilyClient | null {
  if (options.tavilyClient) return options.tavilyClient;
  const apiKey = options.apiKey ?? process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  return tavily({ apiKey });
}

function skipped(requestId: string): ProviderResult<never> {
  return {
    provider: "tavily",
    status: "skipped",
    reason: "TAVILY_API_KEY is not configured",
    requestId
  };
}

function failed(requestId: string, err: unknown, prefix: string): ProviderResult<never> {
  const message = err instanceof Error ? err.message : String(err);
  return {
    provider: "tavily",
    status: "failed",
    reason: `${prefix}: ${message}`,
    raw: err,
    requestId
  };
}

export async function extractUrlWithTavily(
  input: { url: string; requestId: string; extractDepth?: TavilyExtractDepth },
  options: ProviderOptions = {}
): Promise<ProviderResult<{ content: string; url: string }>> {
  const client = resolveClient(options);
  if (!client) return skipped(input.requestId);

  try {
    const raw = await client.extract([input.url], {
      extractDepth: input.extractDepth ?? "basic",
      format: "markdown",
      includeImages: false,
      includeFavicon: true,
      includeUsage: true
    });
    return {
      provider: "tavily",
      status: "ready",
      data: {
        content: raw.results.map((r) => r.rawContent).filter(Boolean).join("\n\n"),
        url: input.url
      },
      raw,
      requestId: input.requestId
    };
  } catch (err) {
    return failed(input.requestId, err, "tavily_extract_failed");
  }
}

export type CrawlBrandSiteInput = {
  url: string;
  requestId: string;
  instructions?: string;
  selectPaths?: string[];
  excludePaths?: string[];
  maxDepth?: number;
  limit?: number;
  extractDepth?: TavilyExtractDepth;
  allowExternal?: boolean;
};

export async function crawlBrandSite(
  input: CrawlBrandSiteInput,
  options: ProviderOptions = {}
): Promise<ProviderResult<TavilyCrawlResponse>> {
  const client = resolveClient(options);
  if (!client) return skipped(input.requestId);

  try {
    const raw = await client.crawl(input.url, {
      maxDepth: input.maxDepth ?? 2,
      limit: input.limit ?? 12,
      extractDepth: input.extractDepth ?? "advanced",
      format: "markdown",
      includeImages: false,
      includeFavicon: true,
      allowExternal: input.allowExternal ?? false,
      ...(input.instructions ? { instructions: input.instructions } : {}),
      ...(input.selectPaths ? { selectPaths: input.selectPaths } : {}),
      ...(input.excludePaths ? { excludePaths: input.excludePaths } : {})
    });
    return {
      provider: "tavily",
      status: "ready",
      data: raw,
      raw,
      requestId: input.requestId
    };
  } catch (err) {
    return failed(input.requestId, err, "tavily_crawl_failed");
  }
}

export type SearchBrandContextInput = {
  query: string;
  requestId: string;
  maxResults?: number;
  excludeDomains?: string[];
  topic?: "general" | "news";
};

export async function searchBrandContext(
  input: SearchBrandContextInput,
  options: ProviderOptions = {}
): Promise<ProviderResult<TavilySearchResponse>> {
  const client = resolveClient(options);
  if (!client) return skipped(input.requestId);

  try {
    const raw = await client.search(input.query, {
      maxResults: input.maxResults ?? 5,
      topic: input.topic ?? "general",
      includeAnswer: "basic",
      includeRawContent: false,
      ...(input.excludeDomains?.length ? { excludeDomains: input.excludeDomains } : {})
    });
    return {
      provider: "tavily",
      status: "ready",
      data: raw,
      raw,
      requestId: input.requestId
    };
  } catch (err) {
    return failed(input.requestId, err, "tavily_search_failed");
  }
}

export function extractTavilyFailureReason(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { failedResults?: Array<{ error?: unknown }>; failed_results?: Array<{ error?: unknown }> };
  const failed = obj.failedResults ?? obj.failed_results;
  if (!Array.isArray(failed) || failed.length === 0) return null;
  const first = failed[0]?.error;
  return typeof first === "string" ? first : null;
}

export function getTavilyPageContent(page: { rawContent?: string | null }): string {
  return page.rawContent ?? "";
}

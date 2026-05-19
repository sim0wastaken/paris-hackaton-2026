import { z } from "zod";

import type { ProviderOptions, ProviderResult } from "./types";

export type TavilyExtractDepth = "basic" | "advanced";

const tavilyExtractResultSchema = z.object({
  results: z
    .array(
      z.object({
        url: z.string(),
        raw_content: z.string().nullable().optional(),
        rawContent: z.string().nullable().optional(),
        content: z.string().nullable().optional(),
        favicon: z.string().nullable().optional()
      })
    )
    .default([]),
  failed_results: z
    .array(z.object({ url: z.string().optional(), error: z.string().optional() }).passthrough())
    .optional()
});

const tavilyCrawlPageSchema = z.object({
  url: z.string(),
  raw_content: z.string().nullable().optional(),
  rawContent: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  favicon: z.string().nullable().optional()
});

const tavilyCrawlResultSchema = z.object({
  base_url: z.string().optional(),
  results: z.array(tavilyCrawlPageSchema).default([]),
  failed_results: z
    .array(z.object({ url: z.string().optional(), error: z.string().optional() }).passthrough())
    .optional(),
  response_time: z.number().optional()
});

const tavilySearchResultSchema = z.object({
  query: z.string().optional(),
  answer: z.string().nullable().optional(),
  results: z
    .array(
      z.object({
        title: z.string().optional(),
        url: z.string(),
        content: z.string().optional(),
        score: z.number().optional(),
        published_date: z.string().nullable().optional()
      })
    )
    .default([])
});

export type TavilyExtractResult = z.infer<typeof tavilyExtractResultSchema>;
export type TavilyCrawlResult = z.infer<typeof tavilyCrawlResultSchema>;
export type TavilyCrawlPage = z.infer<typeof tavilyCrawlPageSchema>;
export type TavilySearchResult = z.infer<typeof tavilySearchResultSchema>;

const TAVILY_BASE = "https://api.tavily.com";

export async function extractUrlWithTavily(
  input: {
    url: string;
    requestId: string;
    extractDepth?: TavilyExtractDepth;
  },
  options: ProviderOptions = {}
): Promise<ProviderResult<{ content: string; url: string }>> {
  const apiKey = options.apiKey ?? process.env.TAVILY_API_KEY;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "tavily",
      status: "skipped",
      reason: "TAVILY_API_KEY is not configured",
      requestId: input.requestId
    };
  }

  const response = await fetcher(`${TAVILY_BASE}/extract`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      urls: [input.url],
      extract_depth: input.extractDepth ?? "basic",
      format: "markdown",
      include_images: false,
      include_favicon: true,
      include_usage: true
    })
  });
  const raw = await response.json().catch(() => undefined);

  if (!response.ok) {
    return {
      provider: "tavily",
      status: "failed",
      reason: `Tavily request failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  return {
    provider: "tavily",
    status: "ready",
    data: {
      content: extractContent(raw),
      url: input.url
    },
    raw,
    requestId: input.requestId
  };
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
): Promise<ProviderResult<TavilyCrawlResult>> {
  const apiKey = options.apiKey ?? process.env.TAVILY_API_KEY;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "tavily",
      status: "skipped",
      reason: "TAVILY_API_KEY is not configured",
      requestId: input.requestId
    };
  }

  const response = await fetcher(`${TAVILY_BASE}/crawl`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      url: input.url,
      max_depth: input.maxDepth ?? 2,
      limit: input.limit ?? 12,
      extract_depth: input.extractDepth ?? "advanced",
      format: "markdown",
      include_images: false,
      include_favicon: true,
      allow_external: input.allowExternal ?? false,
      ...(input.instructions ? { instructions: input.instructions } : {}),
      ...(input.selectPaths ? { select_paths: input.selectPaths } : {}),
      ...(input.excludePaths ? { exclude_paths: input.excludePaths } : {})
    })
  });
  const raw = await response.json().catch(() => undefined);

  if (!response.ok) {
    return {
      provider: "tavily",
      status: "failed",
      reason: `Tavily crawl failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  const parsed = tavilyCrawlResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      provider: "tavily",
      status: "failed",
      reason: `tavily_invalid_response_shape: ${parsed.error.issues
        .slice(0, 3)
        .map((issue) => issue.path.join(".") || "(root)")
        .join(",")}`,
      raw,
      requestId: input.requestId
    };
  }

  return {
    provider: "tavily",
    status: "ready",
    data: parsed.data,
    raw,
    requestId: input.requestId
  };
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
): Promise<ProviderResult<TavilySearchResult>> {
  const apiKey = options.apiKey ?? process.env.TAVILY_API_KEY;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "tavily",
      status: "skipped",
      reason: "TAVILY_API_KEY is not configured",
      requestId: input.requestId
    };
  }

  const response = await fetcher(`${TAVILY_BASE}/search`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: input.query,
      max_results: input.maxResults ?? 5,
      topic: input.topic ?? "general",
      include_answer: "basic",
      include_raw_content: false,
      ...(input.excludeDomains?.length ? { exclude_domains: input.excludeDomains } : {})
    })
  });
  const raw = await response.json().catch(() => undefined);

  if (!response.ok) {
    return {
      provider: "tavily",
      status: "failed",
      reason: `Tavily search failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  const parsed = tavilySearchResultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      provider: "tavily",
      status: "failed",
      reason: `tavily_invalid_response_shape: ${parsed.error.issues
        .slice(0, 3)
        .map((issue) => issue.path.join(".") || "(root)")
        .join(",")}`,
      raw,
      requestId: input.requestId
    };
  }

  return {
    provider: "tavily",
    status: "ready",
    data: parsed.data,
    raw,
    requestId: input.requestId
  };
}

export function extractTavilyFailureReason(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const failed = (raw as { failed_results?: Array<{ error?: unknown }> }).failed_results;
  if (!Array.isArray(failed) || failed.length === 0) return null;
  const first = failed[0]?.error;
  return typeof first === "string" ? first : null;
}

export function getTavilyPageContent(page: TavilyCrawlPage): string {
  return page.raw_content ?? page.rawContent ?? page.content ?? "";
}

function extractContent(raw: unknown): string {
  const parsed = tavilyExtractResultSchema.safeParse(raw);
  if (!parsed.success) return "";
  return parsed.data.results
    .map((result) => result.raw_content ?? result.rawContent ?? result.content ?? "")
    .filter(Boolean)
    .join("\n\n");
}

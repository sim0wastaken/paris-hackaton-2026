import type { ProviderOptions, ProviderResult } from "./types";

export type TavilyExtractDepth = "basic" | "advanced";

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

  const response = await fetcher("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
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

export function extractTavilyFailureReason(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const failed = (raw as { failed_results?: Array<{ error?: unknown }> }).failed_results;
  if (!Array.isArray(failed) || failed.length === 0) return null;
  const first = failed[0]?.error;
  return typeof first === "string" ? first : null;
}

function extractContent(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const results = (raw as { results?: Array<{ raw_content?: string; rawContent?: string; content?: string }> }).results;
  return results
    ?.map((result) => result.raw_content ?? result.rawContent ?? result.content ?? "")
    .join("\n\n") ?? "";
}

import type { ProviderOptions, ProviderResult } from "./types";

export async function extractUrlWithTavily(
  input: {
    url: string;
    requestId: string;
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
      extract_depth: "basic"
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

function extractContent(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const results = (raw as { results?: Array<{ raw_content?: string; content?: string }> }).results;
  return results?.map((result) => result.raw_content ?? result.content ?? "").join("\n\n") ?? "";
}

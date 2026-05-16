import type { ProviderOptions, ProviderResult } from "./types";

export async function generateFalImage(
  input: {
    prompt: string;
    requestId: string;
  },
  options: ProviderOptions = {}
): Promise<ProviderResult<{ imageUrl?: string }>> {
  const apiKey = options.apiKey ?? process.env.FAL_KEY;
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "fal",
      status: "skipped",
      reason: "FAL_KEY is not configured",
      requestId: input.requestId
    };
  }

  const response = await fetcher("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "authorization": `Key ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      prompt: input.prompt,
      image_size: "square"
    })
  });
  const raw = await response.json().catch(() => undefined);

  if (!response.ok) {
    return {
      provider: "fal",
      status: "failed",
      reason: `fal.ai request failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  return {
    provider: "fal",
    status: "ready",
    data: {
      imageUrl: extractImageUrl(raw)
    },
    raw,
    requestId: input.requestId
  };
}

function extractImageUrl(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const images = (raw as { images?: Array<{ url?: string }> }).images;
  return images?.[0]?.url;
}

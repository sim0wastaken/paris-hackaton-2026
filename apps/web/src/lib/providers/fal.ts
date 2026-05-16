import { createFalClient } from "@fal-ai/client";

import type { ProviderOptions, ProviderResult } from "./types";

export async function generateFalImage(
  input: {
    prompt: string;
    requestId: string;
  },
  options: ProviderOptions = {}
): Promise<ProviderResult<{
  imageUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}>> {
  const apiKey = options.apiKey ?? process.env.FAL_KEY;

  if (!apiKey) {
    return {
      provider: "fal",
      status: "skipped",
      reason: "FAL_KEY is not configured",
      requestId: input.requestId
    };
  }

  try {
    const client = createFalClient({
      credentials: apiKey,
      suppressLocalCredentialsWarning: true
    });
    const raw = await client.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: input.prompt,
        image_size: "square_hd",
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
        output_format: "jpeg"
      },
      logs: true
    });
    const image = extractImage(raw);

    if (!image.url) {
      return {
        provider: "fal",
        status: "failed",
        reason: "fal.ai returned no image URL",
        raw,
        requestId: input.requestId
      };
    }

    return {
      provider: "fal",
      status: "ready",
      data: {
        imageUrl: image.url,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType
      },
      raw,
      requestId: input.requestId
    };
  } catch (caught) {
    return {
      provider: "fal",
      status: "failed",
      reason: caught instanceof Error ? caught.message : "fal.ai request failed",
      requestId: input.requestId
    };
  }
}

function extractImage(raw: unknown): {
  url?: string;
  width?: number;
  height?: number;
  mimeType?: string;
} {
  if (!raw || typeof raw !== "object") return {};
  const data = "data" in raw ? (raw as { data?: unknown }).data : raw;
  if (!data || typeof data !== "object") return {};
  const images = (data as {
    images?: Array<{
      url?: string;
      width?: number;
      height?: number;
      content_type?: string;
    }>;
  }).images;
  const first = images?.[0];
  return {
    url: first?.url,
    width: typeof first?.width === "number" ? first.width : undefined,
    height: typeof first?.height === "number" ? first.height : undefined,
    mimeType: first?.content_type
  };
}

import { describe, expect, it, vi } from "vitest";

import { generateFalImage } from "./fal";
import { generateOpenAIText } from "./openai";
import { extractUrlWithTavily } from "./tavily";

describe("provider client boundaries", () => {
  it("skips OpenAI calls when no API key is configured", async () => {
    const fetcher = vi.fn<typeof fetch>();

    const result = await generateOpenAIText(
      { prompt: "Summarize this source", requestId: "req_001" },
      { apiKey: undefined, model: "gpt-5-mini", fetcher }
    );

    expect(result.status).toBe("skipped");
    expect(result.provider).toBe("openai");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("calls Tavily Extract through the provider wrapper", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ results: [{ raw_content: "Homepage copy" }] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await extractUrlWithTavily(
      { url: "https://example.com", requestId: "req_002" },
      { apiKey: "tvly_key", fetcher }
    );

    expect(result.status).toBe("ready");
    expect(result.provider).toBe("tavily");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://api.tavily.com/extract");
  });

  it("skips fal asset generation when no key is configured", async () => {
    const fetcher = vi.fn<typeof fetch>();

    const result = await generateFalImage(
      { prompt: "Square ad image", requestId: "req_003" },
      { apiKey: undefined, fetcher }
    );

    expect(result.status).toBe("skipped");
    expect(result.provider).toBe("fal");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

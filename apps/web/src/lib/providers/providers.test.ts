import { afterEach, describe, expect, it, vi } from "vitest";

import { generateFalImage } from "./fal";
import { generateOpenAIStructuredObject, generateOpenAIText } from "./openai";
import { extractUrlWithTavily } from "./tavily";
import { z } from "zod";

describe("provider client boundaries", () => {
  const originalReasoningEffort = process.env.OPENAI_REASONING_EFFORT;

  afterEach(() => {
    process.env.OPENAI_REASONING_EFFORT = originalReasoningEffort;
  });

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

  it("passes configured reasoning effort to OpenAI Responses calls", async () => {
    process.env.OPENAI_REASONING_EFFORT = "low";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "resp_002", output_text: "Ready" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    await generateOpenAIText(
      { prompt: "Summarize this source", requestId: "req_reasoning" },
      { apiKey: "sk_test", model: "gpt-5.5", fetcher }
    );

    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: "gpt-5.5",
      reasoning: { effort: "low" }
    });
  });

  it("requests OpenAI structured outputs and parses the returned object", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_001",
          output_text: "{\"brand_name\":\"AtlasDesk\",\"confidence\":\"high\"}",
          usage: { input_tokens: 10, output_tokens: 8 }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await generateOpenAIStructuredObject(
      {
        requestId: "req_structured",
        schemaName: "source_recap",
        schema: z.object({
          brand_name: z.string(),
          confidence: z.enum(["low", "medium", "high"])
        }),
        system: "Extract campaign intelligence.",
        prompt: JSON.stringify({ source: "AtlasDesk helps Gmail teams." })
      },
      { apiKey: "sk_test", model: "gpt-5-mini", fetcher }
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.data.object).toEqual({
        brand_name: "AtlasDesk",
        confidence: "high"
      });
    }
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body.text.format).toMatchObject({
      type: "json_schema",
      name: "source_recap",
      strict: true
    });
  });

  it("strips unsupported strict JSON schema keywords before requesting structured output", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_sanitized_schema",
          output_text: "{\"items\":[{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"url\":\"https://atlasdesk.example\",\"label\":\"Valid\"}]}"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await generateOpenAIStructuredObject(
      {
        requestId: "req_sanitized_schema",
        schemaName: "sanitized_schema",
        schema: z.object({
          items: z.array(
            z.object({
              id: z.string().uuid(),
              url: z.url(),
              label: z.string().min(3).max(20)
            }).strict()
          ).min(1)
        }).strict(),
        prompt: "Return valid items."
      },
      { apiKey: "sk_test", model: "gpt-5-mini", fetcher }
    );

    expect(result.status).toBe("ready");
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    const schema = body.text.format.schema;
    const serializedSchema = JSON.stringify(schema);
    expect(serializedSchema).not.toContain("minLength");
    expect(serializedSchema).not.toContain("maxLength");
    expect(serializedSchema).not.toContain("pattern");
    expect(serializedSchema).not.toContain("format");
    expect(serializedSchema).not.toContain("minItems");
  });

  it("uses an optional parseSchema for response validation while sending the strict schema to OpenAI", async () => {
    // OpenAI strict mode does not enforce min/max/pattern/format — after sanitization
    // the model can return values that match the loose shape but violate the strict
    // schema. The caller passes a loose parseSchema so the provider accepts the
    // response and lets downstream validators raise specific errors.
    const strictSchema = z.object({
      title: z.string().min(10),
      target_url: z.url()
    }).strict();
    const looseSchema = z.object({
      title: z.string(),
      target_url: z.string()
    }).strict();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_parse_schema",
          output_text: "{\"title\":\"short\",\"target_url\":\"not a url\"}"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await generateOpenAIStructuredObject(
      {
        requestId: "req_parse_schema",
        schemaName: "loose_parse",
        schema: strictSchema,
        parseSchema: looseSchema,
        prompt: "Return short text."
      },
      { apiKey: "sk_test", model: "gpt-5-mini", fetcher }
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.data.object).toEqual({
        title: "short",
        target_url: "not a url"
      });
    }
  });

  it("includes failing zod paths in the reason when the response violates the parse schema", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_invalid_shape",
          output_text: "{\"title\":42,\"items\":\"oops\"}"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await generateOpenAIStructuredObject(
      {
        requestId: "req_invalid_shape",
        schemaName: "strict_shape",
        schema: z.object({
          title: z.string(),
          items: z.array(z.string())
        }).strict(),
        prompt: "Return valid shape."
      },
      { apiKey: "sk_test", model: "gpt-5-mini", fetcher }
    );

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toContain("did not match the requested schema");
      expect(result.reason).toContain("title");
      expect(result.reason).toContain("items");
    }
  });

  it("parses structured output text from the Responses REST output array", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_rest_001",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: "{\"brand_name\":\"Tradingshenzhen\",\"confidence\":\"high\"}"
                }
              ]
            }
          ],
          usage: { input_tokens: 12, output_tokens: 9 }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const result = await generateOpenAIStructuredObject(
      {
        requestId: "req_structured_rest",
        schemaName: "source_recap",
        schema: z.object({
          brand_name: z.string(),
          confidence: z.enum(["low", "medium", "high"])
        }),
        system: "Extract campaign intelligence.",
        prompt: JSON.stringify({ source: "Tradingshenzhen sells imported electronics." })
      },
      { apiKey: "sk_test", model: "gpt-5.5", fetcher }
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.data.object).toEqual({
        brand_name: "Tradingshenzhen",
        confidence: "high"
      });
    }
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

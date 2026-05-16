import type { ProviderOptions, ProviderResult } from "./types";
import { z, type ZodType } from "zod";

const reasoningEffortSchema = z.enum(["none", "low", "medium", "high", "xhigh"]);

export async function generateOpenAIText(
  input: {
    prompt: string;
    requestId: string;
    system?: string;
  },
  options: ProviderOptions & { model?: string } = {}
): Promise<ProviderResult<{ text: string; model: string }>> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const reasoningEffort = parseReasoningEffort(process.env.OPENAI_REASONING_EFFORT);
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "openai",
      status: "skipped",
      reason: "OPENAI_API_KEY is not configured",
      requestId: input.requestId
    };
  }

  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      reasoning: reasoningEffort ? { effort: reasoningEffort } : undefined,
      input: [
        input.system ? { role: "system", content: input.system } : undefined,
        { role: "user", content: input.prompt }
      ].filter(Boolean)
    })
  });

  const raw = await response.json().catch(() => undefined);
  if (!response.ok) {
    return {
      provider: "openai",
      status: "failed",
      reason: `OpenAI request failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  return {
    provider: "openai",
    status: "ready",
    data: {
      text: extractResponseText(raw),
      model
    },
    raw,
    requestId: input.requestId
  };
}

export async function generateOpenAIStructuredObject<T>(
  input: {
    prompt: string;
    requestId: string;
    schema: ZodType<T>;
    schemaName: string;
    system?: string;
  },
  options: ProviderOptions & { model?: string } = {}
): Promise<
  ProviderResult<{
    object: T;
    model: string;
    responseId: string | null;
    usage: Record<string, unknown>;
  }>
> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_EXTRACTION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const reasoningEffort = parseReasoningEffort(process.env.OPENAI_REASONING_EFFORT);
  const fetcher = options.fetcher ?? fetch;

  if (!apiKey) {
    return {
      provider: "openai",
      status: "skipped",
      reason: "OPENAI_API_KEY is not configured",
      requestId: input.requestId
    };
  }

  const schema = z.toJSONSchema(input.schema) as Record<string, unknown>;
  delete schema.$schema;

  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      reasoning: reasoningEffort ? { effort: reasoningEffort } : undefined,
      input: [
        input.system ? { role: "system", content: input.system } : undefined,
        { role: "user", content: input.prompt }
      ].filter(Boolean),
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          strict: true,
          schema
        }
      }
    })
  });

  const raw = await response.json().catch(() => undefined);
  if (!response.ok) {
    return {
      provider: "openai",
      status: "failed",
      reason: `OpenAI request failed with ${response.status}`,
      raw,
      requestId: input.requestId
    };
  }

  const parsedJson = extractResponseJson(raw);
  const parsedObject = input.schema.safeParse(parsedJson);
  if (!parsedObject.success) {
    return {
      provider: "openai",
      status: "failed",
      reason: "OpenAI response did not match the requested schema",
      raw: {
        response: raw,
        issues: parsedObject.error.issues
      },
      requestId: input.requestId
    };
  }

  return {
    provider: "openai",
    status: "ready",
    data: {
      object: parsedObject.data,
      model,
      responseId: extractResponseId(raw),
      usage: extractUsage(raw)
    },
    raw,
    requestId: input.requestId
  };
}

function parseReasoningEffort(value: unknown): z.infer<typeof reasoningEffortSchema> | undefined {
  const result = reasoningEffortSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

function extractResponseText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const maybeOutputText = (raw as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string") return maybeOutputText;
  return JSON.stringify(raw);
}

function extractResponseJson(raw: unknown): unknown {
  const text = extractResponseText(raw);
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractResponseId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const id = (raw as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

function extractUsage(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const usage = (raw as { usage?: unknown }).usage;
  return usage && typeof usage === "object" && !Array.isArray(usage)
    ? (usage as Record<string, unknown>)
    : {};
}

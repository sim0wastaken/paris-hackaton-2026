import type { ProviderOptions, ProviderResult } from "./types";

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

function extractResponseText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const maybeOutputText = (raw as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string") return maybeOutputText;
  return JSON.stringify(raw);
}

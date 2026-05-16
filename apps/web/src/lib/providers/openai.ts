import "server-only";
import OpenAI from "openai";
import { getServerEnv } from "@/lib/env";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const env = getServerEnv();
  cached = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return cached;
}

export function getOpenAIModel(): string {
  return getServerEnv().OPENAI_MODEL;
}

export function getOpenAIPromptVersion(): string {
  return getServerEnv().OPENAI_EXTRACTION_PROMPT_VERSION;
}

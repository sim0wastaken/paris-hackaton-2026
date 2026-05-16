import "server-only";
import { tavily, type TavilyClient } from "@tavily/core";
import { getServerEnv } from "@/lib/env";

let cached: TavilyClient | null = null;

export function isTavilyConfigured(): boolean {
  return Boolean(getServerEnv().TAVILY_API_KEY);
}

export function getTavily(): TavilyClient {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.TAVILY_API_KEY) {
    throw new Error(
      "[motive] TAVILY_API_KEY is not set. Add it to .env.local or fall back to manual text intake.",
    );
  }
  cached = tavily({ apiKey: env.TAVILY_API_KEY });
  return cached;
}

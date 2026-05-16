import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_EXTRACTION_PROMPT_VERSION: z.string().default("2026-05-16"),

  TAVILY_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  DATABASE_URL: z.string().min(1).optional(),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  DEMO_MODE: z.enum(["live", "seeded", "auto"]).default("auto"),
  ENABLE_DEMO_RESET: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .transform((v) => v === true || v === "true" || v === "1")
    .default(false),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[motive] Invalid server environment variables:\n${issues}\n\nSee .env.example for the full contract.`,
    );
  }
  cached = result.data;
  return cached;
}

export function getProviderAvailability() {
  const env = getServerEnv();
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    tavily: Boolean(env.TAVILY_API_KEY),
    fal: Boolean(env.FAL_KEY),
    inngest_serving: Boolean(env.INNGEST_SIGNING_KEY),
    inngest_sending: Boolean(env.INNGEST_EVENT_KEY),
  };
}

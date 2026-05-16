import { z } from "zod";

const requiredString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1)
);

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  if (["1", "true", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(value.toLowerCase())) return false;
  return value;
}, z.boolean());

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString,
  NEXT_PUBLIC_APP_URL: requiredString
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  DATABASE_URL: requiredString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString.default("gpt-5-mini"),
  OPENAI_EXTRACTION_PROMPT_VERSION: optionalString.default("2026-05-16"),
  TAVILY_API_KEY: optionalString,
  FAL_KEY: optionalString,
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,
  INNGEST_DEV: booleanFromEnv.default(false),
  MOTIVE_DEMO_MODE: booleanFromEnv.default(false)
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export type EnvParseResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      missingKeys: string[];
      formattedError: string;
    };

export class EnvValidationError extends Error {
  readonly missingKeys: string[];

  constructor(missingKeys: string[], formattedError: string) {
    super(`Missing required env: ${missingKeys.join(", ")}`);
    this.name = "EnvValidationError";
    this.missingKeys = missingKeys;
    this.cause = formattedError;
  }
}

export function parseClientEnv(source: NodeJS.ProcessEnv | Record<string, unknown>): EnvParseResult<ClientEnv> {
  return parseEnv(clientEnvSchema, source);
}

export function parseServerEnv(source: NodeJS.ProcessEnv | Record<string, unknown>): EnvParseResult<ServerEnv> {
  return parseEnv(serverEnvSchema, source);
}

export function requireServerEnv(source: NodeJS.ProcessEnv | Record<string, unknown> = process.env): ServerEnv {
  const result = parseServerEnv(source);
  if (!result.success) {
    throw new EnvValidationError(result.missingKeys, result.formattedError);
  }
  return result.data;
}

export function requireClientEnv(source: NodeJS.ProcessEnv | Record<string, unknown> = process.env): ClientEnv {
  const result = parseClientEnv(source);
  if (!result.success) {
    throw new EnvValidationError(result.missingKeys, result.formattedError);
  }
  return result.data;
}

export const clientEnv = parseClientEnv(process.env);
export const serverEnv = parseServerEnv(process.env);

function parseEnv<T extends z.ZodType>(schema: T, source: NodeJS.ProcessEnv | Record<string, unknown>): EnvParseResult<z.infer<T>> {
  const result = schema.safeParse(source);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const missingKeys = Array.from(
    new Set(result.error.issues.map((issue) => String(issue.path[0])))
  ).filter((key) => key !== "undefined");

  return {
    success: false,
    missingKeys,
    formattedError: result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
  };
}

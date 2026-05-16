import { describe, expect, it } from "vitest";

import {
  EnvValidationError,
  parseClientEnv,
  parseServerEnv,
  requireServerEnv
} from "./env";

describe("env parsing", () => {
  it("reports missing public setup keys without throwing", () => {
    const result = parseClientEnv({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.missingKeys).toEqual([
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_APP_URL"
      ]);
    }
  });

  it("parses server env with default OpenAI prompt settings and optional demo mode", () => {
    const result = parseServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      MOTIVE_DEMO_MODE: "true"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.OPENAI_MODEL).toBe("gpt-5-mini");
      expect(result.data.OPENAI_EXTRACTION_PROMPT_VERSION).toBe("2026-05-16");
      expect(result.data.MOTIVE_DEMO_MODE).toBe(true);
    }
  });

  it("throws a clear error when server-only setup is required", () => {
    expect(() => requireServerEnv({})).toThrow(EnvValidationError);
    expect(() => requireServerEnv({})).toThrow(/Missing required env/);
  });
});

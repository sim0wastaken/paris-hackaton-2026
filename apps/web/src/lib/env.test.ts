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
      expect(result.data.OPENAI_REASONING_EFFORT).toBeUndefined();
      expect(result.data.OPENAI_EXTRACTION_MODEL).toBeUndefined();
      expect(result.data.OPENAI_EXTRACTION_PROMPT_VERSION).toBe("2026-05-16");
      expect(result.data.MOTIVE_DEMO_MODE).toBe(true);
      expect(result.data.DEMO_MODE).toBe("auto");
      expect(result.data.ENABLE_DEMO_RESET).toBe(false);
      expect(result.data.DEMO_PROJECT_ID).toBe("00000000-0000-0000-0000-000000000001");
      expect(result.data.DEMO_SEED_VERSION).toBe("2026-05-16.worker-e.v1");
    }
  });

  it("accepts configured OpenAI reasoning effort", () => {
    const result = parseServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      OPENAI_MODEL: "gpt-5.5",
      OPENAI_REASONING_EFFORT: "low"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.OPENAI_MODEL).toBe("gpt-5.5");
      expect(result.data.OPENAI_REASONING_EFFORT).toBe("low");
    }
  });

  it("parses seeded demo mode and reset guard settings", () => {
    const result = parseServerEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      DEMO_MODE: "seeded",
      ENABLE_DEMO_RESET: "true",
      DEMO_PROJECT_ID: "11111111-1111-4111-8111-111111111111",
      DEMO_SEED_VERSION: "2026-05-16.worker-e.v2"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DEMO_MODE).toBe("seeded");
      expect(result.data.ENABLE_DEMO_RESET).toBe(true);
      expect(result.data.DEMO_PROJECT_ID).toBe("11111111-1111-4111-8111-111111111111");
      expect(result.data.DEMO_SEED_VERSION).toBe("2026-05-16.worker-e.v2");
    }
  });

  it("throws a clear error when server-only setup is required", () => {
    expect(() => requireServerEnv({})).toThrow(EnvValidationError);
    expect(() => requireServerEnv({})).toThrow(/Missing required env/);
  });
});

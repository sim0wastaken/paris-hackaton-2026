import { describe, expect, it } from "vitest";

import { buildDemoResetHeaders, readDemoOperatorToken } from "./demo-reset-client";

describe("demo reset client helpers", () => {
  it("adds an operator header only when a token is available", () => {
    expect(buildDemoResetHeaders(null)).toEqual({ "content-type": "application/json" });
    expect(buildDemoResetHeaders("secret-token")).toEqual({
      "content-type": "application/json",
      "x-demo-operator-token": "secret-token"
    });
  });

  it("reads the operator token from the URL and stores it for later reset calls", () => {
    const sessionStorage = memoryStorage();

    expect(readDemoOperatorToken({
      search: "?demo_operator_token=secret-token",
      sessionStorage,
      localStorage: null
    })).toBe("secret-token");
    expect(sessionStorage.getItem("motive_demo_operator_token")).toBe("secret-token");
  });

  it("falls back to stored operator tokens", () => {
    const localStorage = memoryStorage({ motive_demo_operator_token: "stored-token" });

    expect(readDemoOperatorToken({ localStorage, sessionStorage: null })).toBe("stored-token");
  });
});

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    }
  };
}

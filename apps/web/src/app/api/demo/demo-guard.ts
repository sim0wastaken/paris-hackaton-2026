import type { ServerEnv } from "@/lib/env";

export type DemoGuardResult =
  | { allowed: true }
  | {
      allowed: false;
      code: string;
      message: string;
      status: number;
    };

export function demoResetGuard(env: ServerEnv, request: Request): DemoGuardResult {
  if (!env.ENABLE_DEMO_RESET) {
    return {
      allowed: false,
      code: "demo_reset_disabled",
      message: "ENABLE_DEMO_RESET must be true before demo reset can run.",
      status: 403
    };
  }

  const headerToken = request.headers.get("x-demo-operator-token");
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = headerToken ?? bearerToken;
  const tokenAllowed = Boolean(env.DEMO_OPERATOR_TOKEN && token === env.DEMO_OPERATOR_TOKEN);
  const localOrDemo = process.env.NODE_ENV !== "production"
    || env.INNGEST_DEV
    || env.DEMO_MODE === "seeded"
    || env.DEMO_MODE === "auto"
    || env.NEXT_PUBLIC_APP_URL.includes("localhost")
    || env.NEXT_PUBLIC_APP_URL.includes("127.0.0.1");

  if (!localOrDemo && !tokenAllowed) {
    return {
      allowed: false,
      code: "demo_reset_forbidden",
      message: "Demo reset requires a local/demo runtime or a valid operator token.",
      status: 403
    };
  }

  return { allowed: true };
}

import "server-only";
import { fal } from "@fal-ai/client";
import { getServerEnv } from "@/lib/env";

let configured = false;

export function isFalConfigured(): boolean {
  return Boolean(getServerEnv().FAL_KEY);
}

export function getFal(): typeof fal {
  if (configured) return fal;
  const env = getServerEnv();
  if (!env.FAL_KEY) {
    throw new Error(
      "[motive] FAL_KEY is not set. Asset generation will be skipped; the creative prompt will still be persisted.",
    );
  }
  fal.config({ credentials: env.FAL_KEY });
  configured = true;
  return fal;
}
